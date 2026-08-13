import { describe, it, expect } from 'vitest';
import { TEMPLATE_CATALOG, TEMPLATE_CATEGORIES, TemplateEntry } from '@/lib/templates/catalog';

describe('Template Catalog Service (lib/templates/catalog.ts)', () => {
  it('should have templates registered in catalog', () => {
    expect(TEMPLATE_CATALOG).toBeDefined();
    expect(Array.isArray(TEMPLATE_CATALOG)).toBe(true);
    expect(TEMPLATE_CATALOG.length).toBeGreaterThanOrEqual(30);
  });

  it('should contain valid template categories', () => {
    expect(TEMPLATE_CATEGORIES).toBeDefined();
    expect(TEMPLATE_CATEGORIES).toContain('College Students');
    expect(TEMPLATE_CATEGORIES).toContain('Business Templates');
    expect(TEMPLATE_CATEGORIES).toContain('ATS Resume Builder');
    expect(TEMPLATE_CATEGORIES).toContain('Government');
  });

  it('should validate that every template has required fields (id, name, category, promptInstructions)', () => {
    TEMPLATE_CATALOG.forEach((template: TemplateEntry) => {
      expect(template.id).toBeDefined();
      expect(template.id.length).toBeGreaterThan(0);
      expect(template.name).toBeDefined();
      expect(template.category).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.promptInstructions).toBeDefined();
      expect(Array.isArray(template.tags)).toBe(true);
    });
  });

  it('should ensure all template IDs are unique', () => {
    const ids = TEMPLATE_CATALOG.map((t) => t.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
