import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { enhanceSlideContent } from '@/lib/ai/presentation-generator';
import { PresentationStyle } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { deckTitle, slideTitle, currentBullets, style } = body;

    if (!slideTitle) {
      return NextResponse.json({ error: 'Slide title is required' }, { status: 400 });
    }

    const enhanced = await enhanceSlideContent({
      deckTitle: deckTitle || 'Executive Presentation',
      slideTitle,
      currentBullets: Array.isArray(currentBullets) ? currentBullets : [],
      style: style as PresentationStyle,
    });

    return NextResponse.json({
      success: true,
      enhanced,
    });
  } catch (error: any) {
    console.error('Enhance slide error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to enhance slide' },
      { status: 500 }
    );
  }
}
