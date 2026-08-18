import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; testId: string } }
) {
  try {
    const { id: groupId, testId } = params;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
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

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only faculty can access class analytics.' }, { status: 403 });
    }

    // 1. Fetch test
    const test = await prisma.groupMcqTest.findUnique({
      where: { id: testId },
    });

    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    // 2. Fetch total students in classroom
    const totalStudents = await prisma.groupMember.count({
      where: { groupId },
    });

    // 3. Fetch all attempts with student profile using Prisma
    const attempts = await prisma.groupMcqAttempt.findMany({
      where: { testId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { percentage: 'desc' },
    });

    const attemptedCount = attempts.length;
    const notAttemptedCount = Math.max(0, totalStudents - attemptedCount);

    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    let passedCount = 0;

    if (attemptedCount > 0) {
      const scores = attempts.map((a) => Number(a.percentage) || 0);
      const totalScoreSum = scores.reduce((sum, s) => sum + s, 0);
      averageScore = parseFloat((totalScoreSum / attemptedCount).toFixed(2));
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
      passedCount = attempts.filter((a) => a.passed).length;
    }

    const passPercentage = attemptedCount > 0 ? parseFloat(((passedCount / attemptedCount) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      test: {
        ...test,
        createdAt: test.createdAt.toISOString(),
        updatedAt: test.updatedAt.toISOString(),
        startTime: test.startTime?.toISOString() || null,
        endTime: test.endTime?.toISOString() || null,
      },
      analytics: {
        totalStudents,
        attemptedCount,
        notAttemptedCount,
        averageScore,
        highestScore,
        lowestScore,
        passPercentage,
        passedCount,
      },
      submissions: attempts.map((a) => ({
        ...a,
        startedAt: a.startedAt.toISOString(),
        submittedAt: a.submittedAt.toISOString(),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    });
  } catch (err: any) {
    console.error('Fetch test results error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch test results' }, { status: 500 });
  }
}
