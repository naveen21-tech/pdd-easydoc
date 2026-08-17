import { NextResponse } from 'next/server';
import {
  DEFAULT_PRESENTATION_TEMPLATES,
  PRESENTATION_TEMPLATE_CATEGORIES,
} from '@/lib/templates/presentation-templates';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    let templates = DEFAULT_PRESENTATION_TEMPLATES;
    if (category && category !== 'All') {
      templates = templates.filter(
        (t) => t.category.toLowerCase() === category.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      categories: PRESENTATION_TEMPLATE_CATEGORIES,
      templates,
    });
  } catch (error: any) {
    console.error('GET /api/presentations/templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch presentation templates' },
      { status: 500 }
    );
  }
}
