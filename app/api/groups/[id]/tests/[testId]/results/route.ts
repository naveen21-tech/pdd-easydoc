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
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only faculty can access class analytics.' }, { status: 403 });
    }

    // 1. Fetch test
    const { data: test } = await supabase
      .from('GroupMcqTest')
      .select('*')
      .eq('id', testId)
      .single();

    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 });

    // 2. Fetch total students in classroom
    const { count: totalStudents } = await supabase
      .from('GroupMember')
      .select('*', { count: 'exact', head: true })
      .eq('groupId', groupId);

    // 3. Fetch all attempts with student profile
    const { data: attempts, error: attErr } = await supabase
      .from('GroupMcqAttempt')
      .select('*, user:Profile!userId(id, name, email, avatarUrl)')
      .eq('testId', testId)
      .order('percentage', { ascending: false });

    const attemptList = attempts || [];
    const attemptedCount = attemptList.length;
    const notAttemptedCount = Math.max(0, (totalStudents || 0) - attemptedCount);

    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 0;
    let passedCount = 0;

    if (attemptedCount > 0) {
      const scores = attemptList.map((a: any) => Number(a.percentage) || 0);
      const totalScoreSum = scores.reduce((sum: number, s: number) => sum + s, 0);
      averageScore = parseFloat((totalScoreSum / attemptedCount).toFixed(2));
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
      passedCount = attemptList.filter((a: any) => a.passed).length;
    }

    const passPercentage = attemptedCount > 0 ? parseFloat(((passedCount / attemptedCount) * 100).toFixed(2)) : 0;

    return NextResponse.json({
      test,
      analytics: {
        totalStudents: totalStudents || 0,
        attemptedCount,
        notAttemptedCount,
        averageScore,
        highestScore,
        lowestScore,
        passPercentage,
        passedCount,
      },
      submissions: attemptList,
    });
  } catch (err: any) {
    console.error('Fetch test results error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch test results' }, { status: 500 });
  }
}
