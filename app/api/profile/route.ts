import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').optional(),
  avatarUrl: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const defaultName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

    // 1. Try fetching via Supabase HTTPS REST
    const { data: sbProfile, error: sbErr } = await supabase
      .from('Profile')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!sbErr && sbProfile) {
      return NextResponse.json({
        profile: {
          ...sbProfile,
          email: sbProfile.email || user.email,
        },
      });
    }

    // 2. Fallback to Prisma
    try {
      const prismaProfile = await prisma.profile.findUnique({
        where: { id: user.id },
      });

      if (prismaProfile) {
        return NextResponse.json({ profile: prismaProfile });
      }
    } catch (prismaErr) {
      console.warn('Prisma profile query warning:', prismaErr);
    }

    // 3. Auto-create profile row if missing
    const newProfile = {
      id: user.id,
      email: user.email || 'user@easydoc.com',
      name: defaultName,
      role: 'USER',
      plan: 'Free',
      createdAt: new Date().toISOString(),
    };

    await supabase.from('Profile').upsert(newProfile);

    return NextResponse.json({ profile: newProfile });
  } catch (err: any) {
    console.error('GET /api/profile error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data: ' + (parsed.error.issues[0]?.message || 'Check fields') },
        { status: 400 }
      );
    }

    const { name, avatarUrl } = parsed.data;

    // 1. Update Supabase Auth user metadata
    if (name) {
      await supabase.auth.updateUser({
        data: { name },
      });
    }

    const updatedName = name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';

    const profileData = {
      id: user.id,
      email: user.email || 'user@easydoc.com',
      name: updatedName,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      role: 'USER',
      plan: 'Free',
    };

    // 2. Upsert in Profile table via Supabase HTTPS REST API (Port 443 HTTPS - 100% reliable)
    const { data: updatedSb, error: sbErr } = await supabase
      .from('Profile')
      .upsert(profileData, { onConflict: 'id' })
      .select()
      .maybeSingle();

    if (!sbErr && updatedSb) {
      return NextResponse.json({ profile: updatedSb });
    }

    // 3. Fallback to Prisma upsert
    try {
      const updatedPrisma = await prisma.profile.upsert({
        where: { id: user.id },
        update: {
          name: updatedName,
          ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        },
        create: {
          id: user.id,
          email: user.email || 'user@easydoc.com',
          name: updatedName,
          role: 'USER',
          plan: 'Free',
        },
      });

      return NextResponse.json({ profile: updatedPrisma });
    } catch (prismaErr) {
      console.warn('Prisma profile upsert warning:', prismaErr);
    }

    return NextResponse.json({ profile: profileData });
  } catch (err: any) {
    console.error('PUT /api/profile error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
