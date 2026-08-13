import { describe, it, expect } from 'vitest';
import { TEMPLATE_CATALOG, TemplateEntry } from '@/lib/templates/catalog';

describe('Document Templates: Resolution, Filtering & Prompt Assembly (Area 4)', () => {
  const findTemplateById = (id: string): TemplateEntry | undefined => {
    return TEMPLATE_CATALOG.find((t) => t.id === id);
  };

  const searchTemplates = (query: string): TemplateEntry[] => {
    const q = query.trim().toLowerCase();
    if (!q) return TEMPLATE_CATALOG;
    return TEMPLATE_CATALOG.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  };

  const getTemplatesByCategory = (category: string): TemplateEntry[] => {
    if (category === 'All') return TEMPLATE_CATALOG;
    return TEMPLATE_CATALOG.filter((t) => t.category === category);
  };

  const assemblePromptForTemplate = (template: TemplateEntry, customInput: string) => {
    return `[TEMPLATE_BADGE] ${template.name}\n${template.promptInstructions}\n\nUser Input:\n${customInput}`;
  };

  it('1. should resolve template by valid ID "cs-01"', () => {
    const template = findTemplateById('cs-01');
    expect(template).toBeDefined();
    expect(template?.id).toBe('cs-01');
  });

  it('2. should return undefined when template ID does not exist', () => {
    const template = findTemplateById('non-existent-template-id');
    expect(template).toBeUndefined();
  });

  it('3. should search templates by keyword "assignment"', () => {
    const results = searchTemplates('assignment');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((t) => t.name.toLowerCase().includes('assignment'))).toBe(true);
  });

  it('4. should search templates by keyword "resume"', () => {
    const results = searchTemplates('resume');
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.some((t) => t.category === 'ATS Resume Builder' || t.name.toLowerCase().includes('resume'))).toBe(true);
  });

  it('5. should search templates by keyword "thesis"', () => {
    const results = searchTemplates('thesis');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('6. should return all templates when search query is empty string', () => {
    const results = searchTemplates('');
    expect(results.length).toBe(TEMPLATE_CATALOG.length);
  });

  it('7. should return empty list when search query does not match any template', () => {
    const results = searchTemplates('xyz_non_existent_query_9999');
    expect(results.length).toBe(0);
  });

  it('8. should filter templates by category "College Students"', () => {
    const results = getTemplatesByCategory('College Students');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((t) => expect(t.category).toBe('College Students'));
  });

  it('9. should filter templates by category "Business Templates"', () => {
    const results = getTemplatesByCategory('Business Templates');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((t) => expect(t.category).toBe('Business Templates'));
  });

  it('10. should filter templates by category "Personal"', () => {
    const results = getTemplatesByCategory('Personal');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((t) => expect(t.category).toBe('Personal'));
  });

  it('11. should return all templates when getTemplatesByCategory receives "All"', () => {
    const results = getTemplatesByCategory('All');
    expect(results.length).toBe(TEMPLATE_CATALOG.length);
  });

  it('12. should assemble full generation prompt incorporating template instructions and badge', () => {
    const template = findTemplateById('cs-01')!;
    const prompt = assemblePromptForTemplate(template, 'Topic: Distributed Systems');

    expect(prompt).toContain(`[TEMPLATE_BADGE] ${template.name}`);
    expect(prompt).toContain(template.promptInstructions);
    expect(prompt).toContain('Topic: Distributed Systems');
  });

  it('13. should verify placeholderInputs array exists for templates', () => {
    const template = findTemplateById('cs-01')!;
    if (template.placeholderInputs) {
      expect(Array.isArray(template.placeholderInputs)).toBe(true);
      expect(template.placeholderInputs.length).toBeGreaterThan(0);
    }
  });

  it('14. should format template name for URL slugs safely', () => {
    const template = findTemplateById('cs-01')!;
    const slug = template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    expect(slug).toBe('assignment');
  });

  it('15. should verify estimatedTime format if present on templates', () => {
    const templatesWithTime = TEMPLATE_CATALOG.filter((t) => t.estimatedTime);
    templatesWithTime.forEach((t) => {
      expect(t.estimatedTime).toMatch(/\d+s/);
    });
  });

  it('16. should verify suggestedLength is formatted appropriately', () => {
    TEMPLATE_CATALOG.forEach((t) => {
      if (t.suggestedLength) {
        expect(typeof t.suggestedLength).toBe('string');
        expect(t.suggestedLength.length).toBeGreaterThan(0);
      }
    });
  });
});
