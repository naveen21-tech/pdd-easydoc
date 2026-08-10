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
      const careerProfile = await prisma.careerProfile.findFirst({
        where: { userId: profile.id },
        orderBy: { updatedAt: 'desc' },
      });

      return NextResponse.json({ careerProfile });
    } catch (dbErr) {
      console.warn('Prisma career profile fetch note:', dbErr);
      return NextResponse.json({ careerProfile: null });
    }
  } catch (error: any) {
    console.error('GET /api/career/resume error:', error);
    return NextResponse.json({ error: 'Failed to fetch resume profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resumeData, targetRole, atsScore } = body;

    let savedProfile: any = null;
    try {
      savedProfile = await prisma.careerProfile.create({
        data: {
          userId: profile.id,
          targetRole: targetRole || null,
          resumeData: resumeData || {},
          atsScore: atsScore || null,
        },
      });
    } catch (dbErr) {
      console.warn('Prisma career profile create note:', dbErr);
    }

    return NextResponse.json({ success: true, careerProfile: savedProfile });
  } catch (error: any) {
    console.error('POST /api/career/resume error:', error);
    return NextResponse.json({ error: 'Failed to save resume profile' }, { status: 500 });
  }
}
