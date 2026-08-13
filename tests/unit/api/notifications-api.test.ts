import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/api/notifications/route';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

describe('Notifications API Route (app/api/notifications/route.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET should return 401 when unauthorized', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No user') }),
      },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('GET should return notification items for authenticated user', async () => {
    const mockUser = { id: 'user-123' };
    const mockNotifications = [
      { id: 'notif-1', message: 'Document exported', isRead: false, createdAt: new Date() },
    ];

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    (prisma.notification.findMany as any).mockResolvedValue(mockNotifications);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.notifications.length).toBe(1);
    expect(data.notifications[0].id).toBe('notif-1');
    expect(data.notifications[0].message).toBe('Document exported');
  });

  it('PATCH should mark all unread notifications as read', async () => {
    const mockUser = { id: 'user-123' };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
    });

    (prisma.notification.updateMany as any).mockResolvedValue({ count: 3 });

    const response = await PATCH();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('marked as read');
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-123', isRead: false },
      data: { isRead: true },
    });
  });
});
