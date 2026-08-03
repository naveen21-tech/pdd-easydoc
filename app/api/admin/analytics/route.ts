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

    const totalUsers = await prisma.profile.count();
    const totalDocuments = await prisma.document.count();
    const totalAIRequests = await prisma.aIRequest.count();
    const completeDocuments = await prisma.document.count({ where: { status: 'COMPLETE' } });
    const draftDocuments = await prisma.document.count({ where: { status: 'DRAFT' } });

    const requestsByProvider = await prisma.aIRequest.groupBy({
      by: ['provider'],
      _count: { provider: true },
      _avg: { responseTimeMs: true },
    });

    const recentAIRequests = await prisma.aIRequest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      metrics: {
        totalUsers,
        totalDocuments,
        totalAIRequests,
        completeDocuments,
        draftDocuments,
      },
      requestsByProvider,
      recentAIRequests,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
