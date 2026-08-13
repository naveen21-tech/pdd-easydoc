import { describe, it, expect } from 'vitest';
import {
  parseContentIntoBlocks,
  paginateDocument,
  generateTableOfContents,
  insertOrUpdateTableOfContents,
} from '@/lib/export/pagination';

describe('Pagination & Layout Engine (lib/export/pagination.ts)', () => {
  it('should parse markdown into typed blocks with weights', () => {
    const markdown = `# Main Title
[TEMPLATE_BADGE] Engineering Spec
## 1. Scope
This is a standard paragraph.
- List item 1
- List item 2
> Blockquote note
[PAGE BREAK]
## 2. Technical Details
`;

    const blocks = parseContentIntoBlocks(markdown);
    expect(blocks.length).toBeGreaterThan(0);
    expect(blocks.some((b) => b.type === 'heading1')).toBe(true);
    expect(blocks.some((b) => b.type === 'template-badge')).toBe(true);
    expect(blocks.some((b) => b.type === 'heading2')).toBe(true);
    expect(blocks.some((b) => b.type === 'list-item')).toBe(true);
    expect(blocks.some((b) => b.type === 'blockquote')).toBe(true);
    expect(blocks.some((b) => b.type === 'page-break')).toBe(true);
  });

  it('should paginate content across multiple pages on [PAGE BREAK] or content overflow', () => {
    const multiPageMarkdown = `# Title Page
[TEMPLATE_BADGE] Research Paper
[PAGE BREAK]
## Page 2 Content
Details on section 2.
[PAGE BREAK]
## Page 3 Content
Details on section 3.
`;

    const result = paginateDocument(multiPageMarkdown);

    expect(result).toBeDefined();
    expect(result.totalPages).toBeGreaterThanOrEqual(3);
    expect(result.pages[0].pageNumber).toBe(1);
    expect(result.pages[1].pageNumber).toBe(2);
    expect(result.pages[2].pageNumber).toBe(3);
    expect(result.pages[0].htmlContent).toContain('STUDENTDOC');
  });

  it('should generate structured table of contents from headings', () => {
    const content = `# Project Architecture
## 1. Executive Summary
## 2. Infrastructure & Kubernetes
### 2.1 Pod Autoscaling
## 3. Database Replication
`;

    const toc = generateTableOfContents(content);

    expect(toc).toContain('## Table of Contents');
    expect(toc).toContain('Project Architecture');
    expect(toc).toContain('Executive Summary');
    expect(toc).toContain('Infrastructure & Kubernetes');
  });

  it('should insert or update Table of Contents in document content', () => {
    const content = `# System Design
[PAGE BREAK]
## 1. Microservices
Detailed breakdown.
`;

    const updated = insertOrUpdateTableOfContents(content);

    expect(updated).toContain('## Table of Contents');
    expect(updated).toContain('Microservices');
  });
});
