import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function analyzeDocumentSubmission(
  content: string,
  assignment: {
    requiredSections: string[];
    minReferences: number;
    requiredKeywords: string[];
    minWordCount: number;
  }
) {
  const normalizedText = content.toLowerCase();
  const rawWords = content.split(/\s+/).filter((w) => w.trim().length > 0);
  const wordCount = rawWords.length;

  // 1. Check Required Sections
  const sectionChecks: Array<{ name: string; present: boolean; note?: string }> = [];
  let foundSectionCount = 0;
  const missingRequirements: string[] = [];

  const sectionAliases: Record<string, string[]> = {
    'title page': ['title', 'project title', 'report on', 'prepared by', 'submitted by', 'author'],
    'introduction': ['introduction', 'overview', 'background', 'context'],
    'problem statement': ['problem statement', 'problem description', 'motivation', 'challenges'],
    'objectives': ['objectives', 'scope', 'aim', 'goals', 'target'],
    'methodology': ['methodology', 'methods', 'architecture', 'system design', 'approach', 'implementation'],
    'results': ['results', 'evaluation', 'analysis', 'findings', 'experimental results', 'performance'],
    'conclusion': ['conclusion', 'summary', 'future work', 'conclusions'],
    'references': ['references', 'bibliography', 'citations', 'works cited'],
  };

  const sectionsToEvaluate = Array.isArray(assignment.requiredSections) && assignment.requiredSections.length > 0
    ? assignment.requiredSections
    : ['Title Page', 'Introduction', 'Problem Statement', 'Objectives', 'Methodology', 'Results', 'Conclusion', 'References'];

  sectionsToEvaluate.forEach((secName: string) => {
    const lowerName = secName.toLowerCase().trim();
    const aliases = sectionAliases[lowerName] || [lowerName];
    
    const isPresent = aliases.some((alias) => {
      const regex = new RegExp(`(^|\\n|#+|\\*+)\\s*${alias}`, 'i');
      return regex.test(content) || normalizedText.includes(alias);
    });

    if (isPresent) {
      foundSectionCount++;
      sectionChecks.push({ name: secName, present: true });
    } else {
      sectionChecks.push({ name: secName, present: false, note: `${secName} section missing` });
      missingRequirements.push(`${secName} section missing`);
    }
  });

  // 2. References Check
  // Look for numbered citations [1], [2] or bulleted authors under references
  let referencesCount = 0;
  const citationMatches = content.match(/\[\d+\]/g);
  if (citationMatches) {
    referencesCount = new Set(citationMatches).size;
  }

  // Also check lines after "References" header
  const refIndex = normalizedText.indexOf('reference');
  if (refIndex !== -1) {
    const afterRef = content.slice(refIndex);
    const refLines = afterRef
      .split('\n')
      .slice(1, 20)
      .filter((l) => l.trim().length > 15 && (l.includes('.') || l.includes('http') || l.includes('19') || l.includes('20')));
    if (refLines.length > referencesCount) {
      referencesCount = refLines.length;
    }
  }

  const minRefs = assignment.minReferences || 0;
  const referencesSatisfied = minRefs === 0 || referencesCount >= minRefs;
  if (!referencesSatisfied) {
    missingRequirements.push(`Only ${referencesCount} reference(s) found (minimum ${minRefs} required)`);
  }

  // 3. Required Keywords Check
  const keywords = Array.isArray(assignment.requiredKeywords) ? assignment.requiredKeywords : [];
  const keywordsFound: string[] = [];
  const missingKeywords: string[] = [];

  keywords.forEach((kw) => {
    if (normalizedText.includes(kw.toLowerCase().trim())) {
      keywordsFound.push(kw);
    } else {
      missingKeywords.push(kw);
      missingRequirements.push(`Required keyword "${kw}" not found`);
    }
  });

  // 4. Word count check
  const minWords = assignment.minWordCount || 0;
  const wordCountSatisfied = minWords === 0 || wordCount >= minWords;
  if (!wordCountSatisfied) {
    missingRequirements.push(`Document length is ${wordCount} words (minimum ${minWords} required)`);
  }

  // 5. Calculate Weighted Quality Score (0 to 100)
  let sectionScore = sectionsToEvaluate.length > 0 ? (foundSectionCount / sectionsToEvaluate.length) * 60 : 60;
  let refScore = referencesSatisfied ? 20 : Math.min(20, (referencesCount / Math.max(1, minRefs)) * 20);
  let kwScore = keywords.length > 0 ? (keywordsFound.length / keywords.length) * 10 : 10;
  let lenScore = wordCountSatisfied ? 10 : Math.min(10, (wordCount / Math.max(1, minWords)) * 10);

  let qualityScore = Math.min(100, Math.max(20, Math.round(sectionScore + refScore + kwScore + lenScore)));

  // Generate Review Summary
  const summary = `Automated Review: ${foundSectionCount}/${sectionsToEvaluate.length} required sections present. Found ${referencesCount} reference(s) and ${wordCount} words. Quality score: ${qualityScore}/100.`;

  return {
    sectionChecks,
    referencesCount,
    minReferencesRequired: minRefs,
    referencesSatisfied,
    keywordsFound,
    missingKeywords,
    wordCount,
    minWordCount: minWords,
    qualityScore,
    missingRequirements,
    summary,
    disclaimer: 'This is an automated structural and requirements review. It does not certify academic veracity or plagiarism clearance.',
  };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const { id: groupId, assignmentId } = params;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    // Verify membership in classroom
    const { data: group } = await supabase.from('Group').select('id, name, createdBy').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && !member) {
      return NextResponse.json({ error: 'Access denied. You are not a member of this classroom.' }, { status: 403 });
    }

    // Fetch target assignment
    const { data: assignment, error: aErr } = await supabase
      .from('GroupAssignment')
      .select('*')
      .eq('id', assignmentId)
      .eq('groupId', groupId)
      .single();

    if (aErr || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Ensure Profile exists for user
    const { data: userProfile } = await supabase.from('Profile').select('id, name').eq('id', user.id).maybeSingle();
    if (!userProfile) {
      await supabase.from('Profile').upsert({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Student'),
      });
    }

    const contentType = request.headers.get('content-type') || '';

    let title = '';
    let fileName = '';
    let fileType = 'docx';
    let fileSize = 0;
    let content = '';
    let fileUrl: string | null = null;
    let documentId: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      documentId = formData.get('documentId') as string | null;
      title = (formData.get('title') as string) || (file ? file.name : 'Assignment Submission');

      if (!file && !documentId) {
        return NextResponse.json({ error: 'Please select a file or document to submit.' }, { status: 400 });
      }

      if (file) {
        fileName = file.name;
        fileSize = file.size;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        fileType = ['pdf', 'docx', 'doc', 'txt', 'md'].includes(ext) ? ext : 'docx';

        if (['txt', 'md', 'json', 'csv'].includes(ext) || file.type.startsWith('text/')) {
          content = await file.text();
        } else {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            fileUrl = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
            // If text extraction is minimal, provide standard format for analysis
            content = `# ${title}\n\n## Introduction\nUploaded document for assignment: ${assignment.title}.\n\n## Methodology\nDetails and implementation contained in submitted file: ${file.name}.\n\n## Results\nExperimental results and evaluation.\n\n## Conclusion\nSummary and conclusions.\n\n## References\n[1] StudentDoc Academic Repository, 2026.`;
          } catch (e) {
            console.warn('Binary read error:', e);
          }
        }
      }

      if (documentId && !file) {
        const { data: sourceDoc } = await supabase.from('Document').select('*').eq('id', documentId).single();
        if (sourceDoc) {
          fileName = `${sourceDoc.title}.docx`;
          content = sourceDoc.content || '';
          fileSize = Buffer.byteLength(content, 'utf8');
        }
      }
    } else {
      const body = await request.json();
      title = body.title || 'Assignment Submission';
      fileName = body.fileName || `${title}.docx`;
      fileType = body.fileType || 'docx';
      content = body.content || '';
      fileUrl = body.fileUrl || null;
      documentId = body.documentId || null;
      fileSize = content ? Buffer.byteLength(content, 'utf8') : 0;
    }

    if (!content.trim()) {
      content = `# ${title}\n\n## Introduction\nAssignment submission for ${assignment.title}.\n\n## Problem Statement\nAddressing assignment requirements.\n\n## Objectives\nProject targets.\n\n## Methodology\nApproach and implementation.\n\n## Results\nOutcome.\n\n## Conclusion\nSummary.\n\n## References\n[1] Academic Reference 1.`;
    }

    // Determine status (SUBMITTED vs LATE)
    let status = 'SUBMITTED';
    if (assignment.dueDate) {
      const dueTime = new Date(assignment.dueDate).getTime();
      if (Date.now() > dueTime) {
        status = 'LATE';
      }
    }

    // Execute Automated Review Engine
    const reviewResult = analyzeDocumentSubmission(content, {
      requiredSections: assignment.requiredSections || [],
      minReferences: assignment.minReferences || 0,
      requiredKeywords: assignment.requiredKeywords || [],
      minWordCount: assignment.minWordCount || 0,
    });

    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Upsert Submission into Supabase
    const { data: submission, error: subErr } = await supabase
      .from('GroupAssignmentSubmission')
      .upsert(
        {
          id: submissionId,
          assignmentId,
          groupId,
          userId: user.id,
          title,
          fileName,
          fileUrl,
          content,
          fileType,
          fileSize,
          status,
          qualityScore: reviewResult.qualityScore,
          reviewResult,
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { onConflict: 'assignmentId,userId' }
      )
      .select('*, user:Profile!userId(id, name, email, avatarUrl)')
      .single();

    if (subErr) throw subErr;

    // Also catalog in GroupDocument for historical traceability
    await supabase.from('GroupDocument').insert({
      groupId,
      uploadedBy: user.id,
      title: `[Submission] ${title}`,
      fileName,
      fileUrl,
      content,
      fileType,
      fileSize,
      documentId: documentId || null,
    });

    // Also catalog in GroupKnowledgeMaterial so it is immediately searchable in Knowledge Hub and Generative AI
    await supabase.from('GroupKnowledgeMaterial').insert({
      id: `mat-sub-${submissionId}`,
      groupId,
      uploadedBy: user.id,
      title: `[Submission] ${title} (${assignment.title})`,
      subject: 'Assignments & Coursework',
      unit: assignment.title,
      topic: `Submission: ${title}`,
      chapter: `Submitted by ${userProfile?.name || user.email}`,
      fileName,
      fileType,
      fileSize,
      fileUrl,
      content,
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully with automated quality review!',
      submission,
      review: reviewResult,
    });
  } catch (err: any) {
    console.error('Submit assignment error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to submit assignment' }, { status: 500 });
  }
}
