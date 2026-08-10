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
