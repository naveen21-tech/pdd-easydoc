import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const templateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  previewImage: z.string().optional(),
});

export async function GET() {
  try {
    const profile = await getCurrentProfile();

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const templates = await prisma.template.findMany({
      orderBy: { usageCount: 'desc' },
    });

    return NextResponse.json({ templates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = templateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid template payload' }, { status: 400 });
    }

    const newTemplate = await prisma.template.create({
      data: parsed.data,
    });

    return NextResponse.json({ template: newTemplate });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
