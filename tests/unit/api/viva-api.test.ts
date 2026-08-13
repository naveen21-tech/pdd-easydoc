import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as generatePost } from '@/app/api/viva/generate/route';
import { POST as evaluatePost } from '@/app/api/viva/evaluate/route';

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
    vivaSession: {
      create: vi.fn().mockResolvedValue({ id: 'session-123' }),
    },
  },
}));

import { getCurrentProfile } from '@/lib/auth';

describe('MCQ & Viva API Routes (app/api/viva/)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generate route should reject unauthenticated requests with 401', async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({ title: 'Distributed Systems' }),
    });

    const res = await generatePost(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('generate route should generate MCQs when authenticated', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'user-123', name: 'Naveen' });

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Cloud Computing & Microservices',
        difficulty: 'Advanced',
        questionCount: 25,
      }),
    });

    const res = await generatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.questions)).toBe(true);
    expect(data.questions.length).toBe(25);
  });

  it('evaluate route should validate request payload and return 400 if answer is missing', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'user-123' });

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Explain REST API vs GraphQL',
        userAnswer: '',
      }),
    });

    const res = await evaluatePost(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Question and answer are required');
  });

  it('evaluate route should return score evaluation on valid answer', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'user-123' });

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Explain REST API vs GraphQL',
        expectedAnswer: 'REST uses fixed endpoints, GraphQL enables flexible field queries.',
        userAnswer: 'REST uses standard HTTP methods, whereas GraphQL allows clients to specify exact data fields.',
        category: 'Architecture',
        difficulty: 'Intermediate',
      }),
    });

    const res = await evaluatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.evaluation).toBeDefined();
    expect(typeof data.evaluation.score).toBe('number');
  });
});
