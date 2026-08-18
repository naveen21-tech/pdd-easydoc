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

    const isAdmin = group.createdBy === user.id || member?.role === 'ADMIN';

    if (!isAdmin && !member) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // 1. Fetch Knowledge Materials for this classroom
    const { data: rawMaterials } = await supabase
      .from('GroupKnowledgeMaterial')
      .select('*, uploader:Profile!uploadedBy(id, name, email, avatarUrl)')
      .eq('groupId', groupId)
      .order('subject', { ascending: true })
      .order('unit', { ascending: true })
      .order('createdAt', { ascending: false });

    // 2. Fetch Group Documents (shared documents and course files)
    const { data: rawDocs } = await supabase
      .from('GroupDocument')
      .select('*, uploader:Profile!uploadedBy(id, name, email, avatarUrl)')
      .eq('groupId', groupId)
      .order('createdAt', { ascending: false });

    // 3. Fetch Assignments
    const { data: rawAssignments } = await supabase
      .from('GroupAssignment')
      .select('*, creator:Profile!createdBy(id, name, email, avatarUrl)')
      .eq('groupId', groupId)
      .order('createdAt', { ascending: false });

    // 4. Fetch Assignment Submissions with Auto-Reviews
    let submissionQuery = supabase
      .from('GroupAssignmentSubmission')
      .select('*, user:Profile!userId(id, name, email, avatarUrl), assignment:GroupAssignment!assignmentId(id, title, requiredSections, minReferences, minWordCount)')
      .eq('groupId', groupId)
      .order('submittedAt', { ascending: false });

    if (!isAdmin) {
      // Student sees only their own submissions
      submissionQuery = submissionQuery.eq('userId', user.id);
    }

    const { data: rawSubmissions } = await submissionQuery;

    const materialsList: any[] = [...(rawMaterials || [])];
    const existingFileKeys = new Set(materialsList.map((m) => `${m.fileName}-${m.title}`));

    // Map Assignment Submissions with Auto-Reviews into Classroom Files
    (rawSubmissions || []).forEach((sub: any) => {
      const assignmentTitle = sub.assignment?.title || 'Assignment';
      const key = `sub-${sub.id}`;
      if (!existingFileKeys.has(key)) {
        existingFileKeys.add(key);
        materialsList.unshift({
          id: `sub-${sub.id}`,
          groupId: sub.groupId,
          uploadedBy: sub.userId,
          title: `[Submission] ${sub.title}`,
          subject: 'Assignments & Auto-Review',
          unit: assignmentTitle,
          topic: `Submission: ${sub.title}`,
          chapter: `Score: ${sub.qualityScore}/100 (${sub.status})`,
          fileName: sub.fileName || `${sub.title}.docx`,
          fileType: sub.fileType || 'docx',
          fileSize: sub.fileSize || 0,
          fileUrl: sub.fileUrl || null,
          content: sub.content || `Assignment: ${assignmentTitle}\nSubmission Title: ${sub.title}\nQuality Score: ${sub.qualityScore}/100\nStatus: ${sub.status}\nAuto-Review: ${sub.reviewResult?.summary || 'Completed'}\nMissing Items: ${Array.isArray(sub.reviewResult?.missingRequirements) ? sub.reviewResult.missingRequirements.join(', ') : 'None'}`,
          createdAt: sub.submittedAt || sub.createdAt,
          uploader: sub.user || null,
          qualityScore: sub.qualityScore,
          reviewResult: sub.reviewResult,
          isAssignmentSubmission: true,
          status: sub.status,
        });
      }
    });

    // Map Assignments to Knowledge Hub format so their rubrics and prompts are indexed
    (rawAssignments || []).forEach((asgn: any) => {
      const key = `asgn-${asgn.id}`;
      if (!existingFileKeys.has(key)) {
        existingFileKeys.add(key);
        materialsList.push({
          id: `asgn-mat-${asgn.id}`,
          groupId: asgn.groupId,
          uploadedBy: asgn.createdBy,
          title: `Assignment: ${asgn.title}`,
          subject: 'Assignments & Auto-Review',
          unit: asgn.title,
          topic: `${asgn.title} Rubric & Requirements`,
          chapter: 'Coursework Guidelines',
          fileName: `${asgn.title}-assignment.docx`,
          fileType: 'docx',
          fileSize: 1024,
          fileUrl: null,
          content: `Assignment: ${asgn.title}\nDescription: ${asgn.description || 'None'}\nRequired Sections: ${Array.isArray(asgn.requiredSections) ? asgn.requiredSections.join(', ') : ''}\nMin References: ${asgn.minReferences}\nMin Word Count: ${asgn.minWordCount}\nTotal Marks: ${asgn.totalMarks}`,
          createdAt: asgn.createdAt,
          uploader: asgn.creator || null,
          isAssignmentBrief: true,
        });
      }
    });

    // Map GroupDocument items to Knowledge Hub format if not already in materials
    (rawDocs || []).forEach((doc: any) => {
      if (!isAdmin && doc.uploadedBy !== group.createdBy && doc.uploadedBy !== user.id) {
        return;
      }

      const key = `${doc.fileName}-${doc.title}`;
      if (!existingFileKeys.has(key)) {
        existingFileKeys.add(key);
        const isAssignmentFile = doc.title.toLowerCase().includes('assignment') || doc.title.toLowerCase().includes('submission');
        materialsList.push({
          id: `doc-${doc.id}`,
          groupId: doc.groupId,
          uploadedBy: doc.uploadedBy,
          title: doc.title,
          subject: isAssignmentFile ? 'Assignments & Auto-Review' : 'Classroom Documents',
          unit: isAssignmentFile ? 'Coursework Uploads' : 'General Materials',
          topic: doc.title,
          chapter: isAssignmentFile ? 'Uploaded Submissions' : 'Shared Files',
          fileName: doc.fileName,
          fileType: doc.fileType || 'pdf',
          fileSize: doc.fileSize || 0,
          fileUrl: doc.fileUrl || null,
          content: doc.content || null,
          createdAt: doc.createdAt,
          uploader: doc.uploader || null,
        });
      }
    });

    // Group all materials by Subject and Unit for structured display
    const tree: Record<string, Record<string, any[]>> = {};
    materialsList.forEach((m: any) => {
      const subj = m.subject || 'General Subject';
      const un = m.unit || 'General Unit';
      if (!tree[subj]) tree[subj] = {};
      if (!tree[subj][un]) tree[subj][un] = [];
      tree[subj][un].push(m);
    });

    return NextResponse.json({
      materials: materialsList,
      tree,
      totalCount: materialsList.length,
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

    // Also catalog in GroupDocument for shared classroom documents tab
    await supabase.from('GroupDocument').insert({
      groupId,
      uploadedBy: user.id,
      title,
      fileName,
      fileUrl,
      content,
      fileType,
      fileSize,
    });

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

    const cleanId = materialId.startsWith('doc-')
      ? materialId.replace('doc-', '')
      : materialId.startsWith('sub-')
      ? materialId.replace('sub-', '')
      : materialId.startsWith('asgn-mat-')
      ? materialId.replace('asgn-mat-', '')
      : materialId;

    await Promise.all([
      supabase.from('GroupKnowledgeMaterial').delete().eq('id', cleanId).eq('groupId', groupId),
      supabase.from('GroupDocument').delete().eq('id', cleanId).eq('groupId', groupId),
    ]);

    return NextResponse.json({ success: true, message: 'Material deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete material' }, { status: 500 });
  }
}
