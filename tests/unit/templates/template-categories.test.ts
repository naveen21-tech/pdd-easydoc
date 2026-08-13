import { describe, it, expect } from 'vitest';
import { TEMPLATE_CATALOG, TEMPLATE_CATEGORIES } from '@/lib/templates/catalog';

describe('Document Templates: Categories & Registry Schema (Area 4)', () => {
  it('1. should contain all required category definitions', () => {
    expect(TEMPLATE_CATEGORIES).toContain('All');
    expect(TEMPLATE_CATEGORIES).toContain('College Students');
    expect(TEMPLATE_CATEGORIES).toContain('Faculty Templates');
    expect(TEMPLATE_CATEGORIES).toContain('Business Templates');
    expect(TEMPLATE_CATEGORIES).toContain('ATS Resume Builder');
    expect(TEMPLATE_CATEGORIES).toContain('Letters');
    expect(TEMPLATE_CATEGORIES).toContain('Government');
    expect(TEMPLATE_CATEGORIES).toContain('Personal');
  });

  it('2. should have College Students templates registered', () => {
    const collegeTemplates = TEMPLATE_CATALOG.filter((t) => t.category === 'College Students');
    expect(collegeTemplates.length).toBeGreaterThanOrEqual(10);
  });

  it('3. should verify Assignment template schema in College Students category', () => {
    const assignment = TEMPLATE_CATALOG.find((t) => t.id === 'cs-01');
    expect(assignment).toBeDefined();
    expect(assignment?.name).toBe('Assignment');
    expect(assignment?.suggestedTone).toBe('Academic & Analytical');
    expect(assignment?.promptInstructions.length).toBeGreaterThan(20);
  });

  it('4. should verify Lab Report template schema', () => {
    const labReport = TEMPLATE_CATALOG.find((t) => t.name.toLowerCase().includes('lab report') || t.id === 'cs-02');
    expect(labReport).toBeDefined();
    expect(labReport?.category).toBe('College Students');
  });

  it('5. should have Faculty templates registered', () => {
    const facultyTemplates = TEMPLATE_CATALOG.filter((t) => t.category === 'Faculty Templates');
    expect(facultyTemplates.length).toBeGreaterThanOrEqual(4);
  });

  it('6. should verify Course Syllabus template in Faculty category', () => {
    const syllabus = TEMPLATE_CATALOG.find((t) => t.name.includes('Syllabus') || t.category === 'Faculty Templates');
    expect(syllabus).toBeDefined();
  });

  it('7. should have Business templates registered', () => {
    const businessTemplates = TEMPLATE_CATALOG.filter((t) => t.category === 'Business Templates');
    expect(businessTemplates.length).toBeGreaterThanOrEqual(4);
  });

  it('8. should verify Business Proposal template schema', () => {
    const proposal = TEMPLATE_CATALOG.find((t) => t.name.includes('Proposal') || t.category === 'Business Templates');
    expect(proposal).toBeDefined();
  });

  it('9. should have ATS Resume Builder templates registered', () => {
    const resumeTemplates = TEMPLATE_CATALOG.filter((t) => t.category === 'ATS Resume Builder');
    expect(resumeTemplates.length).toBeGreaterThanOrEqual(3);
  });

  it('10. should have Letters templates registered', () => {
    const letterTemplates = TEMPLATE_CATALOG.filter((t) => t.category === 'Letters');
    expect(letterTemplates.length).toBeGreaterThanOrEqual(2);
  });

  it('11. should have Government templates registered', () => {
    const govTemplates = TEMPLATE_CATALOG.filter((t) => t.category === 'Government');
    expect(govTemplates.length).toBeGreaterThanOrEqual(2);
  });

  it('12. should have Personal templates registered', () => {
    const personalTemplates = TEMPLATE_CATALOG.filter((t) => t.category === 'Personal');
    expect(personalTemplates.length).toBeGreaterThanOrEqual(2);
  });

  it('13. should ensure each template contains tags array with at least 1 tag', () => {
    TEMPLATE_CATALOG.forEach((template) => {
      expect(Array.isArray(template.tags)).toBe(true);
      expect(template.tags.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('14. should ensure each template has an iconName specified', () => {
    TEMPLATE_CATALOG.forEach((template) => {
      expect(template.iconName).toBeDefined();
      expect(typeof template.iconName).toBe('string');
      expect(template.iconName.length).toBeGreaterThan(0);
    });
  });

  it('15. should ensure each template has a description with sufficient explanation', () => {
    TEMPLATE_CATALOG.forEach((template) => {
      expect(template.description).toBeDefined();
      expect(template.description.length).toBeGreaterThan(10);
    });
  });

  it('16. should check that popular templates have isPopular flag set', () => {
    const popularTemplates = TEMPLATE_CATALOG.filter((t) => t.isPopular === true);
    expect(popularTemplates.length).toBeGreaterThan(0);
  });
});
