import { describe, it, expect } from 'vitest';
import { generatePlainText, generateMarkdownText } from '@/lib/export/txt';

describe('Plain Text & Markdown Exporter (lib/export/txt.ts)', () => {
  it('should format plain text document with header banner and stripped markdown syntax', () => {
    const title = 'System Architecture Overview';
    const markdown = `# Main Title
## Subtitle
This is **bold** text and *italic* note.
> Important Quote
\`inline code\`
`;

    const plainText = generatePlainText(title, markdown);

    expect(plainText).toContain('SYSTEM ARCHITECTURE OVERVIEW');
    expect(plainText).toContain('StudentDoc Export | Date:');
    expect(plainText).not.toContain('**bold**');
    expect(plainText).not.toContain('# Main Title');
    expect(plainText).toContain('bold text and italic note');
  });

  it('should generate markdown text with document metadata comment block', () => {
    const title = 'Research Project Report';
    const content = '## Executive Summary\nDetailed findings.';

    const mdOutput = generateMarkdownText(title, content);

    expect(mdOutput).toContain('<!--');
    expect(mdOutput).toContain('Document: Research Project Report');
    expect(mdOutput).toContain('Exported via StudentDoc on');
    expect(mdOutput).toContain('-->');
    expect(mdOutput).toContain('## Executive Summary');
  });
});
