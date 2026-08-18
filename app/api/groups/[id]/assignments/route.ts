import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createAssignmentSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  totalMarks: z.number().min(1).default(100),
  requiredSections: z.array(z.string()).default([
    'Title Page',
    'Introduction',
    'Problem Statement',
    'Objectives',
    'Methodology',
    'Results',
    'Conclusion',
    'References',
  ]),
  minReferences: z.number().min(0).default(3),
  requiredKeywords: z.array(z.string()).default([]),
  minWordCount: z.number().min(0).default(300),
  autoReviewEnabled: z.boolean().default(true),
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

    // Verify membership
    const { data: group } = await supabase.from('Group').select('id, createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';

    // 1. Fetch total enrolled students in classroom
    const { count: totalStudents } = await supabase
      .from('GroupMember')
      .select('*', { count: 'exact', head: true })
      .eq('groupId', groupId);

    // 2. Fetch Assignments
    const { data: assignments, error: aErr } = await supabase
      .from('GroupAssignment')
      .select('*, creator:Profile!createdBy(id, name, email)')
      .eq('groupId', groupId)
      .order('createdAt', { ascending: false });

    if (aErr) throw aErr;

    // 3. For each assignment, enrich with submissions / user's submission
    const enriched = await Promise.all(
      (assignments || []).map(async (assign: any) => {
        if (isAdmin) {
          // Faculty sees summary statistics
          const { data: subs } = await supabase
            .from('GroupAssignmentSubmission')
            .select('id, userId, status, qualityScore, submittedAt, user:Profile!userId(id, name, email)')
            .eq('assignmentId', assign.id);

          const submissions = subs || [];
          const completedCount = submissions.length;
          const lateCount = submissions.filter((s: any) => s.status === 'LATE').length;
          const pendingCount = Math.max(0, (totalStudents || 0) - completedCount);

          const scores = submissions.map((s: any) => s.qualityScore || 0);
          const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

          return {
            ...assign,
            submissionSummary: {
              totalStudents: totalStudents || 0,
              completedCount,
              pendingCount,
              lateCount,
              averageQualityScore: avgScore,
            },
            mySubmission: null,
          };
        } else {
          // Student sees only their own submission and review
          const { data: mySub } = await supabase
            .from('GroupAssignmentSubmission')
            .select('*')
            .eq('assignmentId', assign.id)
            .eq('userId', user.id)
            .maybeSingle();

          return {
            ...assign,
            mySubmission: mySub || null,
          };
        }
      })
    );

    return NextResponse.json({
      assignments: enriched,
      isAdmin,
    });
  } catch (err: any) {
    console.error('Fetch assignments error:', err);
    return NextResponse.json({ assignments: [], isAdmin: false });
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

    // Verify Faculty / Admin
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only faculty/administrators can create assignments.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createAssignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const {
      title,
      description,
      dueDate,
      totalMarks,
      requiredSections,
      minReferences,
      requiredKeywords,
      minWordCount,
      autoReviewEnabled,
    } = parsed.data;

    const assignmentId = `asgn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: inserted, error: insertErr } = await supabase
      .from('GroupAssignment')
      .insert({
        id: assignmentId,
        groupId,
        createdBy: user.id,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        totalMarks: totalMarks || 100,
        requiredSections,
        minReferences: minReferences || 0,
        requiredKeywords,
        minWordCount: minWordCount || 0,
        autoReviewEnabled: autoReviewEnabled ?? true,
      })
      .select('*, creator:Profile!createdBy(id, name, email)')
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ assignment: inserted }, { status: 201 });
  } catch (err: any) {
    console.error('Create assignment error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create assignment' }, { status: 500 });
  }
}
