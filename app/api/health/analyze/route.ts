import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { analyzeDocumentHealth } from '@/lib/ai/health-analyzer';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title = 'Document', content = '' } = body;

    if (!content.trim()) {
      return NextResponse.json({ error: 'Content is required for health analysis' }, { status: 400 });
    }

    const report = await analyzeDocumentHealth({
      title,
      content,
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Health analysis error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze document health' },
      { status: 500 }
    );
  }
}
