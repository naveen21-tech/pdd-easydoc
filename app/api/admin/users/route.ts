import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const profile = await getCurrentProfile();

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
    }

    const users = await prisma.profile.findMany({
      include: {
        _count: {
          select: { documents: true, aiRequests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
