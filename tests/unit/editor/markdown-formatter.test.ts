import { describe, it, expect } from 'vitest';

describe('Document Editor: Markdown & Rich Formatting Engine (Area 5)', () => {
  const applyBold = (text: string) => `**${text}**`;
  const applyItalic = (text: string) => `*${text}*`;
  const applyUnderline = (text: string) => `<u>${text}</u>`;
  const applyStrikethrough = (text: string) => `~~${text}~~`;
  const applyInlineCode = (text: string) => `\`${text}\``;
  const applyHeading = (text: string, level: 1 | 2 | 3 | 4) => `${'#'.repeat(level)} ${text}`;
  const applyBlockquote = (text: string) => `> ${text}`;
  const applyBulletList = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
  const applyNumberedList = (items: string[]) => items.map((i, idx) => `${idx + 1}. ${i}`).join('\n');
  const applyCodeBlock = (code: string, language = '') => `\`\`\`${language}\n${code}\n\`\`\``;
  const applyPageBreak = () => '[PAGE BREAK]';

  it('1. should format text with bold asterisks', () => {
    expect(applyBold('Executive Summary')).toBe('**Executive Summary**');
  });

  it('2. should format text with italic asterisks', () => {
    expect(applyItalic('Important Note')).toBe('*Important Note*');
  });

  it('3. should format text with HTML underline tags', () => {
    expect(applyUnderline('Underlined Heading')).toBe('<u>Underlined Heading</u>');
  });

  it('4. should format text with strikethrough tildes', () => {
    expect(applyStrikethrough('Deprecated Methodology')).toBe('~~Deprecated Methodology~~');
  });

  it('5. should format inline code with backticks', () => {
    expect(applyInlineCode('npm run dev')).toBe('`npm run dev`');
  });

  it('6. should format Heading 1 (#)', () => {
    expect(applyHeading('Project Title', 1)).toBe('# Project Title');
  });

  it('7. should format Heading 2 (##)', () => {
    expect(applyHeading('System Architecture', 2)).toBe('## System Architecture');
  });

  it('8. should format Heading 3 (###)', () => {
    expect(applyHeading('Database Replication', 3)).toBe('### Database Replication');
  });

  it('9. should format Heading 4 (####)', () => {
    expect(applyHeading('PostgreSQL Partitioning', 4)).toBe('#### PostgreSQL Partitioning');
  });

  it('10. should format blockquotes with > prefix', () => {
    expect(applyBlockquote('Zero-trust architecture enforces continuous validation.')).toBe(
      '> Zero-trust architecture enforces continuous validation.'
    );
  });

  it('11. should format bullet list with dash prefixes', () => {
    const list = applyBulletList(['Item A', 'Item B', 'Item C']);
    expect(list).toBe('- Item A\n- Item B\n- Item C');
  });

  it('12. should format numbered list with indexed numbers', () => {
    const list = applyNumberedList(['Step 1', 'Step 2', 'Step 3']);
    expect(list).toBe('1. Step 1\n2. Step 2\n3. Step 3');
  });

  it('13. should format multi-line code block with language specifier', () => {
    const code = 'const x: number = 42;\nconsole.log(x);';
    const formatted = applyCodeBlock(code, 'typescript');
    expect(formatted).toBe('```typescript\nconst x: number = 42;\nconsole.log(x);\n```');
  });

  it('14. should insert discrete page break marker [PAGE BREAK]', () => {
    expect(applyPageBreak()).toBe('[PAGE BREAK]');
  });

  it('15. should combine bold and italic formatting', () => {
    const text = applyBold(applyItalic('Crucial Finding'));
    expect(text).toBe('***Crucial Finding***');
  });

  it('16. should construct markdown table from headers and row data', () => {
    const headers = ['Metric', 'Score', 'Status'];
    const rows = [
      ['Performance', '95%', 'Optimal'],
      ['Security', '98%', 'Optimal'],
    ];

    const table = `| ${headers.join(' | ')} |\n| ${headers.map(() => ':---').join(' | ')} |\n${rows
      .map((r) => `| ${r.join(' | ')} |`)
      .join('\n')}`;

    expect(table).toContain('| Metric | Score | Status |');
    expect(table).toContain('| Performance | 95% | Optimal |');
  });

  it('17. should strip markdown characters for word count calculations', () => {
    const markdown = '# Main Heading\nThis is **bold** text and *italic* note with `code`.';
    const stripped = markdown
      .replace(/#+\s+/g, '')
      .replace(/[*_`~]/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();

    expect(stripped).toBe('Main Heading\nThis is bold text and italic note with code.');
  });

  it('18. should count words accurately in formatted markdown text', () => {
    const markdown = '# Chapter 1\nDistributed consensus guarantees consistency in replicated state machines.';
    const words = markdown.split(/\s+/).filter((w) => w.length > 0 && !w.startsWith('#'));
    expect(words.length).toBe(10);
  });
});
