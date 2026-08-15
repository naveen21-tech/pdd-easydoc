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
      return NextResponse.json({ error: 'Only faculty can view test full configurations.' }, { status: 403 });
    }

    const { data: test, error: testErr } = await supabase
      .from('GroupMcqTest')
      .select('*')
      .eq('id', testId)
      .eq('groupId', groupId)
      .maybeSingle();

    if (testErr || !test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const { data: questions } = await supabase
      .from('GroupMcqQuestion')
      .select('*')
      .eq('testId', testId)
      .order('orderIndex', { ascending: true });

    return NextResponse.json({ test, questions: questions || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PATCH(
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

    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only faculty can update tests.' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, duration, passingMarks, startTime, endTime, isPublished, questions } = body;

    let totalMarks: number | undefined = undefined;
    if (questions && Array.isArray(questions)) {
      totalMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
    }

    const { data: updatedTest, error: updateErr } = await supabase
      .from('GroupMcqTest')
      .update({
        ...(title ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(duration ? { duration } : {}),
        ...(totalMarks !== undefined ? { totalMarks } : {}),
        ...(passingMarks ? { passingMarks } : {}),
        ...(startTime !== undefined ? { startTime } : {}),
        ...(endTime !== undefined ? { endTime } : {}),
        ...(isPublished !== undefined ? { isPublished } : {}),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', testId)
      .eq('groupId', groupId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // If questions updated, replace questions
    if (questions && Array.isArray(questions)) {
      await supabase.from('GroupMcqQuestion').delete().eq('testId', testId);
      const newQuestions = questions.map((q: any, idx: number) => ({
        testId,
        question: q.question,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        marks: q.marks || 1,
        orderIndex: idx,
      }));
      await supabase.from('GroupMcqQuestion').insert(newQuestions);
    }

    return NextResponse.json({ test: updatedTest });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(
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

    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only faculty can delete tests.' }, { status: 403 });
    }

    const { error: delErr } = await supabase
      .from('GroupMcqTest')
      .delete()
      .eq('id', testId)
      .eq('groupId', groupId);

    if (delErr) {
      await prisma.groupMcqTest.delete({ where: { id: testId } });
    }

    return NextResponse.json({ success: true, message: 'Test deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete test' }, { status: 500 });
  }
}
