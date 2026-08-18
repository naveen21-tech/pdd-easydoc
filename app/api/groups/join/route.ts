import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const joinSchema = z.object({
  code: z.string().min(3, 'Invalid join code').max(20),
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in first.' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = joinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid join code.' }, { status: 400 });
    }

    const cleanCode = parsed.data.code.trim().toUpperCase();

    // 1. Find group by join code via Prisma
    const targetGroup = await prisma.group.findUnique({
      where: { joinCode: cleanCode },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (!targetGroup) {
      return NextResponse.json(
        { error: 'Group not found. Please check the join code and try again.' },
        { status: 404 }
      );
    }

    // 2. Ensure Profile exists for joining user so their name & email are stored
    const existingProfile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!existingProfile) {
      const derivedName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        (user.email ? user.email.split('@')[0] : 'Student');

      await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email || '',
          name: derivedName,
        },
      });
    }

    // 3. Check if already joined
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: targetGroup.id,
          userId: user.id,
        },
      },
    });

    if (existingMember || targetGroup.createdBy === user.id) {
      return NextResponse.json({
        success: true,
        message: 'You are already a member of this classroom.',
        group: {
          id: targetGroup.id,
          name: targetGroup.name,
          description: targetGroup.description,
          joinCode: targetGroup.joinCode,
          createdBy: targetGroup.createdBy,
          creator: targetGroup.creator,
          createdAt: targetGroup.createdAt.toISOString(),
          updatedAt: targetGroup.updatedAt.toISOString(),
        },
      });
    }

    // 4. Add to GroupMember
    await prisma.groupMember.create({
      data: {
        groupId: targetGroup.id,
        userId: user.id,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${targetGroup.name}!`,
      group: {
        id: targetGroup.id,
        name: targetGroup.name,
        description: targetGroup.description,
        joinCode: targetGroup.joinCode,
        createdBy: targetGroup.createdBy,
        creator: targetGroup.creator,
        createdAt: targetGroup.createdAt.toISOString(),
        updatedAt: targetGroup.updatedAt.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('Join group error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to join group.' },
      { status: 500 }
    );
  }
}
