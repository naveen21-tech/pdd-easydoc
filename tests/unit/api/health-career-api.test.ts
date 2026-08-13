import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as healthPost } from '@/app/api/health/analyze/route';
import { POST as atsPost } from '@/app/api/career/ats/analyze/route';

vi.mock('@/lib/auth', () => ({
  getCurrentProfile: vi.fn(),
}));

import { getCurrentProfile } from '@/lib/auth';

describe('API Services: Document Health & Career ATS Endpoints (Area 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleResume = {
    personalInfo: { fullName: 'Naveen Kumar', email: 'naveen@saveetha.com' },
    targetRole: 'Full Stack Engineer',
    summary: 'Full stack engineer with Next.js and TypeScript experience.',
    skills: {
      programmingLanguages: ['TypeScript', 'JavaScript'],
      frameworks: ['Next.js', 'React'],
      databases: ['PostgreSQL'],
      tools: ['Git'],
      softSkills: ['Communication'],
    },
    experience: [{ role: 'Developer', company: 'Saveetha Tech', responsibilities: ['Built Next.js apps.'] }],
    projects: [{ name: 'StudentDoc', technologies: ['Next.js'], description: 'Doc generator' }],
    education: [{ degree: 'B.Tech CSE', institution: 'Saveetha', year: '2024' }],
  };

  it('1. health route should return 401 when unauthorized', async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: 'Document text' }),
    });

    const res = await healthPost(req);
    expect(res.status).toBe(401);
  });

  it('2. health route should return 400 when content is empty string', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    });

    const res = await healthPost(req);
    expect(res.status).toBe(400);
  });

  it('3. health route should return 400 when content is whitespace only', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: '    ' }),
    });

    const res = await healthPost(req);
    expect(res.status).toBe(400);
  });

  it('4. health route should analyze document and return overallScore between 0 and 100', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Software Architecture Specification',
        content: '# Software Architecture\n## 1. Executive Summary\nHigh throughput document compiler.',
      }),
    });

    const res = await healthPost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.report.overallScore).toBeGreaterThanOrEqual(0);
    expect(data.report.overallScore).toBeLessThanOrEqual(100);
  });

  it('5. health route should return 6 pillar scores (readability, structure, grammar, etc.)', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Thesis',
        content: '# Introduction\nDetailed research methodologies and evaluations.',
      }),
    });

    const res = await healthPost(req);
    const data = await res.json();

    expect(typeof data.report.readabilityScore).toBe('number');
    expect(typeof data.report.structureScore).toBe('number');
    expect(typeof data.report.grammarScore).toBe('number');
    expect(typeof data.report.completenessScore).toBe('number');
  });

  it('6. health route should return actionable issues list', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Short Note',
        content: 'Brief content with no headings or structure.',
      }),
    });

    const res = await healthPost(req);
    const data = await res.json();

    expect(Array.isArray(data.report.issues)).toBe(true);
    expect(data.report.issues.length).toBeGreaterThan(0);
  });

  it('7. ats route should return 401 when unauthorized', async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({ resume: sampleResume, jobDescription: 'Job description' }),
    });

    const res = await atsPost(req);
    expect(res.status).toBe(401);
  });

  it('8. ats route should return 400 when resume is missing', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({ resume: null, jobDescription: 'Software Engineer' }),
    });

    const res = await atsPost(req);
    expect(res.status).toBe(400);
  });

  it('9. ats route should return 400 when jobDescription is missing', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({ resume: sampleResume, jobDescription: '' }),
    });

    const res = await atsPost(req);
    expect(res.status).toBe(400);
  });

  it('10. ats route should analyze resume and return atsScore between 0 and 100', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({
        resume: sampleResume,
        jobDescription: 'Looking for a Full Stack Developer with Next.js, React, and TypeScript expertise.',
      }),
    });

    const res = await atsPost(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.analysis.atsScore).toBe('number');
  });

  it('11. ats route should return matchedKeywords array', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({
        resume: sampleResume,
        jobDescription: 'Senior Next.js and TypeScript Developer with PostgreSQL experience.',
      }),
    });

    const res = await atsPost(req);
    const data = await res.json();

    expect(Array.isArray(data.analysis.matchedKeywords)).toBe(true);
    expect(data.analysis.matchedKeywords.length).toBeGreaterThan(0);
  });

  it('12. ats route should return missingKeywords array for skill gaps', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({
        resume: sampleResume,
        jobDescription: 'Kubernetes, Docker, AWS, and Golang backend engineer.',
      }),
    });

    const res = await atsPost(req);
    const data = await res.json();

    expect(Array.isArray(data.analysis.missingKeywords)).toBe(true);
  });

  it('13. ats route should return tailored improvement suggestions', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'u-1' });

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({
        resume: sampleResume,
        jobDescription: 'Software Engineer with CI/CD experience.',
      }),
    });

    const res = await atsPost(req);
    const data = await res.json();

    expect(Array.isArray(data.analysis.suggestions)).toBe(true);
    expect(data.analysis.suggestions.length).toBeGreaterThan(0);
  });

  it('14. health route should handle unexpected internal errors with 500 status', async () => {
    (getCurrentProfile as any).mockRejectedValue(new Error('Internal failure'));

    const req = new Request('http://localhost:3000/api/health/analyze', {
      method: 'POST',
      body: JSON.stringify({ content: 'Document' }),
    });

    const res = await healthPost(req);
    expect(res.status).toBe(500);
  });
});
