import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
});

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch groups where user is creator or member with full relations
    const prismaGroups = await prisma.group.findMany({
      where: {
        OR: [
          { createdBy: user.id },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        members: true,
        documents: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = prismaGroups.map((g) => {
      const myMem = g.members.find((m) => m.userId === user.id);
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        joinCode: g.joinCode,
        createdBy: g.createdBy,
        creator: g.creator,
        memberCount: g.members.length,
        documentCount: g.documents.length,
        role: g.createdBy === user.id ? 'ADMIN' : (myMem?.role || 'MEMBER'),
        createdAt: g.createdAt.toISOString(),
        updatedAt: g.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ groups: formatted });
  } catch (err: any) {
    console.error('Fetch groups error:', err);
    return NextResponse.json({ groups: [] });
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
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, description } = parsed.data;

    // Ensure Profile exists for creator before group creation
    const userProfile = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!userProfile) {
      await prisma.profile.create({
        data: {
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User'),
        },
      });
    }

    // Generate unique join code
    let joinCode = generateJoinCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const existing = await prisma.group.findUnique({
        where: { joinCode },
      });

      if (!existing) {
        isUnique = true;
      } else {
        joinCode = generateJoinCode();
      }
    }

    // Create group and creator membership with Prisma
    const newGroup = await prisma.group.create({
      data: {
        name,
        description: description || null,
        joinCode,
        createdBy: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN',
          },
        },
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({ group: newGroup }, { status: 201 });
  } catch (err: any) {
    console.error('Create group error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create group' }, { status: 500 });
  }
}
