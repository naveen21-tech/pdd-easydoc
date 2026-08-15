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

    // 1. Find group by join code
    const { data: group, error: findErr } = await supabase
      .from('Group')
      .select('*')
      .eq('joinCode', cleanCode)
      .maybeSingle();

    let targetGroup = group;

    if (!targetGroup) {
      // Fallback via Prisma
      try {
        const pGroup = await prisma.group.findUnique({
          where: { joinCode: cleanCode },
        });
        if (pGroup) {
          targetGroup = {
            id: pGroup.id,
            name: pGroup.name,
            description: pGroup.description,
            joinCode: pGroup.joinCode,
            createdBy: pGroup.createdBy,
            createdAt: pGroup.createdAt.toISOString(),
            updatedAt: pGroup.updatedAt.toISOString(),
          };
        }
      } catch (e) {
        console.warn('Prisma join group lookup note:', e);
      }
    }

    if (!targetGroup) {
      return NextResponse.json(
        { error: 'Group not found. Please check the join code and try again.' },
        { status: 404 }
      );
    }

    // 2. Check if already joined
    const { data: existingMember } = await supabase
      .from('GroupMember')
      .select('id, role')
      .eq('groupId', targetGroup.id)
      .eq('userId', user.id)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already a member of this group.', group: targetGroup },
        { status: 400 }
      );
    }

    // 3. Add to GroupMember
    const { error: insertErr } = await supabase.from('GroupMember').insert({
      groupId: targetGroup.id,
      userId: user.id,
      role: 'MEMBER',
    });

    if (insertErr) {
      // Fallback via Prisma
      await prisma.groupMember.create({
        data: {
          groupId: targetGroup.id,
          userId: user.id,
          role: 'MEMBER',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined ${targetGroup.name}!`,
      group: targetGroup,
    });
  } catch (err: any) {
    console.error('Join group error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to join group.' },
      { status: 500 }
    );
  }
}
