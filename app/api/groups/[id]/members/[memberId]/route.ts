import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { id: groupId, memberId } = params;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify requesting user is admin
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: currentMember } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isAdmin = group.createdBy === user.id || currentMember?.role === 'ADMIN';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Only group administrators can remove members.' }, { status: 403 });
    }

    // Check target member
    const { data: targetMember } = await supabase
      .from('GroupMember')
      .select('*')
      .eq('id', memberId)
      .single();

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found in this group' }, { status: 404 });
    }

    if (targetMember.userId === group.createdBy) {
      return NextResponse.json({ error: 'Cannot remove the group creator.' }, { status: 400 });
    }

    const { error: delErr } = await supabase.from('GroupMember').delete().eq('id', memberId);
    if (delErr) {
      await prisma.groupMember.delete({ where: { id: memberId } });
    }

    return NextResponse.json({ success: true, message: 'Member removed from group' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to remove member' }, { status: 500 });
  }
}
