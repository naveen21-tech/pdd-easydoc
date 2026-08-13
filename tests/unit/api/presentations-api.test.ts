import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/presentations/generate/route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  getCurrentProfile: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findFirst: vi.fn(),
    },
    presentation: {
      create: vi.fn().mockResolvedValue({ id: 'pres-123' }),
    },
    notification: {
      create: vi.fn().mockResolvedValue({ id: 'notif-123' }),
    },
  },
}));

import { getCurrentProfile } from '@/lib/auth';

describe('Presentations API Route (app/api/presentations/generate/route.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST should return 401 when unauthorized', async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/presentations/generate', {
      method: 'POST',
      body: JSON.stringify({ customTitle: 'Keynote' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('POST should generate presentation slide deck when authenticated', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'user-123', name: 'Researcher' });

    const req = new Request('http://localhost:3000/api/presentations/generate', {
      method: 'POST',
      body: JSON.stringify({
        customTitle: 'Distributed Systems Keynote',
        slideCount: 8,
        style: 'Academic',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.slides)).toBe(true);
    expect(data.slides.length).toBe(8);
  });
});
