import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const questionSchema = z.object({
  question: z.string().min(1, 'Question text cannot be empty'),
  optionA: z.string().min(1, 'Option A is required'),
  optionB: z.string().min(1, 'Option B is required'),
  optionC: z.string().min(1, 'Option C is required'),
  optionD: z.string().min(1, 'Option D is required'),
  correctOption: z.enum(['A', 'B', 'C', 'D']),
  marks: z.number().min(1).default(1),
});

const createTestSchema = z.object({
  title: z.string().min(2, 'Test title must be at least 2 characters'),
  description: z.string().optional().nullable(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').default(20),
  totalMarks: z.number().min(1).optional(),
  passingMarks: z.number().min(1).default(4),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  questions: z.array(questionSchema).min(1, 'Please add at least one question'),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify membership in group via Prisma
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, createdBy: true },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (group.createdBy !== user.id && !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch tests via Prisma
    const pTests = await prisma.groupMcqTest.findMany({
      where: { groupId },
      include: {
        questions: true,
        attempts: { where: { userId: user.id } },
        _count: {
          select: { attempts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = pTests.map((t) => {
      const myAttempt = t.attempts[0] || null;
      return {
        id: t.id,
        groupId: t.groupId,
        createdBy: t.createdBy,
        title: t.title,
        description: t.description,
        duration: t.duration,
        totalMarks: t.totalMarks,
        passingMarks: t.passingMarks,
        startTime: t.startTime ? t.startTime.toISOString() : null,
        endTime: t.endTime ? t.endTime.toISOString() : null,
        isPublished: t.isPublished,
        questionCount: t.questions.length,
        attemptCount: t._count.attempts,
        myAttempt: myAttempt
          ? {
              ...myAttempt,
              startedAt: myAttempt.startedAt.toISOString(),
              submittedAt: myAttempt.submittedAt.toISOString(),
              createdAt: myAttempt.createdAt.toISOString(),
              updatedAt: myAttempt.updatedAt.toISOString(),
            }
          : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ tests: formatted });
  } catch (err: any) {
    console.error('Fetch tests error:', err);
    return NextResponse.json({ tests: [] });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only classroom faculty/administrators can create tests.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { title, description, duration, passingMarks, startTime, endTime, isPublished, questions } = parsed.data;
    const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const newTest = await prisma.groupMcqTest.create({
      data: {
        groupId,
        createdBy: user.id,
        title,
        description: description || null,
        duration: duration || 20,
        totalMarks: calculatedTotalMarks,
        passingMarks: passingMarks || Math.ceil(calculatedTotalMarks * 0.4),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        isPublished: isPublished ?? true,
        questions: {
          create: questions.map((q, idx) => ({
            question: q.question,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            marks: q.marks || 1,
            orderIndex: idx,
          })),
        },
      },
      include: { questions: true },
    });

    return NextResponse.json({ test: { ...newTest, questionCount: newTest.questions.length } }, { status: 201 });
  } catch (err: any) {
    console.error('Create test error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create test' }, { status: 500 });
  }
}
