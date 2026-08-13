import { describe, it, expect } from 'vitest';

describe('Validation Layer: Input Sanitization & String Helpers (Area 11)', () => {
  const sanitizeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const sanitizeFilename = (title: string, ext = 'pdf'): string => {
    const clean = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    return `${clean || 'document'}.${ext}`;
  };

  const truncateString = (str: string, maxLength: number): string => {
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength)}...`;
  };

  const extractInitials = (name: string): string => {
    if (!name || !name.trim()) return 'SD';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  it('1. should escape ampersand (&) in HTML strings', () => {
    expect(sanitizeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('2. should escape less-than (<) in HTML strings', () => {
    expect(sanitizeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('3. should escape greater-than (>) in HTML strings', () => {
    expect(sanitizeHtml('a > b')).toBe('a &gt; b');
  });

  it('4. should escape double quotes (") in HTML strings', () => {
    expect(sanitizeHtml('He said "Hello"')).toBe('He said &quot;Hello&quot;');
  });

  it('5. should escape single quotes (\') in HTML strings', () => {
    expect(sanitizeHtml("It's working")).toBe('It&#039;s working');
  });

  it('6. should sanitize filename by replacing spaces with underscores', () => {
    expect(sanitizeFilename('Final Lab Report', 'pdf')).toBe('final_lab_report.pdf');
  });

  it('7. should sanitize filename by replacing special characters', () => {
    expect(sanitizeFilename('Thesis: Part 1 / 2026', 'docx')).toBe('thesis__part_1___2026.docx');
  });

  it('8. should fallback to "document.pdf" when title is empty', () => {
    expect(sanitizeFilename('', 'pdf')).toBe('document.pdf');
  });

  it('9. should truncate string longer than maxLength with ellipsis', () => {
    expect(truncateString('This is a very long string exceeding limit', 10)).toBe('This is a ...');
  });

  it('10. should return unmodified string when shorter than maxLength', () => {
    expect(truncateString('Short', 10)).toBe('Short');
  });

  it('11. should extract initials from two-word name', () => {
    expect(extractInitials('Naveen Kumar')).toBe('NK');
  });

  it('12. should extract initials from three-word name (first and last)', () => {
    expect(extractInitials('John Fitzgerald Kennedy')).toBe('JK');
  });

  it('13. should extract two-letter initials from single-word name', () => {
    expect(extractInitials('Student')).toBe('ST');
  });

  it('14. should fallback to "SD" initials on empty name', () => {
    expect(extractInitials('')).toBe('SD');
  });
});
