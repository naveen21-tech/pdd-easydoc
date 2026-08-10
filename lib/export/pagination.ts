// Intelligent Content-Aware Pagination Engine for A4 Documents (210mm x 297mm)
// Supports Rich Inline Formatting (Bold, Italic, Underline, Code, Tables, Title Page Decoration)

export interface DocumentBlock {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list-item' | 'blockquote' | 'table' | 'code' | 'page-break' | 'hr' | 'template-badge';
  content: string;
  raw: string;
  weight: number; // Approximate height in points/pixels
}

export interface PaginatedPage {
  pageNumber: number;
  blocks: DocumentBlock[];
  rawText: string;
  htmlContent: string;
}

export interface PaginationResult {
  pages: PaginatedPage[];
  totalPages: number;
}

// A4 printable height at 96 DPI: ~1123px.
// Margins (20mm top + 20mm bottom ≈ 150px). Header/Footer ≈ 100px.
// Available content height per A4 page ≈ 870px (~55-60 standard lines of text).
const MAX_PAGE_WEIGHT = 870;

export function parseContentIntoBlocks(markdown: string): DocumentBlock[] {
  const lines = markdown.split('\n');
  const blocks: DocumentBlock[] = [];

  let inTable = false;
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const tableContent = tableRows.join('\n');
      blocks.push({
        type: 'table',
        content: tableContent,
        raw: tableContent,
        weight: tableRows.length * 38 + 24,
      });
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for Table rows
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (!trimmed) {
      // Empty line / spacing
      blocks.push({
        type: 'paragraph',
        content: '',
        raw: '',
        weight: 12,
      });
      continue;
    }

    // Template Badge Indicator
    if (trimmed.startsWith('[TEMPLATE_BADGE]') || trimmed.startsWith('Template:') || trimmed.startsWith('**Template:**')) {
      blocks.push({
        type: 'template-badge',
        content: trimmed.replace(/^\[TEMPLATE_BADGE\]\s*/, '').replace(/^\*\*Template:\*\*\s*/, '').replace(/^Template:\s*/, ''),
        raw: line,
        weight: 40,
      });
      continue;
    }

    // Manual Page Break indicators
    if (
      trimmed === '---' ||
      trimmed === '***' ||
      trimmed === '___' ||
      trimmed.toLowerCase() === '[page break]' ||
      trimmed.toLowerCase() === '[page-break]' ||
      trimmed.toLowerCase().includes('page-break-after') ||
      trimmed.toLowerCase().includes('class="page-break"')
    ) {
      blocks.push({
        type: 'page-break',
        content: '[PAGE BREAK]',
        raw: line,
        weight: 0,
      });
      continue;
    }

    // Headings (H1 is bigger, bold and styled for Title / Cover page)
    if (trimmed.startsWith('# ')) {
      blocks.push({
        type: 'heading1',
        content: trimmed.replace(/^#\s+/, ''),
        raw: line,
        weight: 68, // Larger height for bold title
      });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({
        type: 'heading2',
        content: trimmed.replace(/^##\s+/, ''),
        raw: line,
        weight: 48,
      });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({
        type: 'heading3',
        content: trimmed.replace(/^###\s+/, ''),
        raw: line,
        weight: 38,
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      // List items
      blocks.push({
        type: 'list-item',
        content: trimmed.replace(/^([-*]|\d+\.)\s+/, ''),
        raw: line,
        weight: 26,
      });
    } else if (trimmed.startsWith('> ')) {
      // Blockquotes
      const quoteText = trimmed.replace(/^>\s+/, '');
      const approxLines = Math.max(1, Math.ceil(quoteText.length / 75));
      blocks.push({
        type: 'blockquote',
        content: quoteText,
        raw: line,
        weight: approxLines * 24 + 28,
      });
    } else {
      // Standard Paragraph
      const approxLines = Math.max(1, Math.ceil(trimmed.length / 80));
      blocks.push({
        type: 'paragraph',
        content: trimmed,
        raw: line,
        weight: approxLines * 24 + 12,
      });
    }
  }

  if (inTable) {
    flushTable();
  }

  return blocks;
}

export function paginateDocument(markdownContent: string): PaginationResult {
  const blocks = parseContentIntoBlocks(markdownContent);
  const pages: PaginatedPage[] = [];

  let currentPageBlocks: DocumentBlock[] = [];
  let currentWeight = 0;
  let pageIndex = 1;

  const pushCurrentPage = () => {
    if (currentPageBlocks.length > 0) {
      const rawText = currentPageBlocks.map((b) => b.raw).join('\n');
      const htmlContent = renderBlocksToHtml(currentPageBlocks, pageIndex === 1);
      pages.push({
        pageNumber: pageIndex,
        blocks: [...currentPageBlocks],
        rawText,
        htmlContent,
      });
      pageIndex++;
      currentPageBlocks = [];
      currentWeight = 0;
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // Explicit manual page break
    if (block.type === 'page-break') {
      pushCurrentPage();
      continue;
    }

    // Check if block would overflow current page
    if (currentWeight + block.weight > MAX_PAGE_WEIGHT && currentPageBlocks.length > 0) {
      // Heading keep-with-next protection:
      // If the last block is a heading, move the heading to the new page so it's not orphaned at the bottom
      const lastBlock = currentPageBlocks[currentPageBlocks.length - 1];
      if (lastBlock && (lastBlock.type === 'heading1' || lastBlock.type === 'heading2' || lastBlock.type === 'heading3')) {
        currentPageBlocks.pop();
        pushCurrentPage();
        currentPageBlocks.push(lastBlock);
        currentWeight += lastBlock.weight;
      } else {
        pushCurrentPage();
      }
    }

    currentPageBlocks.push(block);
    currentWeight += block.weight;
  }

  // Push any remaining content into the final page
  if (currentPageBlocks.length > 0 || pages.length === 0) {
    pushCurrentPage();
  }

  return {
    pages,
    totalPages: Math.max(1, pages.length),
  };
}

// Convert inline formatting (Bold, Italic, Underline, Code, Links) safely into HTML
export function formatInlineText(text: string): string {
  if (!text) return '';

  let html = text;

  // 1. Convert Markdown Bold (**text** or __text__)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 700; color: #0F172A;">$1</strong>');
  html = html.replace(/__(.+?)__/g, '<strong style="font-weight: 700; color: #0F172A;">$1</strong>');

  // 2. Convert Markdown Italic (*text* or _text_)
  html = html.replace(/\*([^*]+?)\*/g, '<em style="font-style: italic;">$1</em>');
  html = html.replace(/_([^_]+?)_/g, '<em style="font-style: italic;">$1</em>');

  // 3. Convert Inline Code (`code`)
  html = html.replace(/`([^`]+?)`/g, '<code style="font-family: monospace; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; border: 1px solid #E2E8F0; color: #7C3AED;">$1</code>');

  // 4. Convert Strikethrough (~~text~~)
  html = html.replace(/~~(.+?)~~/g, '<s style="text-decoration: line-through; opacity: 0.75;">$1</s>');

  // 5. Convert Underline (<u>text</u>)
  html = html.replace(/<u>(.+?)<\/u>/gi, '<u style="text-decoration: underline;">$1</u>');

  // 6. Convert Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: #7C3AED; font-weight: 600; text-decoration: underline;">$1</a>');

  return html;
}

export function renderBlocksToHtml(blocks: DocumentBlock[], isFrontTitlePage = false, borderColor = '#7C3AED'): string {
  let html = '';

  for (const block of blocks) {
    if (block.type === 'template-badge') {
      // Decorated Top Template Badge
      html += `
        <div style="margin-bottom: 20px; display: inline-flex; align-items: center; background: #F5F3FF; border: 1.5px solid #DDD6FE; padding: 5px 14px; border-radius: 20px; box-shadow: 0 1px 3px rgba(124, 58, 237, 0.08);">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #7C3AED; margin-right: 8px;"></span>
          <span style="font-size: 11.5px; font-weight: 700; color: #6D28D9; text-transform: uppercase; letter-spacing: 0.5px;">Template: ${escapeHtml(block.content)}</span>
        </div>
      `;
    } else if (block.type === 'heading1') {
      // Decorated Front Title (Bigger, Bold, with Accent Underline)
      if (isFrontTitlePage) {
        html += `
          <div style="margin-top: 12px; margin-bottom: 24px; padding-bottom: 14px; border-bottom: 3px solid ${borderColor};">
            <h1 style="color: #0F172A; font-family: 'Sora', sans-serif; font-size: 28px; font-weight: 800; line-height: 1.25; letter-spacing: -0.5px; margin: 0 0 8px 0; page-break-after: avoid; break-after: avoid-page;">
              ${formatInlineText(block.content)}
            </h1>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: #64748B; font-weight: 600;">
              <span>OFFICIAL EASYDOC REPORT</span>
              <span>•</span>
              <span style="color: #7C3AED;">VERIFIED & FORMATTED</span>
            </div>
          </div>
        `;
      } else {
        html += `<h1 style="color: #1E1B4B; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; border-bottom: 2px solid ${borderColor}; padding-bottom: 6px; margin-top: 20px; margin-bottom: 12px; page-break-after: avoid; break-after: avoid-page;">${formatInlineText(block.content)}</h1>`;
      }
    } else if (block.type === 'heading2') {
      html += `<h2 style="color: ${borderColor}; font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; margin-top: 18px; margin-bottom: 8px; page-break-after: avoid; break-after: avoid-page;">${formatInlineText(block.content)}</h2>`;
    } else if (block.type === 'heading3') {
      html += `<h3 style="color: #1E1B4B; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; margin-top: 14px; margin-bottom: 6px; page-break-after: avoid; break-after: avoid-page;">${formatInlineText(block.content)}</h3>`;
    } else if (block.type === 'list-item') {
      html += `<li style="margin-left: 20px; margin-bottom: 6px; color: #334155; line-height: 1.6; font-size: 13.5px;">${formatInlineText(block.content)}</li>`;
    } else if (block.type === 'blockquote') {
      html += `<blockquote style="background: #F8FAFC; border-left: 4px solid ${borderColor}; padding: 12px 16px; margin: 14px 0; color: #0F172A; font-size: 13.5px; border-radius: 0 6px 6px 0; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">${formatInlineText(block.content)}</blockquote>`;
    } else if (block.type === 'table') {
      html += renderMarkdownTableToHtml(block.content, borderColor);
    } else if (block.type === 'paragraph') {
      if (!block.content) {
        html += `<div style="height: 10px;"></div>`;
      } else {
        html += `<p style="margin-bottom: 10px; color: #1E293B; line-height: 1.65; font-size: 13.5px;">${formatInlineText(block.content)}</p>`;
      }
    }
  }

  return html;
}

function renderMarkdownTableToHtml(tableMarkdown: string, borderColor = '#7C3AED'): string {
  const rows = tableMarkdown.split('\n').filter((r) => r.trim());
  if (rows.length === 0) return '';

  let html = `<table style="width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12px; page-break-inside: auto; break-inside: auto; border: 1px solid #E2E8F0; border-radius: 6px; overflow: hidden;">`;

  rows.forEach((row, rowIndex) => {
    if (row.includes('---')) return; // Skip separator line
    const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (rowIndex === 0) {
      html += `<thead style="display: table-header-group; page-break-inside: avoid; break-inside: avoid;"><tr style="background: #F1F5F9; border-bottom: 2px solid ${borderColor};">`;
      cells.forEach((cell) => {
        html += `<th style="padding: 9px 12px; text-align: left; font-weight: 700; color: #1E1B4B; border: 1px solid #CBD5E1;">${formatInlineText(cell.trim())}</th>`;
      });
      html += `</tr></thead><tbody>`;
    } else {
      const bg = rowIndex % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      html += `<tr style="background: ${bg}; page-break-inside: avoid; break-inside: avoid;">`;
      cells.forEach((cell) => {
        html += `<td style="padding: 8px 12px; border: 1px solid #E2E8F0; color: #334155;">${formatInlineText(cell.trim())}</td>`;
      });
      html += `</tr>`;
    }
  });

  html += `</tbody></table>`;
  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateTableOfContents(markdown: string): string {
  const lines = markdown.split('\n');
  const headings: { title: string; level: number; page: number }[] = [];

  let estimatedPage = 1;
  let currentWeight = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('[PAGE BREAK]') || line === '---') {
      estimatedPage++;
      currentWeight = 0;
      continue;
    }

    currentWeight += 18;
    if (currentWeight >= 870) {
      estimatedPage++;
      currentWeight = 0;
    }

    if (line.startsWith('# ') && !line.includes('Table of Contents')) {
      headings.push({
        title: line.replace('# ', '').replace(/[*#]/g, '').trim(),
        level: 1,
        page: estimatedPage,
      });
    } else if (line.startsWith('## ') && !line.includes('Table of Contents')) {
      headings.push({
        title: line.replace('## ', '').replace(/[*#]/g, '').trim(),
        level: 2,
        page: estimatedPage,
      });
    } else if (line.startsWith('### ') && !line.includes('Table of Contents')) {
      headings.push({
        title: line.replace('### ', '').replace(/[*#]/g, '').trim(),
        level: 3,
        page: estimatedPage,
      });
    }
  }

  if (headings.length === 0) {
    return '## Table of Contents\n\n*No headings detected. Add # or ## headings to populate.*';
  }

  let toc = `## Table of Contents\n\n| Section / Chapter | Level | Est. Page |\n| :--- | :--- | :---: |\n`;
  headings.forEach((h) => {
    const indent = h.level === 1 ? '**' : h.level === 2 ? '&nbsp;&nbsp;• ' : '&nbsp;&nbsp;&nbsp;&nbsp;— ';
    const close = h.level === 1 ? '**' : '';
    toc += `| ${indent}${h.title}${close} | H${h.level} | ${h.page} |\n`;
  });

  return toc;
}

export function insertOrUpdateTableOfContents(content: string): string {
  const tocMarkdown = generateTableOfContents(content);

  // If already has a Table of Contents section, replace it
  const tocRegex = /## Table of Contents[\s\S]*?(?=\n## |\n# |\[PAGE BREAK\]|$)/i;
  if (tocRegex.test(content)) {
    return content.replace(tocRegex, tocMarkdown.trim());
  }

  // Otherwise insert after Page 1 / Title page
  if (content.includes('[PAGE BREAK]')) {
    return content.replace('[PAGE BREAK]', `[PAGE BREAK]\n\n${tocMarkdown}\n\n[PAGE BREAK]`);
  }

  // Prepend after title
  return content.replace(/(#\s+[^\n]+)/, `$1\n\n${tocMarkdown}\n\n[PAGE BREAK]`);
}

