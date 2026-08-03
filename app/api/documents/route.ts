import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createDocSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  templateId: z.string().optional(),
  status: z.enum(['DRAFT', 'COMPLETE']).optional(),
});

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      include: { template: true },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid document payload' }, { status: 400 });
    }

    const { title, content, templateId, status } = parsed.data;

    const newDocument = await prisma.document.create({
      data: {
        userId: user.id,
        title,
        content,
        templateId: templateId || null,
        status: status || 'DRAFT',
      },
    });

    return NextResponse.json({ document: newDocument });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
