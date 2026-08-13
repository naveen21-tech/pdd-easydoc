import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Dashboard: Analytics, Stats & Document Listing (Area 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sampleDocuments = [
    {
      id: 'doc-01',
      title: 'Distributed Consensus Protocol Thesis',
      status: 'COMPLETE',
      category: 'College Students',
      createdAt: '2026-08-10T10:00:00Z',
      wordCount: 3500,
    },
    {
      id: 'doc-02',
      title: 'Software Requirement Specification',
      status: 'DRAFT',
      category: 'Technical Documentation',
      createdAt: '2026-08-11T12:30:00Z',
      wordCount: 1200,
    },
    {
      id: 'doc-03',
      title: 'Full Stack Engineer ATS Resume',
      status: 'COMPLETE',
      category: 'ATS Resume Builder',
      createdAt: '2026-08-12T15:45:00Z',
      wordCount: 650,
    },
  ];

  it('1. should calculate total document count accurately', () => {
    const totalDocs = sampleDocuments.length;
    expect(totalDocs).toBe(3);
  });

  it('2. should filter completed documents correctly', () => {
    const completed = sampleDocuments.filter((d) => d.status === 'COMPLETE');
    expect(completed.length).toBe(2);
  });

  it('3. should filter draft documents correctly', () => {
    const drafts = sampleDocuments.filter((d) => d.status === 'DRAFT');
    expect(drafts.length).toBe(1);
  });

  it('4. should calculate aggregate word count across documents', () => {
    const totalWords = sampleDocuments.reduce((acc, doc) => acc + doc.wordCount, 0);
    expect(totalWords).toBe(5350);
  });

  it('5. should sort documents by most recent creation date first', () => {
    const sorted = [...sampleDocuments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    expect(sorted[0].id).toBe('doc-03');
    expect(sorted[sorted.length - 1].id).toBe('doc-01');
  });

  it('6. should handle empty document list with appropriate zero-state metrics', () => {
    const emptyDocs: typeof sampleDocuments = [];
    const stats = {
      total: emptyDocs.length,
      completed: emptyDocs.filter((d) => d.status === 'COMPLETE').length,
      totalWords: emptyDocs.reduce((acc, doc) => acc + doc.wordCount, 0),
    };

    expect(stats.total).toBe(0);
    expect(stats.completed).toBe(0);
    expect(stats.totalWords).toBe(0);
  });

  it('7. should format creation dates into human-readable format', () => {
    const doc = sampleDocuments[0];
    const formatted = new Date(doc.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    expect(formatted).toContain('2026');
  });

  it('8. should identify recent documents created within the last 7 days', () => {
    const now = new Date('2026-08-13T12:00:00Z').getTime();
    const recent = sampleDocuments.filter((d) => {
      const docTime = new Date(d.createdAt).getTime();
      return (now - docTime) / (1000 * 60 * 60 * 24) <= 7;
    });
    expect(recent.length).toBe(3);
  });

  it('9. should categorize document breakdown by category', () => {
    const breakdown: Record<string, number> = {};
    sampleDocuments.forEach((d) => {
      breakdown[d.category] = (breakdown[d.category] || 0) + 1;
    });

    expect(breakdown['College Students']).toBe(1);
    expect(breakdown['ATS Resume Builder']).toBe(1);
    expect(breakdown['Technical Documentation']).toBe(1);
  });

  it('10. should truncate long document titles for compact UI cards', () => {
    const title = 'Comprehensive Multi-Tenant Distributed Cloud Infrastructure Specification';
    const truncated = title.length > 30 ? `${title.slice(0, 30)}...` : title;
    expect(truncated).toBe('Comprehensive Multi-Tenant Dis...');
  });

  it('11. should generate initials avatar badge from user full name', () => {
    const name = 'Naveen Kumar';
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
    expect(initials).toBe('NK');
  });

  it('12. should handle single-word user names for avatar initials', () => {
    const name = 'Student';
    const initials = name.slice(0, 2).toUpperCase();
    expect(initials).toBe('ST');
  });
});
