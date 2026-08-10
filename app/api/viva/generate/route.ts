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
    const { projectId, documentId, title, difficulty = 'Intermediate', questionCount = 8, categories } = body;

    let targetTitle = title || 'Software Project';
    let contextText = '';

    // If projectId is provided, gather project specs and documents
    if (projectId) {
      const proj = await prisma.project.findFirst({
        where: { id: projectId, userId: profile.id },
        include: { documents: true },
      });
      if (proj) {
        targetTitle = proj.name;
        contextText = `Project: ${proj.name}\nDomain: ${proj.domain}\nDescription: ${proj.description}\nModules: ${JSON.stringify(proj.modules)}\n${proj.documents.map((d: any) => `Document: ${d.title}\n${d.content.slice(0, 800)}`).join('\n\n')}`;
      }
    } else if (documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: documentId, userId: profile.id },
      });
      if (doc) {
        targetTitle = doc.title;
        contextText = doc.content;
      }
    }

    if (!contextText) {
      contextText = targetTitle;
    }

    // 1. Generate Viva Questions
    const questions = await generateVivaQuestions({
      title: targetTitle,
      contextContent: contextText,
      difficulty: difficulty as VivaDifficulty,
      questionCount: Number(questionCount) || 8,
      categories: categories as VivaCategory[],
    });

    // 2. Persist in database
    let createdSession: any = null;
    try {
      createdSession = await prisma.vivaSession.create({
        data: {
          userId: profile.id,
          projectId: projectId || null,
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
