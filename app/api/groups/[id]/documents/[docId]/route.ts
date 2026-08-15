import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const { id: groupId, docId } = params;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: doc, error: docErr } = await supabase
      .from('GroupDocument')
      .select('*, uploader:Profile!uploadedBy(id, name, email)')
      .eq('id', docId)
      .eq('groupId', groupId)
      .maybeSingle();

    if (docErr || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document: doc });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch document' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const { id: groupId, docId } = params;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get Group & User Role
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';

    // 2. Get Document
    const { data: doc } = await supabase.from('GroupDocument').select('*').eq('id', docId).single();
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const isUploader = doc.uploadedBy === user.id;

    if (!isAdmin && !isUploader) {
      return NextResponse.json({ error: 'You do not have permission to delete this document.' }, { status: 403 });
    }

    const { error: delErr } = await supabase.from('GroupDocument').delete().eq('id', docId);
    if (delErr) {
      await prisma.groupDocument.delete({ where: { id: docId } });
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete document' }, { status: 500 });
  }
}
