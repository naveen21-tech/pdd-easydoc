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
      const documents = await prisma.document.findMany({
        where: {
          userId: profile.id,
          content: {
            contains: '[TEMPLATE_BADGE] Faculty Document',
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ documents });
    } catch (dbErr) {
      console.warn('Prisma get faculty docs note:', dbErr);
      return NextResponse.json({ documents: [] });
    }
  } catch (error: any) {
    console.error('GET /api/faculty error:', error);
    return NextResponse.json({ error: 'Failed to fetch faculty documents' }, { status: 500 });
  }
}
