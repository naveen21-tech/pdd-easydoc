import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/lib/types';

export async function getCurrentProfile(): Promise<UserProfile | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
    });

    if (profile) {
      return {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        avatarUrl: profile.avatarUrl,
        plan: profile.plan,
        createdAt: profile.createdAt.toISOString(),
      };
    }

    // Fallback: Create profile if trigger was delayed or in local environment
    const newProfile = await prisma.profile.create({
      data: {
        id: user.id,
        email: user.email || 'user@easydoc.com',
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: 'USER',
        plan: 'Free',
      },
    });

    return {
      id: newProfile.id,
      name: newProfile.name,
      email: newProfile.email,
      role: newProfile.role,
      avatarUrl: newProfile.avatarUrl,
      plan: newProfile.plan,
      createdAt: newProfile.createdAt.toISOString(),
    };
  } catch (err) {
    console.error('Error fetching current profile:', err);
    return null;
  }
}
