import { createClient } from '@/lib/supabase/server';
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
    const { data: memberships } = await supabase
      .from('GroupMember')
      .select('groupId, role, joinedAt')
      .eq('userId', user.id);

    const groupIds = (memberships || []).map((m: any) => m.groupId);

    // Also include groups created by this user
    const { data: createdGroups } = await supabase
      .from('Group')
      .select('id')
      .eq('createdBy', user.id);

    const createdIds = (createdGroups || []).map((g: any) => g.id);
    const allGroupIds = Array.from(new Set([...groupIds, ...createdIds]));

    if (allGroupIds.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // 2. Fetch full group details with creator profile
    const { data: groupsData } = await supabase
      .from('Group')
      .select('*, creator:Profile!createdBy(id, name, email, avatarUrl)')
      .in('id', allGroupIds)
      .order('createdAt', { ascending: false });

    // 3. For each group, get counts
    const enriched = await Promise.all(
      (groupsData || []).map(async (grp: any) => {
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
          creator: grp.creator || null,
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

    // Ensure Profile exists for creator in Supabase
    const { data: userProfile } = await supabase
      .from('Profile')
      .select('id, name')
      .eq('id', user.id)
      .maybeSingle();

    if (!userProfile) {
      const derivedName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        (user.email ? user.email.split('@')[0] : 'Instructor');

      await supabase.from('Profile').upsert({
        id: user.id,
        email: user.email || '',
        name: derivedName,
      });
    }

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
      .select('*, creator:Profile!createdBy(id, name, email, avatarUrl)')
      .single();

    if (insertErr || !insertedGroup) {
      throw new Error(insertErr?.message || 'Failed to create classroom group');
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
