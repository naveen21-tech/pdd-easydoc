import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
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

    // 1. Fetch Group
    const { data: group, error: grpErr } = await supabase
      .from('Group')
      .select('*, creator:Profile!createdBy(id, name, email, avatarUrl)')
      .eq('id', groupId)
      .maybeSingle();

    if (grpErr || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // 2. Check if user is a member or admin
    const { data: myMember } = await supabase
      .from('GroupMember')
      .select('*')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isCreator = group.createdBy === user.id;
    if (!isCreator && !myMember) {
      return NextResponse.json({ error: 'Access denied. You are not a member of this group.' }, { status: 403 });
    }

    const myRole = isCreator ? 'ADMIN' : (myMember?.role || 'MEMBER');

    // 3. Fetch Members
    const { data: membersData } = await supabase
      .from('GroupMember')
      .select('id, groupId, userId, role, joinedAt, user:Profile!userId(id, name, email, avatarUrl)')
      .eq('groupId', groupId)
      .order('joinedAt', { ascending: true });

    // 4. Fetch Documents
    const { data: documentsData } = await supabase
      .from('GroupDocument')
      .select('*, uploader:Profile!uploadedBy(id, name, email, avatarUrl)')
      .eq('groupId', groupId)
      .order('createdAt', { ascending: false });

    return NextResponse.json({
      group: {
        ...group,
        role: myRole,
        memberCount: membersData?.length || 1,
        documentCount: documentsData?.length || 0,
      },
      members: membersData || [],
      documents: documentsData || [],
      myRole,
    });
  } catch (err: any) {
    console.error('Fetch group details error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch group details' }, { status: 500 });
  }
}

export async function PATCH(
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

    // Check admin permissions
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only group administrators can modify group settings.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const { data: updatedGroup, error: updateErr } = await supabase
      .from('Group')
      .update({
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        updatedAt: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({ group: updatedGroup });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(
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

    if (group.createdBy !== user.id) {
      return NextResponse.json({ error: 'Only the group creator can delete this group.' }, { status: 403 });
    }

    const { error: delErr } = await supabase.from('Group').delete().eq('id', groupId);
    if (delErr) {
      await prisma.group.delete({ where: { id: groupId } });
    }

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete group' }, { status: 500 });
  }
}
