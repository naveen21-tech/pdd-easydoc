import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/health/analyze/route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  getCurrentProfile: vi.fn(),
}));

import { getCurrentProfile } from '@/lib/auth';

describe('Document Health API Route (app/api/health/analyze/route.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST should return 401 when unauthorized', async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: 'test content' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('POST should return 400 when content is empty', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'user-1' });

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: '   ' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Content is required');
  });

  it('POST should return health report for valid document text', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'user-1' });

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Cloud Security Architecture',
        content: '# Cloud Security Architecture\n## 1. Zero Trust Model\nDetailed analysis of mTLS and tokens.',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.report).toBeDefined();
    expect(typeof data.report.overallScore).toBe('number');
  });
});
