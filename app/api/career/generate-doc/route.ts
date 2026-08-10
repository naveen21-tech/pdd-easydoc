import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCareerDocument } from '@/lib/ai/career-analyzer';
import { ResumeData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { docType, resume, targetRole, companyName } = body;

    if (!docType || !resume) {
      return NextResponse.json(
        { error: 'Document type and resume data are required' },
        { status: 400 }
      );
    }

    const generatedContent = await generateCareerDocument({
      docType,
      resume: resume as ResumeData,
      targetRole,
      companyName,
    });

    const docTitle = `${resume.personalInfo?.fullName || 'Candidate'} — ${docType.replace('-', ' ').toUpperCase()}`;

    // Optionally save to user's documents
    let createdDoc: any = null;
    try {
      createdDoc = await prisma.document.create({
        data: {
          userId: profile.id,
          title: docTitle,
          content: generatedContent,
          status: 'COMPLETE',
        },
      });
    } catch (dbErr) {
      console.warn('Prisma career doc save note:', dbErr);
    }

    return NextResponse.json({
      success: true,
      documentId: createdDoc?.id || `doc-${Date.now()}`,
      title: docTitle,
      content: generatedContent,
    });
  } catch (error: any) {
    console.error('Career document generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate career document' },
      { status: 500 }
    );
  }
}
