import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (group.createdBy === user.id) {
      return NextResponse.json({ error: 'Group creators cannot leave the group. You can delete the group instead.' }, { status: 400 });
    }

    await supabase
      .from('GroupMember')
      .delete()
      .eq('groupId', groupId)
      .eq('userId', user.id);

    return NextResponse.json({ success: true, message: 'You have left the group.' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to leave group' }, { status: 500 });
  }
}
