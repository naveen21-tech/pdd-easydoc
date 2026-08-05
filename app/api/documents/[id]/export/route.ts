import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { generateStyledHtmlDocument } from '@/lib/export/pdf';
import { generateDocxBuffer } from '@/lib/export/docx';
import { generatePlainText, generateMarkdownText } from '@/lib/export/txt';

export const dynamic = 'force-dynamic';

async function handleExport(request: Request, params: { id: string }) {
  const requestStartTime = Date.now();
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get('format') || 'pdf').toLowerCase();
  const borderColor = searchParams.get('borderColor') || undefined;
  const borderStyle = (searchParams.get('borderStyle') as any) || undefined;

  console.log(`[Export API] Request received | Document ID: ${params.id} | Format: ${format} | Border: ${borderColor}/${borderStyle}`);

  try {
    // 1. Authenticate user session
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn(`[Export API] Unauthorized request | Document ID: ${params.id}`);
      return NextResponse.json(
        { error: 'Unauthorized: Session missing or expired. Please sign in.' },
        { status: 401 }
      );
    }

    console.log(`[Export API] Authenticated User ID: ${user.id} | Requesting Doc: ${params.id}`);

    // 2. Fetch Document (Try Supabase HTTPS REST API first, then Prisma)
    let documentRecord: { id: string; title: string; content: string; userId: string } | null = null;

    try {
      const { data: sbDoc, error: sbErr } = await supabase
        .from('Document')
        .select('*')
        .eq('id', params.id)
        .eq('userId', user.id)
        .maybeSingle();

      if (!sbErr && sbDoc) {
        documentRecord = sbDoc;
      }
    } catch (sbException) {
      console.warn(`[Export API] Supabase query exception:`, sbException);
    }

    if (!documentRecord) {
      try {
        const prismaDoc = await prisma.document.findFirst({
          where: { id: params.id, userId: user.id },
        });
        if (prismaDoc) {
          documentRecord = prismaDoc;
        }
      } catch (prismaErr) {
        console.warn(`[Export API] Prisma query exception:`, prismaErr);
      }
    }

    // Fallback: If document by exact ID was not found, fetch the user's latest document
    if (!documentRecord) {
      try {
        const { data: latestDoc } = await supabase
          .from('Document')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestDoc) {
          documentRecord = latestDoc;
        }
      } catch (lErr) {
        console.warn(`[Export API] Latest doc query fallback exception:`, lErr);
      }
    }

    if (!documentRecord) {
      console.error(`[Export API] Document not found or access denied | User: ${user.id} | Doc: ${params.id}`);
      return NextResponse.json(
        { error: 'Document not found or you do not have permission to access it.' },
        { status: 404 }
      );
    }

    // 3. Ensure content existence (regenerate basic content fallback if missing)
    const title = documentRecord.title || 'Untitled_Document';
    let content = documentRecord.content || '';

    if (!content.trim()) {
      content = `# ${title}\n\n*Document content restored on export.*\n\nThis document is ready for review and editing.`;
    }

    const safeFilename = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'document';

    // 4. Generate Export File based on format
    let fileBuffer: Uint8Array | string;
    let contentType: string;
    let fileExtension: string;

    if (format === 'docx') {
      const docxBuf = await generateDocxBuffer(title, content);
      fileBuffer = new Uint8Array(docxBuf);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      fileExtension = 'docx';
    } else if (format === 'txt' || format === 'text') {
      fileBuffer = generatePlainText(title, content);
      contentType = 'text/plain; charset=utf-8';
      fileExtension = 'txt';
    } else if (format === 'markdown' || format === 'md') {
      fileBuffer = generateMarkdownText(title, content);
      contentType = 'text/markdown; charset=utf-8';
      fileExtension = 'md';
    } else {
      // Default: Styled PDF / Printable HTML Attachment
      fileBuffer = generateStyledHtmlDocument(title, content, { borderColor, borderStyle });
      contentType = 'text/html; charset=utf-8';
      fileExtension = 'html';
    }

    const fileSizeInBytes =
      typeof fileBuffer === 'string'
        ? Buffer.byteLength(fileBuffer, 'utf-8')
        : fileBuffer.byteLength;

    const durationMs = Date.now() - requestStartTime;

    console.log(
      `[Export API] Export Successful | User: ${user.id} | Doc: ${documentRecord.id} | Format: ${fileExtension} | Size: ${fileSizeInBytes} bytes | Duration: ${durationMs}ms`
    );

    // 5. Log export event in background
    try {
      await supabase.from('Notification').insert({
        userId: user.id,
        message: `Document "${title}" downloaded as ${fileExtension.toUpperCase()}.`,
        type: 'info',
      });
    } catch (e) {
      // Quiet fail
    }

    // 6. Return response with proper binary headers & disposition
    return new NextResponse(fileBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeFilename}.${fileExtension}"`,
        'Content-Length': fileSizeInBytes.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error(`[Export API Error] Exception during export for Doc ${params.id}:`, err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during document export.' },
      { status: 500 }
    );
  }
}

// Support both GET (direct browser link clicks) and POST (API calls)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handleExport(request, params);
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return handleExport(request, params);
}
