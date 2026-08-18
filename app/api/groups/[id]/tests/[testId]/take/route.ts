import { createClient } from '@/lib/supabase/server';
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
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    // 1. Verify user is in this classroom
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found.' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('*')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && !member) {
      return NextResponse.json({ error: 'Access denied. You are not enrolled in this classroom.' }, { status: 403 });
    }

    // 2. Fetch test
    const { data: test, error: testErr } = await supabase
      .from('GroupMcqTest')
      .select('*')
      .eq('id', testId)
      .eq('groupId', groupId)
      .maybeSingle();

    if (testErr || !test) {
      return NextResponse.json({ error: 'MCQ test not found.' }, { status: 404 });
    }

    if (!test.isPublished && group.createdBy !== user.id) {
      return NextResponse.json({ error: 'This test is not currently published.' }, { status: 403 });
    }

    // Check expiration / timing
    const now = new Date();
    if (test.startTime && new Date(test.startTime) > now) {
      return NextResponse.json({ error: `This test will open on ${new Date(test.startTime).toLocaleString()}.` }, { status: 400 });
    }
    if (test.endTime && new Date(test.endTime) < now) {
      return NextResponse.json({ error: 'This test has expired.' }, { status: 400 });
    }

    // 3. Check if already attempted
    const { data: existingAttempt } = await supabase
      .from('GroupMcqAttempt')
      .select('id, score, totalMarks, percentage, passed, submittedAt')
      .eq('testId', testId)
      .eq('userId', user.id)
      .maybeSingle();

    if (existingAttempt) {
      return NextResponse.json({
        error: 'You have already submitted this test.',
        alreadySubmitted: true,
        attempt: existingAttempt,
      }, { status: 400 });
    }

    // 4. Fetch questions and STRIP correctOption to protect answers
    const { data: rawQuestions } = await supabase
      .from('GroupMcqQuestion')
      .select('id, testId, question, optionA, optionB, optionC, optionD, marks, orderIndex, topic, difficulty')
      .eq('testId', testId)
      .order('orderIndex', { ascending: true });

    return NextResponse.json({
      test: {
        id: test.id,
        groupId: test.groupId,
        title: test.title,
        description: test.description,
        duration: test.duration,
        totalMarks: test.totalMarks,
        passingMarks: test.passingMarks,
        isAdaptive: test.isAdaptive ?? false,
        questionCount: rawQuestions?.length || 0,
      },
      questions: rawQuestions || [],
    });
  } catch (err: any) {
    console.error('Take test error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to start test' }, { status: 500 });
  }
}
