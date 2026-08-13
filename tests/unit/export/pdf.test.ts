import { describe, it, expect } from 'vitest';
import { generateStyledHtmlDocument, PdfExportOptions } from '@/lib/export/pdf';

describe('PDF & Multi-Page HTML Exporter (lib/export/pdf.ts)', () => {
  it('should generate complete HTML5 document with StudentDoc running headers, footers, and styles', () => {
    const title = 'Engineering Project Final Thesis';
    const markdown = `# Engineering Project Final Thesis
[TEMPLATE_BADGE] Master Thesis
## 1. Abstract
Comprehensive investigation into edge computing.
[PAGE BREAK]
## 2. Experimental Results
High throughput benchmarks.
`;

    const options: PdfExportOptions = {
      author: 'Naveen Kumar',
      institution: 'Saveetha School of Engineering',
      borderColor: '#7C3AED',
      borderStyle: 'formal',
    };

    const html = generateStyledHtmlDocument(title, markdown, options);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Engineering Project Final Thesis - StudentDoc Multi-Page Document</title>');
    expect(html).toContain('StudentDoc');
    expect(html).toContain('Naveen Kumar');
    expect(html).toContain('Saveetha School of Engineering');
    expect(html).toContain('class="a4-page"');
    expect(html).toContain('Page 1 of');
  });

  it('should apply border styles and customizable theme colors', () => {
    const title = 'Short Memo';
    const markdown = '# Quick Note\nShort message.';

    const doubleBorderHtml = generateStyledHtmlDocument(title, markdown, {
      borderStyle: 'double',
      borderColor: '#2563EB',
    });
    expect(doubleBorderHtml).toContain('border: 6px double #2563EB');

    const noBorderHtml = generateStyledHtmlDocument(title, markdown, {
      borderStyle: 'none',
    });
    expect(noBorderHtml).toBeDefined();
  });
});
