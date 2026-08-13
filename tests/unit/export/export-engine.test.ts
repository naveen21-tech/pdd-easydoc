import { describe, it, expect } from 'vitest';
import { generatePlainText, generateMarkdownText } from '@/lib/export/txt';

describe('Document Export: Plain Text, Markdown & Metadata Headers (Area 8)', () => {
  it('1. should generate plain text with uppercase header title', () => {
    const text = generatePlainText('Project Charter', '# Scope\nProject details.');
    expect(text).toContain('PROJECT CHARTER');
  });

  it('2. should include export date banner in plain text', () => {
    const text = generatePlainText('Report', 'Content');
    expect(text).toContain('StudentDoc Export | Date:');
  });

  it('3. should strip markdown bold markers (**)', () => {
    const text = generatePlainText('Doc', 'This is **bold** text.');
    expect(text).not.toContain('**bold**');
    expect(text).toContain('bold text');
  });

  it('4. should strip markdown italic markers (*)', () => {
    const text = generatePlainText('Doc', 'This is *italic* text.');
    expect(text).not.toContain('*italic*');
    expect(text).toContain('italic text');
  });

  it('5. should strip markdown heading hashes (#)', () => {
    const text = generatePlainText('Doc', '# Heading 1\n## Heading 2\n### Heading 3');
    expect(text).not.toContain('# Heading 1');
    expect(text).toContain('Heading 1');
    expect(text).toContain('Heading 2');
    expect(text).toContain('Heading 3');
  });

  it('6. should strip blockquote markers (>)', () => {
    const text = generatePlainText('Doc', '> Important quote here.');
    expect(text).not.toContain('> Important');
    expect(text).toContain('Important quote here.');
  });

  it('7. should strip inline code backticks (`) and code contents', () => {
    const text = generatePlainText('Doc', 'Run `npm test` to verify.');
    expect(text).not.toContain('`npm test`');
    expect(text).toContain('Run');
    expect(text).toContain('to verify.');
  });

  it('8. should format bullet list text cleanly in plain text export', () => {
    const text = generatePlainText('Doc', '- Point 1\n- Point 2\n- Point 3');
    expect(text).toContain('- Point 1');
    expect(text).toContain('- Point 2');
    expect(text).toContain('- Point 3');
  });

  it('9. should generate markdown text with HTML metadata comment block', () => {
    const md = generateMarkdownText('Research Findings', '## Introduction\nDetails.');
    expect(md).toContain('<!--');
    expect(md).toContain('Document: Research Findings');
    expect(md).toContain('Exported via StudentDoc');
    expect(md).toContain('-->');
  });

  it('10. should preserve markdown content intact in markdown export', () => {
    const originalContent = '## Chapter 1\n**Bold Statement**\n```typescript\nconst x = 10;\n```';
    const md = generateMarkdownText('Code Specs', originalContent);
    expect(md).toContain(originalContent);
  });

  it('11. should handle empty document content in plain text export', () => {
    const text = generatePlainText('Empty Document', '');
    expect(text).toContain('EMPTY DOCUMENT');
  });

  it('12. should handle empty document content in markdown export', () => {
    const md = generateMarkdownText('Empty Document', '');
    expect(md).toContain('Document: Empty Document');
  });

  it('13. should handle multi-line tables in plain text export cleanly', () => {
    const tableMd = '| Key | Value |\n| :--- | :--- |\n| Server | Nginx |\n| DB | Postgres |';
    const text = generatePlainText('Table Doc', tableMd);
    expect(text).toContain('Server');
    expect(text).toContain('Postgres');
  });

  it('14. should format safe filename for plain text export', () => {
    const title = 'Annual Report: Q4 / 2026';
    const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.txt`;
    expect(safeFilename).toBe('annual_report__q4___2026.txt');
  });

  it('15. should format safe filename for markdown export', () => {
    const title = 'Architecture & Security Spec';
    const safeFilename = `${title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase()}.md`;
    expect(safeFilename).toBe('architecture___security_spec.md');
  });

  it('16. should handle unicode characters in exported document headers', () => {
    const text = generatePlainText('Thèse de Doctorat 2026', 'Contenu en français.');
    expect(text).toContain('THÈSE DE DOCTORAT 2026');
  });
});
