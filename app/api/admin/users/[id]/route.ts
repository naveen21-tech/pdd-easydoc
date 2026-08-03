import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
  plan: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentProfile();

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateUserRoleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const updatedUser = await prisma.profile.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentProfile();

    if (!profile || profile.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
    }

    await prisma.profile.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'User account removed successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
