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

    try {
      const project = await prisma.project.findFirst({
        where: {
          id,
          userId: profile.id, // Strictly isolate to owner
        },
        include: {
          documents: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      return NextResponse.json({ project });
    } catch (dbErr) {
      console.warn('Prisma get project by id:', dbErr);
      return NextResponse.json({ error: 'Project database offline' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('GET /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
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

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: profile.id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 404 });
    }

    // Delete associated documents and project
    await prisma.document.deleteMany({
      where: { projectId: id, userId: profile.id },
    });

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Project and all documents deleted successfully.' });
  } catch (error: any) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
