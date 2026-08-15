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

    // 1. Fetch group memberships of user
    const { data: memberships, error: memErr } = await supabase
      .from('GroupMember')
      .select('groupId, role, joinedAt')
      .eq('userId', user.id);

    const groupIds = (memberships || []).map((m: any) => m.groupId);

    // Also include groups created by this user
    const { data: createdGroups, error: createErr } = await supabase
      .from('Group')
      .select('id')
      .eq('createdBy', user.id);

    const createdIds = (createdGroups || []).map((g: any) => g.id);
    const allGroupIds = Array.from(new Set([...groupIds, ...createdIds]));

    if (allGroupIds.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // 2. Fetch full group details
    const { data: groupsData, error: groupErr } = await supabase
      .from('Group')
      .select('*, creator:Profile!createdBy(id, name, email, avatarUrl)')
      .in('id', allGroupIds)
      .order('createdAt', { ascending: false });

    if (groupErr || !groupsData) {
      // Fallback to Prisma
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

      const formatted = prismaGroups.map((g: any) => {
        const myMem = g.members.find((m: any) => m.userId === user.id);
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
    }

    // 3. For each group, get counts
    const enriched = await Promise.all(
      groupsData.map(async (grp: any) => {
        const myMem = memberships?.find((m: any) => m.groupId === grp.id);
        const role = grp.createdBy === user.id ? 'ADMIN' : (myMem?.role || 'MEMBER');

        const [{ count: memberCount }, { count: docCount }] = await Promise.all([
          supabase.from('GroupMember').select('*', { count: 'exact', head: true }).eq('groupId', grp.id),
          supabase.from('GroupDocument').select('*', { count: 'exact', head: true }).eq('groupId', grp.id),
        ]);

        return {
          id: grp.id,
          name: grp.name,
          description: grp.description,
          joinCode: grp.joinCode,
          createdBy: grp.createdBy,
          creator: grp.creator,
          memberCount: memberCount || 1,
          documentCount: docCount || 0,
          role,
          createdAt: grp.createdAt,
          updatedAt: grp.updatedAt,
        };
      })
    );

    return NextResponse.json({ groups: enriched });
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

    // Generate unique join code
    let joinCode = generateJoinCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const { data: existing } = await supabase
        .from('Group')
        .select('id')
        .eq('joinCode', joinCode)
        .maybeSingle();

      if (!existing) {
        isUnique = true;
      } else {
        joinCode = generateJoinCode();
      }
    }

    // 1. Insert Group into Supabase
    const { data: insertedGroup, error: insertErr } = await supabase
      .from('Group')
      .insert({
        name,
        description: description || null,
        joinCode,
        createdBy: user.id,
      })
      .select()
      .single();

    if (insertErr || !insertedGroup) {
      // Fallback via Prisma
      const newPrismaGroup = await prisma.group.create({
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
      });

      return NextResponse.json({ group: newPrismaGroup }, { status: 201 });
    }

    // 2. Add creator as ADMIN in GroupMember
    await supabase.from('GroupMember').insert({
      groupId: insertedGroup.id,
      userId: user.id,
      role: 'ADMIN',
    });

    return NextResponse.json({ group: insertedGroup }, { status: 201 });
  } catch (err: any) {
    console.error('Create group error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create group' }, { status: 500 });
  }
}
