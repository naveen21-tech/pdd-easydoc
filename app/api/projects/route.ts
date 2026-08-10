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
      const projects = await prisma.project.findMany({
        where: { userId: profile.id },
        include: {
          documents: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ projects });
    } catch (dbErr) {
      console.warn('Prisma get projects fallback:', dbErr);
      return NextResponse.json({ projects: [] });
    }
  } catch (error: any) {
    console.error('GET /api/projects error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
