import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/documents/route';

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { createClient } from '@/lib/supabase/server';

describe('Documents API Route (app/api/documents/route.ts)', () => {
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

  it('GET should return documents list for authenticated user', async () => {
    const mockUser = { id: 'user-abc' };
    const mockDocuments = [
      { id: 'doc-1', title: 'Thesis Proposal', content: 'Intro...', userId: 'user-abc' },
    ];

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockDocuments, error: null }),
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.documents).toEqual(mockDocuments);
  });

  it('POST should validate payload and return 400 for empty title', async () => {
    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
      },
    });

    const mockRequest = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: '', content: 'some content' }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid document payload');
  });

  it('POST should successfully create document when valid', async () => {
    const mockDoc = {
      id: 'doc-new-1',
      title: 'Valid Document Title',
      content: '## Content',
      userId: 'user-123',
    };

    (createClient as any).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
      },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockDoc, error: null }),
          }),
        }),
      }),
    });

    const mockRequest = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Valid Document Title',
        content: '## Content',
      }),
    });

    const response = await POST(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.document.title).toBe('Valid Document Title');
  });
});
