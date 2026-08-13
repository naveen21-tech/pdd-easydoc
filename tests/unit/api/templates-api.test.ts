import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/templates/route';

describe('Templates API Route (app/api/templates/route.ts)', () => {
  it('GET should return list of all templates', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.templates).toBeDefined();
    expect(Array.isArray(data.templates)).toBe(true);
    expect(data.total).toBeGreaterThanOrEqual(30);
  });
});
