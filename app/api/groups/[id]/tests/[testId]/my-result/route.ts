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

    // 1. Fetch Attempt
    const { data: attempt, error: attErr } = await supabase
      .from('GroupMcqAttempt')
      .select('*')
      .eq('testId', testId)
      .eq('userId', user.id)
      .maybeSingle();

    if (attErr || !attempt) {
      return NextResponse.json({ error: 'No submission found for this test.' }, { status: 404 });
    }

    // 2. Fetch test info
    const { data: test } = await supabase
      .from('GroupMcqTest')
      .select('*')
      .eq('id', testId)
      .single();

    // 3. Fetch questions with solutions for post-exam review
    const { data: questions } = await supabase
      .from('GroupMcqQuestion')
      .select('*')
      .eq('testId', testId)
      .order('orderIndex', { ascending: true });

    const studentAnswers = (attempt.answers as Record<string, string>) || {};

    const questionBreakdown = (questions || []).map((q: any) => {
      const studentChoice = studentAnswers[q.id]?.toUpperCase();
      const isCorrect = studentChoice === q.correctOption?.toUpperCase();

      return {
        id: q.id,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        studentChoice: studentChoice || null,
        correctOption: q.correctOption,
        isCorrect,
        marks: q.marks || 1,
        awardedMarks: isCorrect ? (q.marks || 1) : 0,
      };
    });

    return NextResponse.json({
      test,
      attempt,
      questionBreakdown,
    });
  } catch (err: any) {
    console.error('Fetch student result error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch result' }, { status: 500 });
  }
}
