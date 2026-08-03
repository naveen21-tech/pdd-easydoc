import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateDocSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'COMPLETE']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const document = await prisma.document.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: { template: true },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const existing = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const updated = await prisma.document.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ document: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.document.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
