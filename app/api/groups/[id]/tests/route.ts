import { createClient } from '@/lib/supabase/server';
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
  topic: z.string().default('General'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
});

const createTestSchema = z.object({
  title: z.string().min(2, 'Test title must be at least 2 characters'),
  description: z.string().optional().nullable(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').default(20),
  totalMarks: z.number().min(1).optional(),
  passingMarks: z.number().min(1).default(4),
  isAdaptive: z.boolean().default(false),
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

    // Verify membership in group
    const { data: group } = await supabase.from('Group').select('id, createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 1. Fetch tests via Supabase
    const { data: tests, error: testErr } = await supabase
      .from('GroupMcqTest')
      .select('*')
      .eq('groupId', groupId)
      .order('createdAt', { ascending: false });

    if (testErr || !tests) {
      return NextResponse.json({ tests: [] });
    }

    // 2. Enrich tests with question count & student's attempt
    const enriched = await Promise.all(
      tests.map(async (t: any) => {
        const [{ count: qCount }, { data: myAttemptData }, { count: attemptCount }] = await Promise.all([
          supabase.from('GroupMcqQuestion').select('*', { count: 'exact', head: true }).eq('testId', t.id),
          supabase.from('GroupMcqAttempt').select('*').eq('testId', t.id).eq('userId', user.id).maybeSingle(),
          supabase.from('GroupMcqAttempt').select('*', { count: 'exact', head: true }).eq('testId', t.id),
        ]);

        return {
          id: t.id,
          groupId: t.groupId,
          createdBy: t.createdBy,
          title: t.title,
          description: t.description,
          duration: t.duration,
          totalMarks: t.totalMarks,
          passingMarks: t.passingMarks,
          isAdaptive: t.isAdaptive ?? false,
          startTime: t.startTime,
          endTime: t.endTime,
          isPublished: t.isPublished,
          questionCount: qCount || 0,
          attemptCount: attemptCount || 0,
          myAttempt: myAttemptData || null,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      })
    );

    return NextResponse.json({ tests: enriched });
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

    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only classroom faculty/administrators can create tests.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const {
      title,
      description,
      duration,
      passingMarks,
      isAdaptive,
      startTime,
      endTime,
      isPublished,
      questions,
    } = parsed.data;

    const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

    // 1. Create Test in Supabase
    const { data: test, error: testErr } = await supabase
      .from('GroupMcqTest')
      .insert({
        groupId,
        createdBy: user.id,
        title,
        description: description || null,
        duration: duration || 20,
        totalMarks: calculatedTotalMarks,
        passingMarks: passingMarks || Math.ceil(calculatedTotalMarks * 0.4),
        isAdaptive: isAdaptive ?? false,
        startTime: startTime || null,
        endTime: endTime || null,
        isPublished: isPublished ?? true,
      })
      .select()
      .single();

    if (testErr || !test) {
      throw new Error(testErr?.message || 'Failed to create MCQ test');
    }

    // 2. Insert Questions in bulk with topic and difficulty
    const questionsToInsert = questions.map((q, idx) => ({
      testId: test.id,
      question: q.question,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctOption: q.correctOption,
      marks: q.marks || 1,
      orderIndex: idx,
      topic: q.topic || 'General',
      difficulty: q.difficulty || 'MEDIUM',
    }));

    await supabase.from('GroupMcqQuestion').insert(questionsToInsert);

    return NextResponse.json({ test: { ...test, questionCount: questions.length } }, { status: 201 });
  } catch (err: any) {
    console.error('Create test error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create test' }, { status: 500 });
  }
}
