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

    // Try Supabase HTTPS REST API first (firewall-proof)
    const { data: sbDocs, error: sbErr } = await supabase
      .from('Document')
      .select('*, template:Template(*)')
      .eq('userId', user.id)
      .order('updatedAt', { ascending: false });

    if (!sbErr && sbDocs) {
      return NextResponse.json({ documents: sbDocs });
    }

    // Fallback to Prisma
    const documents = await prisma.document.findMany({
      where: { userId: user.id },
      include: { template: true },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ documents });
  } catch (err: any) {
    return NextResponse.json({ documents: [] });
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

    // Try Supabase HTTPS REST first
    const { data: inserted, error: sbErr } = await supabase
      .from('Document')
      .insert({
        userId: user.id,
        title,
        content,
        templateId: templateId || null,
        status: status || 'DRAFT',
      })
      .select()
      .single();

    if (!sbErr && inserted) {
      return NextResponse.json({ document: inserted });
    }

    // Fallback to Prisma
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
