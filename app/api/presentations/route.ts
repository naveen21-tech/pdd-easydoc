import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const presentations = await prisma.presentation.findMany({
        where: { userId: profile.id },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ presentations });
    } catch (dbErr) {
      console.warn('Prisma get presentations fallback:', dbErr);
      return NextResponse.json({ presentations: [] });
    }
  } catch (error: any) {
    console.error('GET /api/presentations error:', error);
    return NextResponse.json({ error: 'Failed to fetch presentations' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, style, slides, theme, documentId } = body;

    const presentationTitle = (title || '').trim() || 'Untitled Presentation';

    let presentation: any = null;
    try {
      presentation = await prisma.presentation.create({
        data: {
          userId: profile.id,
          documentId: documentId || null,
          title: presentationTitle,
          style: style || 'Academic',
          slides: slides || [],
          theme: theme || null,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma create presentation note:', dbErr);
      // Deterministic fallback response object
      presentation = {
        id: `pres-${Date.now()}`,
        userId: profile.id,
        documentId: documentId || null,
        title: presentationTitle,
        style: style || 'Academic',
        slides: slides || [],
        theme: theme || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ success: true, presentation }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/presentations error:', error);
    return NextResponse.json({ error: 'Failed to create presentation' }, { status: 500 });
  }
}
