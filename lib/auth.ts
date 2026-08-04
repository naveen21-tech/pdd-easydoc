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

    const defaultName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

    // 1. Try fetching via Supabase HTTPS REST API
    try {
      const { data: sbProfile, error: sbErr } = await supabase
        .from('Profile')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!sbErr && sbProfile) {
        return {
          id: sbProfile.id,
          name: sbProfile.name || defaultName,
          email: sbProfile.email || user.email || '',
          role: sbProfile.role || 'USER',
          avatarUrl: sbProfile.avatarUrl,
          plan: sbProfile.plan || 'Free',
          createdAt: typeof sbProfile.createdAt === 'string' ? sbProfile.createdAt : new Date().toISOString(),
        };
      }
    } catch (sbException: any) {
      if (sbException?.digest === 'DYNAMIC_SERVER_USAGE' || sbException?.message?.includes('DYNAMIC_SERVER_USAGE')) {
        throw sbException;
      }
      console.warn('Supabase profile query warning:', sbException);
    }

    // 2. Fallback: Query or create via Prisma
    try {
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
    } catch (prismaErr: any) {
      if (prismaErr?.digest === 'DYNAMIC_SERVER_USAGE' || prismaErr?.message?.includes('DYNAMIC_SERVER_USAGE')) {
        throw prismaErr;
      }
      console.warn('Prisma profile fetch warning:', prismaErr);
    }

    // 3. Fallback: Return basic profile constructed from Supabase Auth session
    return {
      id: user.id,
      name: defaultName,
      email: user.email || 'user@easydoc.com',
      role: 'USER',
      avatarUrl: null,
      plan: 'Free',
      createdAt: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('DYNAMIC_SERVER_USAGE')) {
      throw err; // Let Next.js handle dynamic route switching silently
    }
    console.warn('getCurrentProfile session lookup:', err?.message || err);
    return null;
  }
}
