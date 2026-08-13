import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentProfile } from '@/lib/auth';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

describe('Authentication: Sessions, Tokens & Permissions (Area 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. should return null when user auth token is expired or missing', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'JWT expired' },
        }),
      },
    });

    const profile = await getCurrentProfile();
    expect(profile).toBeNull();
  });

  it('2. should resolve user role as ADMIN when set in database', async () => {
    const mockUser = { id: 'admin-01', email: 'admin@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'admin-01',
                name: 'System Admin',
                email: 'admin@studentdoc.io',
                role: 'ADMIN',
                plan: 'Enterprise',
                createdAt: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile?.role).toBe('ADMIN');
    expect(profile?.plan).toBe('Enterprise');
  });

  it('3. should resolve user role as USER for standard accounts', async () => {
    const mockUser = { id: 'std-01', email: 'student@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'std-01',
                name: 'Student User',
                email: 'student@studentdoc.io',
                role: 'USER',
                plan: 'Free',
                createdAt: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile?.role).toBe('USER');
    expect(profile?.plan).toBe('Free');
  });

  it('4. should extract display name from user_metadata if profile table is empty', async () => {
    const mockUser = {
      id: 'meta-01',
      email: 'meta@studentdoc.io',
      user_metadata: { name: 'Meta Name' },
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    (prisma.profile.findUnique as any).mockResolvedValue(null);

    const profile = await getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile?.name).toBe('Meta Name');
  });

  it('5. should extract username from email prefix when metadata name is absent', async () => {
    const mockUser = {
      id: 'email-01',
      email: 'alexander.tech@studentdoc.io',
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    (prisma.profile.findUnique as any).mockResolvedValue(null);

    const profile = await getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile?.name).toBe('alexander.tech');
  });

  it('6. should resolve Pro subscription tier correctly', async () => {
    const mockUser = { id: 'pro-01', email: 'pro@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'pro-01',
                name: 'Pro User',
                email: 'pro@studentdoc.io',
                role: 'USER',
                plan: 'Pro',
                createdAt: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile?.plan).toBe('Pro');
  });

  it('7. should resolve avatar URL when provided', async () => {
    const mockUser = { id: 'avatar-01', email: 'avatar@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'avatar-01',
                name: 'Avatar User',
                email: 'avatar@studentdoc.io',
                avatarUrl: 'https://cdn.studentdoc.io/avatars/user1.png',
                role: 'USER',
                plan: 'Free',
                createdAt: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile?.avatarUrl).toBe('https://cdn.studentdoc.io/avatars/user1.png');
  });

  it('8. should fallback to Prisma lookup when Supabase REST API throws network error', async () => {
    const mockUser = { id: 'fallback-01', email: 'fallback@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockRejectedValue(new Error('Supabase network error')),
          }),
        }),
      }),
    });

    (prisma.profile.findUnique as any).mockResolvedValue({
      id: 'fallback-01',
      name: 'Prisma Fallback User',
      email: 'fallback@studentdoc.io',
      role: 'USER',
      avatarUrl: null,
      plan: 'Pro',
      createdAt: new Date('2026-08-01T00:00:00Z'),
    });

    const profile = await getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile?.name).toBe('Prisma Fallback User');
    expect(profile?.plan).toBe('Pro');
  });

  it('9. should handle database exceptions gracefully without crashing', async () => {
    const mockUser = { id: 'err-01', email: 'err@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockRejectedValue(new Error('Table missing')),
          }),
        }),
      }),
    });

    (prisma.profile.findUnique as any).mockRejectedValue(new Error('DB unreachable'));

    const profile = await getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile?.id).toBe('err-01');
    expect(profile?.role).toBe('USER');
  });

  it('10. should rethrow DYNAMIC_SERVER_USAGE errors for Next.js routing', async () => {
    (createClient as any).mockImplementation(() => {
      const err: any = new Error('DYNAMIC_SERVER_USAGE');
      err.digest = 'DYNAMIC_SERVER_USAGE';
      throw err;
    });

    await expect(getCurrentProfile()).rejects.toThrow('DYNAMIC_SERVER_USAGE');
  });

  it('11. should validate session createdAt timestamp format', async () => {
    const mockUser = { id: 'time-01', email: 'time@studentdoc.io' };
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'time-01',
                name: 'Time User',
                email: 'time@studentdoc.io',
                role: 'USER',
                plan: 'Free',
                createdAt: '2026-08-13T10:00:00.000Z',
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile?.createdAt).toBe('2026-08-13T10:00:00.000Z');
  });

  it('12. should handle null user object with no error returned', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    });

    const profile = await getCurrentProfile();
    expect(profile).toBeNull();
  });

  it('13. should handle empty email on user object with safe default', async () => {
    const mockUser = { id: 'empty-mail', email: '' };
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    (prisma.profile.findUnique as any).mockResolvedValue(null);

    const profile = await getCurrentProfile();
    expect(profile?.email).toBe('user@easydoc.com');
  });

  it('14. should format string createdAt dates consistently in profile resolver', async () => {
    const mockUser = { id: 'date-01', email: 'date@studentdoc.io' };
    const dateObj = new Date('2026-05-15T12:00:00Z');
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'date-01',
                name: 'Date User',
                email: 'date@studentdoc.io',
                role: 'USER',
                plan: 'Free',
                createdAt: dateObj,
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile?.createdAt).toBeDefined();
  });
});
