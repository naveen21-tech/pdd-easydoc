import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVivaQuestions } from '@/lib/ai/viva-generator';
import { VivaDifficulty, VivaCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, title, difficulty = 'Intermediate', questionCount = 8, categories } = body;

    let targetTitle = (title || '').trim();
    let contextText = '';

    if (documentId) {
      try {
        const doc = await prisma.document.findFirst({
          where: { id: documentId, userId: profile.id },
        });
        if (doc) {
          targetTitle = doc.title;
          contextText = doc.content;
        }
      } catch (dbErr) {
        console.warn('Prisma document lookup for viva:', dbErr);
      }
    }

    if (!targetTitle) {
      targetTitle = 'Software Architecture & System Design';
    }

    if (!contextText) {
      contextText = targetTitle;
    }

    // 1. Generate Viva Questions
    const questions = await generateVivaQuestions({
      title: targetTitle,
      contextContent: contextText,
      difficulty: (difficulty as VivaDifficulty) || 'Intermediate',
      questionCount: Number(questionCount) || 8,
      categories: categories as VivaCategory[],
    });

    // 2. Persist session in database
    let createdSession: any = null;
    try {
      createdSession = await prisma.vivaSession.create({
        data: {
          userId: profile.id,
          documentId: documentId || null,
          title: targetTitle,
          difficulty,
          questions: questions as any,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma vivaSession create note:', dbErr);
    }

    const sessionId = createdSession?.id || `viva-${Date.now()}`;

    return NextResponse.json({
      success: true,
      sessionId,
      title: targetTitle,
      difficulty,
      questions,
    });
  } catch (error: any) {
    console.error('Viva question generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate viva questions' },
      { status: 500 }
    );
  }
}
