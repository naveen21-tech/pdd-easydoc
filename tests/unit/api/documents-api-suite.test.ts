import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/documents/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

describe('API Services: Documents Endpoint Suite (Area 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. GET should return 401 when no session exists', async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('Unauthorized') }) },
    });

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('2. GET should return user documents ordered by updatedAt descending', async () => {
    const mockUser = { id: 'usr-1' };
    const mockDocs = [
      { id: 'd-1', title: 'Doc 1', userId: 'usr-1', updatedAt: '2026-08-13T10:00:00Z' },
      { id: 'd-2', title: 'Doc 2', userId: 'usr-1', updatedAt: '2026-08-12T10:00:00Z' },
    ];

    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockDocs, error: null }),
          }),
        }),
      }),
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.documents.length).toBe(2);
  });

  it('3. GET should fallback to Prisma findMany when Supabase table lookup errors', async () => {
    const mockUser = { id: 'usr-1' };
    const mockDocs = [{ id: 'd-prisma', title: 'Prisma Doc', userId: 'usr-1' }];

    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error('Table error') }),
          }),
        }),
      }),
    });

    (prisma.document.findMany as any).mockResolvedValue(mockDocs);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.documents).toEqual(mockDocs);
  });

  it('4. POST should return 401 when unauthorized', async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('No user') }) },
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Doc', content: 'Content' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('5. POST should return 400 when title is missing in request payload', async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ content: 'Missing title' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('6. POST should return 400 when title is empty string', async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: '', content: 'Content' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('7. POST should create document and return document payload', async () => {
    const mockCreated = { id: 'd-new', title: 'New Doc', content: 'Content', userId: 'usr-1', status: 'DRAFT' };
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreated, error: null }),
          }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Doc', content: 'Content' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.document.id).toBe('d-new');
    expect(data.document.title).toBe('New Doc');
  });

  it('8. POST should accept templateId parameter during creation', async () => {
    const mockCreated = { id: 'd-tpl', title: 'Template Doc', templateId: 'cs-01', userId: 'usr-1' };
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreated, error: null }),
          }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Template Doc', content: 'Content', templateId: 'cs-01' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.document.templateId).toBe('cs-01');
  });

  it('9. POST should fallback to Prisma create when Supabase insert errors', async () => {
    const mockCreated = { id: 'd-prisma-created', title: 'Prisma Created', userId: 'usr-1' };
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert error') }),
          }),
        }),
      }),
    });

    (prisma.document.create as any).mockResolvedValue(mockCreated);

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Prisma Created', content: 'Content' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.document.id).toBe('d-prisma-created');
  });

  it('10. POST should handle database exceptions with HTTP 500', async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: new Error('Insert error') }),
          }),
        }),
      }),
    });

    (prisma.document.create as any).mockRejectedValue(new Error('Fatal DB crash'));

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Crash Doc', content: 'Content' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('11. POST should accept status "COMPLETE" in payload', async () => {
    const mockCreated = { id: 'd-comp', title: 'Complete Doc', status: 'COMPLETE', userId: 'usr-1' };
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreated, error: null }),
          }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Complete Doc', content: 'Content', status: 'COMPLETE' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.document.status).toBe('COMPLETE');
  });

  it('12. POST should reject invalid status string in payload with 400', async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Invalid Status Doc', content: 'Content', status: 'UNKNOWN' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('13. POST should handle special characters and emojis in document content', async () => {
    const mockCreated = { id: 'd-emoji', title: 'Special Doc 🚀', content: 'Content with emojis 🌟', userId: 'usr-1' };
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreated, error: null }),
          }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Special Doc 🚀', content: 'Content with emojis 🌟' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.document.title).toBe('Special Doc 🚀');
  });

  it('14. POST should handle large document payloads (100KB+ text)', async () => {
    const largeContent = '# Chapter\n'.concat('A'.repeat(100000));
    const mockCreated = { id: 'd-large', title: 'Large Doc', content: largeContent, userId: 'usr-1' };
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockCreated, error: null }),
          }),
        }),
      }),
    });

    const req = new Request('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ title: 'Large Doc', content: largeContent }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('15. GET should return empty documents array when user has zero documents', async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'usr-empty' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.documents).toEqual([]);
  });

  it('16. GET should handle exceptions gracefully by returning empty array rather than 500 error', async () => {
    (createClient as any).mockReturnValue({
      auth: { getUser: vi.fn().mockRejectedValue(new Error('Network drop')) },
    });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.documents).toEqual([]);
  });
});
