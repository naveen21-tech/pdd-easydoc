import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCurrentProfile } from '@/lib/auth';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

describe('Authentication & Profile Resolution Service (lib/auth.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when no user session is present', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No session') }),
      },
    });

    const profile = await getCurrentProfile();
    expect(profile).toBeNull();
  });

  it('should resolve profile from Supabase table when user is authenticated', async () => {
    const mockUser = {
      id: 'user-uuid-123',
      email: 'student@saveetha.com',
      user_metadata: { name: 'Student Researcher' },
    };

    const mockProfileData = {
      id: 'user-uuid-123',
      name: 'Student Researcher',
      email: 'student@saveetha.com',
      role: 'USER',
      avatarUrl: null,
      plan: 'Pro',
      createdAt: '2026-08-01T00:00:00.000Z',
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockProfileData, error: null }),
          }),
        }),
      }),
    });

    const profile = await getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile?.id).toBe('user-uuid-123');
    expect(profile?.name).toBe('Student Researcher');
    expect(profile?.plan).toBe('Pro');
  });

  it('should fallback to Prisma when Supabase table lookup fails', async () => {
    const mockUser = {
      id: 'user-prisma-456',
      email: 'engineer@saveetha.com',
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('Table error') }),
          }),
        }),
      }),
    });

    (prisma.profile.findUnique as any).mockResolvedValue({
      id: 'user-prisma-456',
      name: 'Prisma User',
      email: 'engineer@saveetha.com',
      role: 'ADMIN',
      avatarUrl: null,
      plan: 'Enterprise',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
    });

    const profile = await getCurrentProfile();
    expect(profile).toBeDefined();
    expect(profile?.name).toBe('Prisma User');
    expect(profile?.role).toBe('ADMIN');
  });
});
