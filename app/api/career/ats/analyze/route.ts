import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { analyzeResumeAgainstJD } from '@/lib/ai/career-analyzer';
import { ResumeData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { resume, jobDescription } = body;

    if (!resume || !jobDescription) {
      return NextResponse.json(
        { error: 'Both resume data and job description are required.' },
        { status: 400 }
      );
    }

    const analysis = await analyzeResumeAgainstJD({
      resume: resume as ResumeData,
      jobDescription,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('ATS analysis error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze resume' },
      { status: 500 }
    );
  }
}
