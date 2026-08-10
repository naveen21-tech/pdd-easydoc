import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateFacultyDocument } from '@/lib/ai/faculty-generator';
import { FacultyDocRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body: FacultyDocRequest = await req.json();
    const { docType, courseName } = body;

    if (!docType || !courseName) {
      return NextResponse.json(
        { error: 'Document type and course name are required.' },
        { status: 400 }
      );
    }

    // 1. Generate Faculty Document Markdown
    const content = await generateFacultyDocument(body);
    const docTitle = `${courseName} — ${docType}`;

    // 2. Persist in Database as Document
    let createdDoc: any = null;
    try {
      createdDoc = await prisma.document.create({
        data: {
          userId: profile.id,
          title: docTitle,
          content,
          status: 'COMPLETE',
        },
      });
    } catch (dbErr) {
      console.warn('Prisma faculty document create note:', dbErr);
    }

    const documentId = createdDoc?.id || `fac-${Date.now()}`;

    // 3. User Notification
    try {
      await prisma.notification.create({
        data: {
          userId: profile.id,
          type: 'success',
          message: `Faculty Document "${docTitle}" created successfully!`,
        },
      });
    } catch (nErr) {
      console.warn('Notification error:', nErr);
    }

    return NextResponse.json({
      success: true,
      documentId,
      title: docTitle,
      docType,
      content,
    });
  } catch (error: any) {
    console.error('Faculty document generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate faculty document' },
      { status: 500 }
    );
  }
}
