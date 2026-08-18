import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

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

    // Verify membership in group
    const { data: group } = await supabase.from('Group').select('id, createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch Knowledge Materials for this classroom
    const { data: materials, error: matErr } = await supabase
      .from('GroupKnowledgeMaterial')
      .select('*, uploader:Profile!uploadedBy(id, name, email, avatarUrl)')
      .eq('groupId', groupId)
      .order('subject', { ascending: true })
      .order('unit', { ascending: true })
      .order('createdAt', { ascending: false });

    if (matErr) throw matErr;

    // Group materials by Subject and Unit for structured display
    const tree: Record<string, Record<string, any[]>> = {};
    (materials || []).forEach((m: any) => {
      const subj = m.subject || 'General Subject';
      const un = m.unit || 'General Unit';
      if (!tree[subj]) tree[subj] = {};
      if (!tree[subj][un]) tree[subj][un] = [];
      tree[subj][un].push(m);
    });

    return NextResponse.json({
      materials: materials || [],
      tree,
      totalCount: materials?.length || 0,
    });
  } catch (err: any) {
    console.error('Fetch knowledge materials error:', err);
    return NextResponse.json({ materials: [], tree: {}, totalCount: 0 });
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

    // Verify Admin / Faculty permissions
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
      return NextResponse.json({ error: 'Only faculty/administrators can upload knowledge hub materials.' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';

    let title = '';
    let subject = 'General';
    let unit = 'Unit 1';
    let topic = 'Overview';
    let chapter = 'Chapter 1';
    let fileName = '';
    let fileType = 'pdf';
    let fileSize = 0;
    let content: string | null = null;
    let fileUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      title = (formData.get('title') as string) || (file ? file.name : 'Untitled Material');
      subject = (formData.get('subject') as string) || 'General';
      unit = (formData.get('unit') as string) || 'Unit 1';
      topic = (formData.get('topic') as string) || 'Overview';
      chapter = (formData.get('chapter') as string) || 'Chapter 1';

      if (!file) {
        return NextResponse.json({ error: 'Please select a file to upload.' }, { status: 400 });
      }

      fileName = file.name;
      fileSize = file.size;
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      fileType = ['pdf', 'docx', 'doc', 'pptx', 'ppt', 'txt'].includes(ext) ? ext : 'document';

      if (['txt', 'md', 'json', 'csv'].includes(ext) || file.type.startsWith('text/')) {
        content = await file.text();
      } else {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          fileUrl = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
          // For search indexing, extract basic text or header summary
          content = `Material: ${title} | Subject: ${subject} | Unit: ${unit} | Chapter: ${chapter} | Topic: ${topic}`;
        } catch (e) {
          console.warn('Binary read warning:', e);
        }
      }
    } else {
      const body = await request.json();
      title = body.title;
      subject = body.subject || 'General';
      unit = body.unit || 'Unit 1';
      topic = body.topic || 'Overview';
      chapter = body.chapter || 'Chapter 1';
      fileName = body.fileName || `${title}.txt`;
      fileType = body.fileType || 'txt';
      content = body.content || '';
      fileUrl = body.fileUrl || null;
      fileSize = content ? Buffer.byteLength(content, 'utf8') : 0;
    }

    if (!title.trim()) {
      return NextResponse.json({ error: 'Material title is required.' }, { status: 400 });
    }

    const materialId = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const { data: inserted, error: insertErr } = await supabase
      .from('GroupKnowledgeMaterial')
      .insert({
        id: materialId,
        groupId,
        uploadedBy: user.id,
        title,
        subject,
        unit,
        topic,
        chapter,
        fileName,
        fileType,
        fileSize,
        fileUrl,
        content,
      })
      .select('*, uploader:Profile!uploadedBy(id, name, email, avatarUrl)')
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ material: inserted }, { status: 201 });
  } catch (err: any) {
    console.error('Upload knowledge material error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to upload knowledge material' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get('materialId');

    if (!materialId) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: group } = await supabase.from('Group').select('createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only faculty can delete materials' }, { status: 403 });
    }

    const { error: delErr } = await supabase
      .from('GroupKnowledgeMaterial')
      .delete()
      .eq('id', materialId)
      .eq('groupId', groupId);

    if (delErr) throw delErr;

    return NextResponse.json({ success: true, message: 'Material deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete material' }, { status: 500 });
  }
}
