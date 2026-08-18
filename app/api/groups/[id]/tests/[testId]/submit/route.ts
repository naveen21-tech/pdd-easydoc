import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // 1. Verify user in classroom
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('*')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 2. Fetch test
    const { data: test, error: testErr } = await supabase
      .from('GroupMcqTest')
      .select('*')
      .eq('id', testId)
      .eq('groupId', groupId)
      .single();

    if (testErr || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // 3. Prevent duplicate submissions
    const { data: existingAttempt } = await supabase
      .from('GroupMcqAttempt')
      .select('*')
      .eq('testId', testId)
      .eq('userId', user.id)
      .maybeSingle();

    if (existingAttempt) {
      return NextResponse.json({
        error: 'You have already submitted this test. Multiple attempts are not allowed.',
        attempt: existingAttempt,
      }, { status: 400 });
    }

    // 4. Parse student submitted answers & adaptive history
    const body = await request.json();
    const answers: Record<string, string> = body.answers || {};
    const adaptiveHistory: any[] = Array.isArray(body.adaptiveHistory) ? body.adaptiveHistory : [];
    const isAutoSubmit: boolean = !!body.isAutoSubmit;

    // 5. Fetch all questions with correctOption from database for secure server grading
    const { data: questions, error: qErr } = await supabase
      .from('GroupMcqQuestion')
      .select('*')
      .eq('testId', testId)
      .order('orderIndex', { ascending: true });

    if (qErr || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'No questions found for this test' }, { status: 400 });
    }

    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    const topicStats: Record<string, { total: number; correct: number; percentage: number }> = {};

    const questionResults = questions.map((q: any) => {
      const qMarks = q.marks || 1;
      const topic = q.topic || 'General';
      totalMarks += qMarks;

      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0, percentage: 0 };
      }
      topicStats[topic].total++;

      const studentChoice = answers[q.id]?.toUpperCase();
      const isCorrect = studentChoice === q.correctOption?.toUpperCase();

      if (!studentChoice) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
        score += qMarks;
        topicStats[topic].correct++;
      } else {
        wrongCount++;
      }

      return {
        questionId: q.id,
        question: q.question,
        topic,
        difficulty: q.difficulty || 'MEDIUM',
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        studentChoice: studentChoice || null,
        correctOption: q.correctOption,
        isCorrect,
        marks: qMarks,
        awardedMarks: isCorrect ? qMarks : 0,
      };
    });

    // Calculate percentage per topic
    Object.keys(topicStats).forEach((t) => {
      const item = topicStats[t];
      item.percentage = item.total > 0 ? parseFloat(((item.correct / item.total) * 100).toFixed(1)) : 0;
    });

    // Find weak topic (lowest percentage)
    const topicList = Object.entries(topicStats).map(([name, data]) => ({ name, ...data }));
    topicList.sort((a, b) => a.percentage - b.percentage);
    const weakTopic = topicList.length > 0 && topicList[0].percentage < 70 ? topicList[0].name : null;

    const percentage = totalMarks > 0 ? parseFloat(((score / totalMarks) * 100).toFixed(2)) : 0;
    const passed = score >= (test.passingMarks || Math.ceil(totalMarks * 0.4));

    // 6. Record attempt in database
    const { data: attempt, error: attemptErr } = await supabase
      .from('GroupMcqAttempt')
      .insert({
        testId,
        groupId,
        userId: user.id,
        score,
        totalMarks,
        percentage,
        passed,
        totalQuestions: questions.length,
        correctCount,
        wrongCount,
        unansweredCount,
        topicScores: topicStats,
        adaptiveHistory,
        submittedAt: new Date().toISOString(),
        status: isAutoSubmit ? 'AUTO_SUBMITTED' : 'SUBMITTED',
        answers,
      })
      .select()
      .single();

    if (attemptErr) throw attemptErr;

    return NextResponse.json({
      success: true,
      message: 'Test submitted and graded successfully!',
      result: {
        score,
        totalMarks,
        percentage,
        passed,
        correctCount,
        wrongCount,
        unansweredCount,
        totalQuestions: questions.length,
        topicScores: topicStats,
        weakTopic,
        questionResults,
      },
    });
  } catch (err: any) {
    console.error('Submit test error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to submit test' }, { status: 500 });
  }
}
