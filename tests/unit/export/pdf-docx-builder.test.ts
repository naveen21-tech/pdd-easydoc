import { describe, it, expect } from 'vitest';
import { generateStyledHtmlDocument, PdfExportOptions } from '@/lib/export/pdf';
import { generateQrDataUrl, generateVerificationCode } from '@/lib/export/qr';

describe('Document Export: PDF, HTML Layouts & Security Badges (Area 8)', () => {
  it('1. should include standard HTML5 doctype declaration in PDF export HTML', () => {
    const html = generateStyledHtmlDocument('My Document', '# Title\nContent');
    expect(html).toContain('<!DOCTYPE html>');
  });

  it('2. should set document title tag in HTML header', () => {
    const html = generateStyledHtmlDocument('Cloud Infrastructure', '# Title\nContent');
    expect(html).toContain('<title>Cloud Infrastructure - StudentDoc Multi-Page Document</title>');
  });

  it('3. should render StudentDoc brand badge in running header', () => {
    const html = generateStyledHtmlDocument('Research Paper', '# Title\nContent');
    expect(html).toContain('StudentDoc');
    expect(html).toContain('brand-badge');
  });

  it('4. should render author name in document header and footer when provided', () => {
    const options: PdfExportOptions = {
      author: 'Naveen Kumar',
      institution: 'Saveetha School of Engineering',
    };
    const html = generateStyledHtmlDocument('Thesis', '# Title\nContent', options);
    expect(html).toContain('Naveen Kumar');
    expect(html).toContain('Saveetha School of Engineering');
  });

  it('5. should support solid border style in PDF export', () => {
    const options: PdfExportOptions = {
      borderStyle: 'solid',
      borderColor: '#7C3AED',
      borderWidth: 2,
    };
    const html = generateStyledHtmlDocument('Solid Border Doc', '# Title\nContent', options);
    expect(html).toContain('border: 2px solid #7C3AED');
  });

  it('6. should support double border style in PDF export', () => {
    const options: PdfExportOptions = {
      borderStyle: 'double',
      borderColor: '#2563EB',
    };
    const html = generateStyledHtmlDocument('Double Border Doc', '# Title\nContent', options);
    expect(html).toContain('border: 6px double #2563EB');
  });

  it('7. should support formal border style with outer outline', () => {
    const options: PdfExportOptions = {
      borderStyle: 'formal',
      borderColor: '#059669',
      borderWidth: 3,
    };
    const html = generateStyledHtmlDocument('Formal Border Doc', '# Title\nContent', options);
    expect(html).toContain('outline: 3px double #059669');
  });

  it('8. should support borderStyle "none"', () => {
    const options: PdfExportOptions = {
      borderStyle: 'none',
    };
    const html = generateStyledHtmlDocument('No Border Doc', '# Title\nContent', options);
    expect(html).toBeDefined();
  });

  it('9. should render page counter in running footer', () => {
    const html = generateStyledHtmlDocument('Page Count Doc', '# Title\nContent');
    expect(html).toContain('Page 1 of');
  });

  it('10. should include print CSS rules for standard A4 dimensions (@page { size: A4 portrait; })', () => {
    const html = generateStyledHtmlDocument('Print Spec', '# Title\nContent');
    expect(html).toContain('@page');
    expect(html).toContain('size: A4 portrait');
  });

  it('11. should generate QR verification code data URL', async () => {
    const qrDataUrl = await generateQrDataUrl('https://studentdoc.saveetha.com/verify/EDOC-2026-ABC');
    expect(qrDataUrl).toBeDefined();
    expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('12. should generate unique verification code with current year prefix', () => {
    const code = generateVerificationCode();
    const currentYear = new Date().getFullYear();
    expect(code.startsWith(`EDOC-${currentYear}-`)).toBe(true);
  });

  it('13. should ensure unique verification codes across multiple calls', () => {
    const code1 = generateVerificationCode();
    const code2 = generateVerificationCode();
    expect(code1).not.toBe(code2);
  });

  it('14. should format custom QR colors when specified', async () => {
    const qrDataUrl = await generateQrDataUrl('https://example.com', {
      darkColor: '#7C3AED',
      lightColor: '#FFFFFF',
      width: 200,
    });
    expect(qrDataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('15. should handle special symbols in document title during PDF HTML compilation', () => {
    const html = generateStyledHtmlDocument('Title with & < > " symbols', '# Title & Intro\nParagraph');
    expect(html).toContain('&amp;');
  });

  it('16. should handle multi-page documents in PDF HTML generation', () => {
    const multiPageMarkdown = `# Page 1\n[PAGE BREAK]\n# Page 2\n[PAGE BREAK]\n# Page 3`;
    const html = generateStyledHtmlDocument('3 Page Document', multiPageMarkdown);
    const pageMatches = html.match(/class="a4-page"/g);
    expect(pageMatches?.length).toBe(3);
  });
});
