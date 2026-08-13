import { describe, it, expect } from 'vitest';
import {
  parseContentIntoBlocks,
  paginateDocument,
  generateTableOfContents,
  insertOrUpdateTableOfContents,
} from '@/lib/export/pagination';

describe('Document Layout: A4 Pagination Flow & Table of Contents (Area 8)', () => {
  it('1. should calculate block weight for H1 heading (approx 68px)', () => {
    const blocks = parseContentIntoBlocks('# Main Title');
    expect(blocks[0].type).toBe('heading1');
    expect(blocks[0].weight).toBe(68);
  });

  it('2. should calculate block weight for H2 heading (approx 48px)', () => {
    const blocks = parseContentIntoBlocks('## Subheading');
    expect(blocks[0].type).toBe('heading2');
    expect(blocks[0].weight).toBe(48);
  });

  it('3. should calculate block weight for H3 heading (approx 38px)', () => {
    const blocks = parseContentIntoBlocks('### Section Detail');
    expect(blocks[0].type).toBe('heading3');
    expect(blocks[0].weight).toBe(38);
  });

  it('4. should calculate block weight for template badge (approx 40px)', () => {
    const blocks = parseContentIntoBlocks('[TEMPLATE_BADGE] Engineering Thesis');
    expect(blocks[0].type).toBe('template-badge');
    expect(blocks[0].weight).toBe(40);
  });

  it('5. should assign 0 weight for manual [PAGE BREAK] markers', () => {
    const blocks = parseContentIntoBlocks('[PAGE BREAK]');
    expect(blocks[0].type).toBe('page-break');
    expect(blocks[0].weight).toBe(0);
  });

  it('6. should assign 0 weight for markdown horizontal rule (---) as page break', () => {
    const blocks = parseContentIntoBlocks('---');
    expect(blocks[0].type).toBe('page-break');
    expect(blocks[0].weight).toBe(0);
  });

  it('7. should calculate block weight for standard text paragraph proportional to length', () => {
    const shortText = 'Short paragraph.';
    const longText = 'A very long paragraph '.repeat(10);

    const shortBlock = parseContentIntoBlocks(shortText)[0];
    const longBlock = parseContentIntoBlocks(longText)[0];

    expect(longBlock.weight).toBeGreaterThan(shortBlock.weight);
  });

  it('8. should calculate block weight for markdown tables based on row count', () => {
    const table2Rows = '| A | B |\n| 1 | 2 |';
    const table4Rows = '| A | B |\n| 1 | 2 |\n| 3 | 4 |\n| 5 | 6 |';

    const block2 = parseContentIntoBlocks(table2Rows)[0];
    const block4 = parseContentIntoBlocks(table4Rows)[0];

    expect(block4.weight).toBeGreaterThan(block2.weight);
  });

  it('9. should paginate discrete pages when [PAGE BREAK] is present', () => {
    const markdown = `# Cover Page\n[PAGE BREAK]\n## Page 2\nContent on page 2\n[PAGE BREAK]\n## Page 3\nContent on page 3`;
    const result = paginateDocument(markdown);

    expect(result.totalPages).toBe(3);
    expect(result.pages.length).toBe(3);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[1].pageNumber).toBe(2);
    expect(result.pages[2].pageNumber).toBe(3);
  });

  it('10. should automatically break long content across pages when exceeding max page weight (870px)', () => {
    const longContent = Array.from({ length: 40 }, (_, i) => `## Section ${i + 1}\nDetailed paragraph for section ${i + 1}.`).join('\n\n');
    const result = paginateDocument(longContent);

    expect(result.totalPages).toBeGreaterThan(1);
    expect(result.pages.length).toBe(result.totalPages);
  });

  it('11. should generate Table of Contents markdown table from headings', () => {
    const content = `# Project Architecture\n## 1. Introduction\n### 1.1 Background\n## 2. Methodology`;
    const toc = generateTableOfContents(content);

    expect(toc).toContain('## Table of Contents');
    expect(toc).toContain('Project Architecture');
    expect(toc).toContain('Introduction');
    expect(toc).toContain('Background');
    expect(toc).toContain('Methodology');
  });

  it('12. should return placeholder message when document has no headings for Table of Contents', () => {
    const content = 'Just a raw paragraph with no headings.';
    const toc = generateTableOfContents(content);

    expect(toc).toContain('No headings detected');
  });

  it('13. should insert Table of Contents after title page with [PAGE BREAK]', () => {
    const content = `# Main Title\n[PAGE BREAK]\n## Section 1\nContent 1`;
    const result = insertOrUpdateTableOfContents(content);

    expect(result).toContain('## Table of Contents');
    expect(result).toContain('## Section 1');
  });

  it('14. should update existing Table of Contents in document without duplicating sections', () => {
    const content = `# Main Title\n## Table of Contents\nOld TOC\n## Section 1\nContent 1`;
    const result = insertOrUpdateTableOfContents(content);

    const matches = result.match(/## Table of Contents/g);
    expect(matches?.length).toBe(1);
  });

  it('15. should render brand logo badge on the first page HTML', () => {
    const markdown = `# Title Page\n[TEMPLATE_BADGE] Research Paper\n## Scope\nScope text.`;
    const result = paginateDocument(markdown);

    expect(result.pages[0].htmlContent).toContain('STUDENTDOC');
  });

  it('16. should handle empty document pagination gracefully', () => {
    const result = paginateDocument('');
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });
});
