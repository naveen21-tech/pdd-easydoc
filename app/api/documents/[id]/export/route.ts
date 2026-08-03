import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { generateStyledHtmlDocument } from '@/lib/export/pdf';
import { generateDocxBuffer } from '@/lib/export/docx';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    const document = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const safeTitle = document.title.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'docx') {
      const buffer = await generateDocxBuffer(document.title, document.content);
      return new NextResponse(buffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeTitle}.docx"`,
        },
      });
    }

    // PDF format return styled document page ready for printing / conversion
    const html = generateStyledHtmlDocument(document.title, document.content);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${safeTitle}.html"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
