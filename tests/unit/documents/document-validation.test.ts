import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Document Creation: Input Validation & Boundary Testing (Area 3)', () => {
  const documentPayloadSchema = z.object({
    title: z.string().trim().min(1, 'Title is required').max(200, 'Title cannot exceed 200 characters'),
    content: z.string().min(0),
    templateId: z.string().optional(),
    tone: z.enum(['Formal & Technical', 'Academic & Rigorous', 'Professional & Concise', 'Persuasive & Pitch', 'Creative']).optional(),
    status: z.enum(['DRAFT', 'COMPLETE']).default('DRAFT'),
  });

  it('1. should pass validation with standard valid document payload', () => {
    const payload = {
      title: 'Distributed File Systems Architecture',
      content: '## Overview\nArchitecture design.',
      tone: 'Formal & Technical' as const,
      status: 'DRAFT' as const,
    };

    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('2. should reject empty title string', () => {
    const payload = { title: '', content: 'Content' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('3. should reject whitespace-only title', () => {
    const payload = { title: '     ', content: 'Content' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('4. should allow 1-character title', () => {
    const payload = { title: 'A', content: 'Minimal' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('5. should allow 200-character boundary title', () => {
    const payload = { title: 'T'.repeat(200), content: 'Boundary content' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('6. should reject title exceeding 200 characters', () => {
    const payload = { title: 'T'.repeat(201), content: 'Exceeding content' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('7. should accept empty content string during initial draft creation', () => {
    const payload = { title: 'Empty Content Document', content: '' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('8. should validate tone "Academic & Rigorous"', () => {
    const payload = { title: 'Thesis', content: '', tone: 'Academic & Rigorous' as const };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('9. should validate tone "Professional & Concise"', () => {
    const payload = { title: 'Memo', content: '', tone: 'Professional & Concise' as const };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('10. should validate tone "Persuasive & Pitch"', () => {
    const payload = { title: 'Startup Pitch', content: '', tone: 'Persuasive & Pitch' as const };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('11. should validate tone "Creative"', () => {
    const payload = { title: 'Story Outline', content: '', tone: 'Creative' as const };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('12. should reject invalid tone option', () => {
    const payload = { title: 'Document', content: '', tone: 'Invalid Tone Name' as any };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('13. should default status to "DRAFT" if omitted', () => {
    const payload = { title: 'New Document', content: 'Draft content' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('DRAFT');
    }
  });

  it('14. should accept status "COMPLETE"', () => {
    const payload = { title: 'Finished Document', content: 'Full text', status: 'COMPLETE' as const };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('15. should reject invalid status string', () => {
    const payload = { title: 'Doc', content: '', status: 'ARCHIVED' as any };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it('16. should accept optional templateId string', () => {
    const payload = { title: 'Template Doc', content: '', templateId: 'cs-01' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.templateId).toBe('cs-01');
    }
  });

  it('17. should strip leading and trailing whitespace from title', () => {
    const payload = { title: '   Trimmed Document Title   ', content: 'Text' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBe('Trimmed Document Title');
    }
  });

  it('18. should handle HTML tags in title safely as plain string', () => {
    const payload = { title: '<script>alert("xss")</script> Research Paper', content: 'Text' };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toContain('Research Paper');
    }
  });

  it('19. should handle SQL injection patterns in content as plain markdown text', () => {
    const payload = { title: 'Database Lecture', content: "SELECT * FROM users WHERE '1'='1';" };
    const parsed = documentPayloadSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it('20. should reject null payload object', () => {
    const parsed = documentPayloadSchema.safeParse(null);
    expect(parsed.success).toBe(false);
  });
});
