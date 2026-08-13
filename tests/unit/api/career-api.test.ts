import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/career/ats/analyze/route';

// Mock auth
vi.mock('@/lib/auth', () => ({
  getCurrentProfile: vi.fn(),
}));

import { getCurrentProfile } from '@/lib/auth';

describe('Career & ATS Analyzer API Route (app/api/career/ats/analyze/route.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST should return 401 when unauthorized', async () => {
    (getCurrentProfile as any).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({ resume: {}, jobDescription: 'Full Stack Engineer' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('POST should return 400 when resume or JD is missing', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'user-1' });

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({ resume: null, jobDescription: '' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain('Both resume data and job description are required');
  });

  it('POST should return ATS score and keyword gap analysis', async () => {
    (getCurrentProfile as any).mockResolvedValue({ id: 'user-1' });

    const mockResume = {
      personalInfo: {
        fullName: 'Naveen Kumar',
        email: 'naveen@saveetha.com',
        phone: '+91 9876543210',
        location: 'Chennai, India',
      },
      targetRole: 'Senior Full Stack Engineer',
      summary: 'Experienced Next.js and TypeScript developer.',
      skills: {
        programmingLanguages: ['TypeScript', 'JavaScript'],
        frameworks: ['Next.js', 'React'],
        databases: ['PostgreSQL'],
        tools: ['Git', 'Docker'],
        softSkills: ['Leadership', 'Communication'],
      },
      experience: [
        {
          role: 'Full Stack Developer',
          company: 'Saveetha Technologies',
          location: 'Chennai',
          startDate: '2022',
          endDate: 'Present',
          responsibilities: ['Built scalable Next.js applications.'],
        },
      ],
      projects: [
        {
          name: 'StudentDoc',
          technologies: ['Next.js', 'PostgreSQL'],
          description: 'Document generation platform.',
        },
      ],
      education: [
        {
          degree: 'B.Tech in Computer Science',
          institution: 'Saveetha School of Engineering',
          year: '2024',
        },
      ],
    };

    const req = new Request('http://localhost:3000/api/career/ats/analyze', {
      method: 'POST',
      body: JSON.stringify({
        resume: mockResume,
        jobDescription: 'Seeking Senior Next.js and TypeScript Engineer with PostgreSQL experience.',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.analysis).toBeDefined();
    expect(typeof data.analysis.atsScore).toBe('number');
    expect(Array.isArray(data.analysis.matchedKeywords)).toBe(true);
    expect(Array.isArray(data.analysis.missingKeywords)).toBe(true);
  });
});
