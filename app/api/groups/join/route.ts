import { createClient } from '@/lib/supabase/server';
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

    // 1. Find group by join code via Supabase
    const { data: targetGroup, error: findErr } = await supabase
      .from('Group')
      .select('*, creator:Profile!createdBy(id, name, email, avatarUrl)')
      .eq('joinCode', cleanCode)
      .maybeSingle();

    if (findErr || !targetGroup) {
      return NextResponse.json(
        { error: 'Group not found. Please check the join code and try again.' },
        { status: 404 }
      );
    }

    // 2. Ensure Profile exists for joining student in Supabase
    const { data: existingProfile } = await supabase
      .from('Profile')
      .select('id, name')
      .eq('id', user.id)
      .maybeSingle();

    if (!existingProfile) {
      const derivedName =
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        (user.email ? user.email.split('@')[0] : 'Student');

      await supabase.from('Profile').upsert({
        id: user.id,
        email: user.email || '',
        name: derivedName,
      });
    }

    // 3. Check if already joined
    const { data: existingMember } = await supabase
      .from('GroupMember')
      .select('id, role')
      .eq('groupId', targetGroup.id)
      .eq('userId', user.id)
      .maybeSingle();

    if (existingMember || targetGroup.createdBy === user.id) {
      return NextResponse.json({
        success: true,
        message: 'You are already a member of this classroom.',
        group: targetGroup,
      });
    }

    // 4. Add to GroupMember in Supabase
    const { error: insertErr } = await supabase.from('GroupMember').insert({
      groupId: targetGroup.id,
      userId: user.id,
      role: 'MEMBER',
    });

    if (insertErr) {
      throw new Error(insertErr.message || 'Failed to join classroom');
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
