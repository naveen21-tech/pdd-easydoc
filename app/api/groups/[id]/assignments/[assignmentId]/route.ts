import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const { id: groupId, assignmentId } = params;
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'completed', 'pending', 'late', 'low_score', 'high_score'

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: group } = await supabase.from('Group').select('id, createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';

    // 1. Fetch Assignment
    const { data: assignment, error: aErr } = await supabase
      .from('GroupAssignment')
      .select('*, creator:Profile!createdBy(id, name, email)')
      .eq('id', assignmentId)
      .eq('groupId', groupId)
      .single();

    if (aErr || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // 2. Fetch Enrolled Students
    const { data: members } = await supabase
      .from('GroupMember')
      .select('id, userId, role, joinedAt, user:Profile!userId(id, name, email, avatarUrl)')
      .eq('groupId', groupId);

    const students = (members || []).filter((m: any) => m.userId !== group.createdBy);
    const totalStudents = students.length;

    // 3. If Student: Return only their submission
    if (!isAdmin) {
      const { data: mySub } = await supabase
        .from('GroupAssignmentSubmission')
        .select('*')
        .eq('assignmentId', assignmentId)
        .eq('userId', user.id)
        .maybeSingle();

      return NextResponse.json({
        assignment,
        isAdmin: false,
        mySubmission: mySub || null,
      });
    }

    // 4. If Faculty: Return class overview + filtered submissions
    const { data: allSubmissions } = await supabase
      .from('GroupAssignmentSubmission')
      .select('*, user:Profile!userId(id, name, email, avatarUrl)')
      .eq('assignmentId', assignmentId)
      .order('submittedAt', { ascending: false });

    const submissions = allSubmissions || [];
    const submittedUserIds = new Set(submissions.map((s: any) => s.userId));

    // Calculate metrics
    const completedCount = submissions.length;
    const lateCount = submissions.filter((s: any) => s.status === 'LATE').length;
    const pendingCount = Math.max(0, totalStudents - completedCount);

    const scores = submissions.map((s: any) => s.qualityScore || 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

    // Generate pending student placeholders for faculty tracking
    const pendingStudents = students
      .filter((st: any) => !submittedUserIds.has(st.userId))
      .map((st: any) => ({
        id: `pending-${st.userId}`,
        assignmentId,
        groupId,
        userId: st.userId,
        title: 'Not Submitted Yet',
        fileName: '',
        status: 'PENDING',
        qualityScore: null,
        reviewResult: null,
        submittedAt: null,
        user: st.user,
      }));

    let combinedList = [...submissions, ...pendingStudents];

    // Apply Filters
    if (filter === 'completed') {
      combinedList = combinedList.filter((s) => s.status === 'SUBMITTED' || s.status === 'LATE');
    } else if (filter === 'pending') {
      combinedList = combinedList.filter((s) => s.status === 'PENDING');
    } else if (filter === 'late') {
      combinedList = combinedList.filter((s) => s.status === 'LATE');
    } else if (filter === 'low_score') {
      combinedList = combinedList.filter((s) => s.qualityScore !== null && s.qualityScore < 70);
    } else if (filter === 'high_score') {
      combinedList = combinedList.filter((s) => s.qualityScore !== null && s.qualityScore >= 85);
    }

    return NextResponse.json({
      assignment,
      isAdmin: true,
      overview: {
        totalStudents,
        completedCount,
        pendingCount,
        lateCount,
        averageQualityScore: avgScore,
      },
      submissions: combinedList,
    });
  } catch (err: any) {
    console.error('Fetch assignment details error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch assignment details' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const { id: groupId, assignmentId } = params;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: group } = await supabase.from('Group').select('createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only faculty can delete assignments' }, { status: 403 });
    }

    const { error: delErr } = await supabase
      .from('GroupAssignment')
      .delete()
      .eq('id', assignmentId)
      .eq('groupId', groupId);

    if (delErr) throw delErr;

    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete assignment' }, { status: 500 });
  }
}
