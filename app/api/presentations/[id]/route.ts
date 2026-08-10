import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const presentation = await prisma.presentation.findFirst({
      where: { id, userId: profile.id },
    });

    if (!presentation) {
      return NextResponse.json({ error: 'Presentation not found' }, { status: 404 });
    }

    return NextResponse.json({ presentation });
  } catch (error: any) {
    console.error('GET /api/presentations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch presentation' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, style, slides, theme } = body;

    const updated = await prisma.presentation.updateMany({
      where: { id, userId: profile.id },
      data: {
        title: title !== undefined ? title : undefined,
        style: style !== undefined ? style : undefined,
        slides: slides !== undefined ? slides : undefined,
        theme: theme !== undefined ? theme : undefined,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error: any) {
    console.error('PUT /api/presentations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update presentation' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await prisma.presentation.deleteMany({
      where: { id, userId: profile.id },
    });

    return NextResponse.json({ success: true, message: 'Presentation deleted' });
  } catch (error: any) {
    console.error('DELETE /api/presentations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete presentation' }, { status: 500 });
  }
}
