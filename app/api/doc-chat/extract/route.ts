import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractTextFromBuffer, chunkDocumentText, generateSuggestedQuestions } from '@/lib/ai/doc-chat-rag';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';

    let documentTitle = 'Uploaded Document';
    let fileType = 'text/plain';
    let extractedText = '';

    // Mode A: File Upload (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file was provided for extraction.' }, { status: 400 });
      }

      documentTitle = file.name;
      fileType = file.type || 'application/octet-stream';

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        return NextResponse.json({ error: 'The uploaded file is empty.' }, { status: 400 });
      }

      extractedText = await extractTextFromBuffer(buffer, fileType, file.name);
    }
    // Mode B: JSON Payload (documentId or direct text)
    else {
      const body = await req.json();
      const { documentId, text, title } = body;

      if (documentId) {
        const doc = await prisma.document.findFirst({
          where: { id: documentId, userId: profile.id },
        });

        if (!doc) {
          return NextResponse.json({ error: 'Document not found in your workspace.' }, { status: 404 });
        }

        documentTitle = doc.title;
        extractedText = doc.content;
        fileType = 'text/markdown';
      } else if (text) {
        documentTitle = title || 'Document';
        extractedText = text;
        fileType = 'text/plain';
      } else {
        return NextResponse.json({ error: 'No document ID or text provided.' }, { status: 400 });
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'No readable text could be extracted from this document.' },
        { status: 400 }
      );
    }

    // 2. Perform intelligent chunking
    const chunks = chunkDocumentText(extractedText, 350, 50);
    const totalWords = extractedText.trim().split(/\s+/).length;

    // 3. Generate suggested questions based on content
    const suggestedQuestions = generateSuggestedQuestions(documentTitle, chunks);

    return NextResponse.json({
      success: true,
      documentTitle,
      fileType,
      totalWords,
      chunkCount: chunks.length,
      chunks,
      suggestedQuestions,
    });
  } catch (error: any) {
    console.error('Doc extraction error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to extract text from document.' },
      { status: 500 }
    );
  }
}
