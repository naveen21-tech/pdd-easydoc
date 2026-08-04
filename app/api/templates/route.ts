import { NextResponse } from 'next/server';
import { TEMPLATE_CATALOG } from '@/lib/templates/catalog';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      templates: TEMPLATE_CATALOG,
      total: TEMPLATE_CATALOG.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { templates: TEMPLATE_CATALOG, total: TEMPLATE_CATALOG.length },
      { status: 200 }
    );
  }
}
