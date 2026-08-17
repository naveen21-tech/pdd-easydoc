import { describe, it, expect } from 'vitest';
import {
  DEFAULT_PRESENTATION_TEMPLATES,
  PRESENTATION_TEMPLATE_CATEGORIES,
  getPresentationTemplateById,
  createDeckFromTemplate,
} from '@/lib/templates/presentation-templates';

describe('Default Presentation Templates Catalog', () => {
  it('should define exactly 10 professional default templates', () => {
    expect(DEFAULT_PRESENTATION_TEMPLATES).toHaveLength(10);
  });

  it('should include all required default presentation templates', () => {
    const templateIds = DEFAULT_PRESENTATION_TEMPLATES.map((t) => t.id);
    expect(templateIds).toContain('academic-presentation');
    expect(templateIds).toContain('college-project-presentation');
    expect(templateIds).toContain('seminar-presentation');
    expect(templateIds).toContain('research-presentation');
    expect(templateIds).toContain('project-viva-presentation');
    expect(templateIds).toContain('business-presentation');
    expect(templateIds).toContain('internship-presentation');
    expect(templateIds).toContain('project-proposal');
    expect(templateIds).toContain('technical-presentation');
    expect(templateIds).toContain('simple-professional');
  });

  it('should verify all categories (Academic, College, Research, Business, Professional)', () => {
    const categories = new Set(DEFAULT_PRESENTATION_TEMPLATES.map((t) => t.category));
    expect(categories.has('Academic')).toBe(true);
    expect(categories.has('College')).toBe(true);
    expect(categories.has('Research')).toBe(true);
    expect(categories.has('Business')).toBe(true);
    expect(categories.has('Professional')).toBe(true);
  });

  it('should verify slide count matches slide definitions for every template', () => {
    DEFAULT_PRESENTATION_TEMPLATES.forEach((t) => {
      expect(t.slides.length).toBe(t.slideCount);
      expect(t.slides.length).toBeGreaterThanOrEqual(5);

      // Verify each slide has valid required fields
      t.slides.forEach((slide, idx) => {
        expect(slide.slideNumber).toBe(idx + 1);
        expect(slide.title.length).toBeGreaterThan(0);
        expect(slide.bullets.length).toBeGreaterThanOrEqual(2);
        expect(['title', 'content', 'split', 'stats', 'conclusion']).toContain(slide.layout);
        expect(slide.notes).toBeDefined();
      });
    });
  });

  it('should find template by ID using getPresentationTemplateById', () => {
    const collegeProject = getPresentationTemplateById('college-project-presentation');
    expect(collegeProject).toBeDefined();
    expect(collegeProject?.name).toBe('College Project Presentation');
    expect(collegeProject?.slideCount).toBe(12);
    expect(collegeProject?.category).toBe('College');

    const notFound = getPresentationTemplateById('non-existent-id');
    expect(notFound).toBeUndefined();
  });

  it('should instantiate clean, editable deck with unique slide IDs using createDeckFromTemplate', () => {
    const instantiated = createDeckFromTemplate('academic-presentation', 'My Master Thesis Defense');
    expect(instantiated.title).toBe('My Master Thesis Defense');
    expect(instantiated.slides).toHaveLength(8);
    expect(instantiated.slides[0].title).toBe('My Master Thesis Defense');
    expect(instantiated.slides[0].layout).toBe('title');
    expect(instantiated.slides[0].id).toContain('slide-');

    // Default title fallback if customTitle not passed
    const defaultDeck = createDeckFromTemplate('research-presentation');
    expect(defaultDeck.title).toBe('Research Presentation');
    expect(defaultDeck.slides).toHaveLength(10);
  });

  it('should verify category definitions list includes All and 5 specific categories', () => {
    expect(PRESENTATION_TEMPLATE_CATEGORIES).toHaveLength(6);
    const catIds = PRESENTATION_TEMPLATE_CATEGORIES.map((c) => c.id);
    expect(catIds).toEqual(['All', 'Academic', 'College', 'Research', 'Business', 'Professional']);
  });
});
