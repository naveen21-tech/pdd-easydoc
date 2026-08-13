import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as generatePost } from '@/app/api/viva/generate/route';
import { POST as evaluatePost } from '@/app/api/viva/evaluate/route';

vi.mock('@/lib/auth', () => ({
  getCurrentProfile: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    document: { findFirst: vi.fn() },
    vivaSession: { create: vi.fn().mockResolvedValue({ id: 'viva-sess-01' }) },
  },
}));

import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

describe('API Services: Viva & MCQ Studio Endpoints (Area 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. generate route should reject unauthenticated request with 401', async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({ title: 'Operating Systems' }),
    });

    const res = await generatePost(req);
    expect(res.status).toBe(401);
  });

  it('2. generate route should generate requested 25 MCQs by default', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1', name: 'Naveen' });

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({ title: 'Cloud Systems' }),
    });

    const res = await generatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.questions.length).toBe(25);
  });

  it('3. generate route should accept custom questionCount: 50', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({ title: 'AI Networks', questionCount: 50 }),
    });

    const res = await generatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.questions.length).toBe(50);
  });

  it('4. generate route should fetch context from documentId when provided', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });
    (prisma.document.findFirst as any).mockResolvedValue({
      id: 'doc-123',
      title: 'Database Normalization',
      content: '1NF, 2NF, 3NF, BCNF rules and dependency preservation.',
    });

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({ documentId: 'doc-123' }),
    });

    const res = await generatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Database Normalization');
  });

  it('5. generate route should persist session in prisma database', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({ title: 'Compiler Design' }),
    });

    const res = await generatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(prisma.vivaSession.create).toHaveBeenCalled();
    expect(data.sessionId).toBeDefined();
  });

  it('6. generate route should handle custom difficulty tier "Expert"', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({ title: 'Quantum Algorithms', difficulty: 'Expert' }),
    });

    const res = await generatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.difficulty).toBe('Expert');
  });

  it('7. evaluate route should reject unauthenticated request with 401', async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({ question: 'Explain ACID', userAnswer: 'Answer' }),
    });

    const res = await evaluatePost(req);
    expect(res.status).toBe(401);
  });

  it('8. evaluate route should return 400 when question is missing', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({ question: '', userAnswer: 'Answer' }),
    });

    const res = await evaluatePost(req);
    expect(res.status).toBe(400);
  });

  it('9. evaluate route should return 400 when userAnswer is missing', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({ question: 'What is Raft?', userAnswer: '' }),
    });

    const res = await evaluatePost(req);
    expect(res.status).toBe(400);
  });

  it('10. evaluate route should return score evaluation on valid submission', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Explain Raft consensus algorithm.',
        expectedAnswer: 'Leader election, log replication, and safety guarantees.',
        userAnswer: 'Raft divides consensus into leader election, log replication, and maintains consistency across distributed nodes.',
        difficulty: 'Advanced',
        category: 'Distributed Systems',
      }),
    });

    const res = await evaluatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.evaluation.score).toBe('number');
  });

  it('11. evaluate route should handle category parameter', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Explain public key cryptography.',
        expectedAnswer: 'Asymmetric key pairs with public encryption and private decryption.',
        userAnswer: 'Uses asymmetric key pairs.',
        category: 'Security',
      }),
    });

    const res = await evaluatePost(req);
    expect(res.status).toBe(200);
  });

  it('12. evaluate route should return correctPoints array', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Explain Docker containerization vs VMs.',
        expectedAnswer: 'Containers share host kernel, VMs use hypervisors.',
        userAnswer: 'Containers share the host OS kernel and are lightweight, while VMs run separate guest OS via hypervisors.',
      }),
    });

    const res = await evaluatePost(req);
    const data = await res.json();

    expect(Array.isArray(data.evaluation.correctPoints)).toBe(true);
  });

  it('13. evaluate route should return missingPoints array for partial answers', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/evaluate', {
      method: 'POST',
      body: JSON.stringify({
        question: 'Explain TCP 3-way handshake.',
        expectedAnswer: 'SYN, SYN-ACK, ACK sequence to establish reliable connection.',
        userAnswer: 'SYN is sent first.',
      }),
    });

    const res = await evaluatePost(req);
    const data = await res.json();

    expect(Array.isArray(data.evaluation.missingPoints)).toBe(true);
  });

  it('14. generate route should fallback to default title when both title and documentId are empty', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/viva/generate', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await generatePost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.title).toBe('Software Architecture & System Design');
  });
});
