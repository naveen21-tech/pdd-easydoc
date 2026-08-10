import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generatePresentationSlides } from '@/lib/ai/presentation-generator';
import { PresentationStyle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, customTitle, customContent, slideCount = 8, style = 'Academic' } = body;

    let docTitle = (customTitle || '').trim();
    let docContent = (customContent || '').trim();

    // If documentId is passed, fetch from DB
    if (documentId && documentId.trim()) {
      try {
        const existingDoc = await prisma.document.findFirst({
          where: { id: documentId.trim(), userId: profile.id },
        });
        if (existingDoc) {
          docTitle = existingDoc.title;
          docContent = existingDoc.content || existingDoc.title;
        }
      } catch (dbFindErr) {
        console.warn('Prisma document lookup error:', dbFindErr);
      }
    }

    // Default title if still empty
    if (!docTitle) {
      docTitle = 'Project Presentation';
    }

    if (!docContent) {
      docContent = docTitle;
    }

    // 1. Generate slides
    const slides = await generatePresentationSlides({
      documentTitle: docTitle,
      documentContent: docContent,
      slideCount: Number(slideCount) || 8,
      style: (style as PresentationStyle) || 'Academic',
    });

    // 2. Persist in database
    let createdPresentation: any = null;
    try {
      createdPresentation = await prisma.presentation.create({
        data: {
          userId: profile.id,
          documentId: documentId || null,
          title: docTitle,
          style: style || 'Academic',
          slides: slides as any,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma presentation create note:', dbErr);
    }

    const presentationId = createdPresentation?.id || `pres-${Date.now()}`;

    // Notification
    try {
      await prisma.notification.create({
        data: {
          userId: profile.id,
          type: 'success',
          message: `Presentation deck "${docTitle}" (${slides.length} slides) generated!`,
        },
      });
    } catch (nErr) {
      console.warn('Notification error:', nErr);
    }

    return NextResponse.json({
      success: true,
      presentationId,
      title: docTitle,
      style,
      slides,
    });
  } catch (error: any) {
    console.error('Presentation generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate presentation' },
      { status: 500 }
    );
  }
}
