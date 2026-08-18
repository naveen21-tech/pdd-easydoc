import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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

    // Fetch Group & Membership to determine role
    const { data: group } = await supabase.from('Group').select('id, createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';

    // Fetch documents via Supabase with uploader Profile details
    const { data: docs } = await supabase
      .from('GroupDocument')
      .select('*, uploader:Profile!uploadedBy(id, name, email, avatarUrl)')
      .eq('groupId', groupId)
      .order('createdAt', { ascending: false });

    // Privacy Filter: Teachers see everything; Students see teacher notes + only their own submissions
    const filteredDocs = (docs || []).filter((doc: any) => {
      if (isAdmin) return true;
      return doc.uploadedBy === group.createdBy || doc.uploadedBy === user.id;
    });

    return NextResponse.json({ documents: filteredDocs });
  } catch (err: any) {
    console.error('Fetch group documents error:', err);
    return NextResponse.json({ documents: [] });
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

    // Verify user is in group
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('*')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && !member) {
      return NextResponse.json({ error: 'Access denied. You are not a member of this group.' }, { status: 403 });
    }

    // Ensure Profile exists for uploader
    const { data: userProfile } = await supabase
      .from('Profile')
      .select('id, name')
      .eq('id', user.id)
      .maybeSingle();

    if (!userProfile) {
      const derivedName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        (user.email ? user.email.split('@')[0] : 'User');

      await supabase.from('Profile').upsert({
        id: user.id,
        email: user.email || '',
        name: derivedName,
      });
    }

    const contentType = request.headers.get('content-type') || '';

    // A. Handle Multipart Form Data (Direct File Upload)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const title = (formData.get('title') as string) || (file ? file.name : 'Untitled Document');
      const documentId = formData.get('documentId') as string | null;

      if (!file && !documentId) {
        return NextResponse.json({ error: 'Please select a file or document to upload.' }, { status: 400 });
      }

      let fileName = file?.name || `${title}.md`;
      let fileType = 'document';
      let fileSize = file?.size || 0;
      let content: string | null = null;
      let fileUrl: string | null = null;

      if (file) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        fileType = ext === 'pdf' ? 'pdf' : (['doc', 'docx'].includes(ext) ? 'docx' : (ext === 'txt' ? 'txt' : 'document'));
        
        // For text-based files, read content
        if (['txt', 'md', 'json', 'csv', 'html', 'rtf'].includes(ext) || file.type.startsWith('text/')) {
          content = await file.text();
        } else {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            fileUrl = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
          } catch (e) {
            console.warn('Binary read warning:', e);
          }
        }
      }

      // If attaching from existing Document library
      if (documentId && !file) {
        const { data: sourceDoc } = await supabase.from('Document').select('*').eq('id', documentId).single();
        if (sourceDoc) {
          fileName = `${sourceDoc.title}.md`;
          content = sourceDoc.content;
          fileType = 'document';
          fileSize = Buffer.byteLength(sourceDoc.content || '', 'utf8');
        }
      }

      const { data: insertedDoc, error: insertErr } = await supabase
        .from('GroupDocument')
        .insert({
          groupId,
          uploadedBy: user.id,
          title,
          fileName,
          fileUrl,
          content,
          fileType,
          fileSize,
          documentId: documentId || null,
        })
        .select('*, uploader:Profile!uploadedBy(id, name, email, avatarUrl)')
        .single();

      if (insertErr) throw insertErr;

      return NextResponse.json({ document: insertedDoc }, { status: 201 });
    }

    // B. Handle JSON Payload (Direct share of document or text)
    const body = await request.json();
    const { title, fileName, content, fileType, fileSize, documentId, fileUrl } = body;

    if (!title) {
      return NextResponse.json({ error: 'Document title is required.' }, { status: 400 });
    }

    const { data: insertedDoc, error: insertErr } = await supabase
      .from('GroupDocument')
      .insert({
        groupId,
        uploadedBy: user.id,
        title,
        fileName: fileName || `${title}.md`,
        fileUrl: fileUrl || null,
        content: content || null,
        fileType: fileType || 'document',
        fileSize: fileSize || (content ? Buffer.byteLength(content, 'utf8') : 0),
        documentId: documentId || null,
      })
      .select('*, uploader:Profile!uploadedBy(id, name, email, avatarUrl)')
      .single();

    if (insertErr) throw insertErr;

    return NextResponse.json({ document: insertedDoc }, { status: 201 });
  } catch (err: any) {
    console.error('Upload group document error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to upload document' }, { status: 500 });
  }
}
