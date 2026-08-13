import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Validation Layer: Zod Schemas & Type Enforcers (Area 11)', () => {
  const emailSchema = z.string().email('Invalid email address format');
  const passwordSchema = z.string().min(6, 'Password must be at least 6 characters').max(100);
  const titleSchema = z.string().trim().min(1, 'Title is required').max(200);
  const slideCountSchema = z.number().int().min(4).max(15);
  const mcqCountSchema = z.number().int().min(5).max(50);
  const urlSchema = z.string().url('Invalid URL format');

  it('1. should validate correct email address', () => {
    expect(emailSchema.safeParse('student@saveetha.com').success).toBe(true);
  });

  it('2. should reject email missing domain', () => {
    expect(emailSchema.safeParse('student@').success).toBe(false);
  });

  it('3. should reject email missing username', () => {
    expect(emailSchema.safeParse('@saveetha.com').success).toBe(false);
  });

  it('4. should reject email with spaces', () => {
    expect(emailSchema.safeParse('student user@saveetha.com').success).toBe(false);
  });

  it('5. should validate password meeting 6-character requirement', () => {
    expect(passwordSchema.safeParse('123456').success).toBe(true);
  });

  it('6. should reject password shorter than 6 characters', () => {
    expect(passwordSchema.safeParse('12345').success).toBe(false);
  });

  it('7. should accept 100-character maximum password', () => {
    expect(passwordSchema.safeParse('P'.repeat(100)).success).toBe(true);
  });

  it('8. should reject password exceeding 100 characters', () => {
    expect(passwordSchema.safeParse('P'.repeat(101)).success).toBe(false);
  });

  it('9. should validate non-empty document title', () => {
    expect(titleSchema.safeParse('Distributed Systems Guide').success).toBe(true);
  });

  it('10. should reject empty document title', () => {
    expect(titleSchema.safeParse('').success).toBe(false);
  });

  it('11. should validate slide count within range (4 to 15)', () => {
    expect(slideCountSchema.safeParse(4).success).toBe(true);
    expect(slideCountSchema.safeParse(8).success).toBe(true);
    expect(slideCountSchema.safeParse(15).success).toBe(true);
  });

  it('12. should reject slide count below 4', () => {
    expect(slideCountSchema.safeParse(3).success).toBe(false);
  });

  it('13. should reject slide count above 15', () => {
    expect(slideCountSchema.safeParse(16).success).toBe(false);
  });

  it('14. should validate MCQ question count within range (5 to 50)', () => {
    expect(mcqCountSchema.safeParse(5).success).toBe(true);
    expect(mcqCountSchema.safeParse(25).success).toBe(true);
    expect(mcqCountSchema.safeParse(50).success).toBe(true);
  });

  it('15. should reject MCQ question count outside 5-50 range', () => {
    expect(mcqCountSchema.safeParse(4).success).toBe(false);
    expect(mcqCountSchema.safeParse(51).success).toBe(false);
  });

  it('16. should validate absolute HTTPS URLs', () => {
    expect(urlSchema.safeParse('https://studentdoc.saveetha.com/verify').success).toBe(true);
    expect(urlSchema.safeParse('not-a-url').success).toBe(false);
  });
});
