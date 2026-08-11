import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chunkDocumentText, answerDocumentQuery } from '@/lib/ai/doc-chat-rag';
import { DocumentChunk } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const { question, documentTitle, chunks, documentId, chatHistory } = body;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    let resolvedChunks: DocumentChunk[] = chunks || [];
    let resolvedTitle = documentTitle || 'Document';

    // If chunks are not directly provided, fetch document from database and chunk it
    if ((!resolvedChunks || resolvedChunks.length === 0) && documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: documentId, userId: profile.id },
      });

      if (!doc) {
        return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
      }

      resolvedTitle = doc.title;
      resolvedChunks = chunkDocumentText(doc.content, 350, 50);
    }

    if (!resolvedChunks || resolvedChunks.length === 0) {
      return NextResponse.json(
        { error: 'No document context available to query.' },
        { status: 400 }
      );
    }

    // Synthesize grounded response using RAG engine
    const result = await answerDocumentQuery({
      question,
      documentTitle: resolvedTitle,
      chunks: resolvedChunks,
      chatHistory: chatHistory || [],
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Doc chat query error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate answer for document query.' },
      { status: 500 }
    );
  }
}
