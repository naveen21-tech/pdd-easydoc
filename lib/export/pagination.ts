// Intelligent Content-Aware Pagination Engine for A4 Documents (210mm x 297mm)

export interface DocumentBlock {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list-item' | 'blockquote' | 'table' | 'code' | 'page-break' | 'hr';
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
        weight: tableRows.length * 36 + 20,
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
        weight: 14,
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

    // Headings
    if (trimmed.startsWith('# ')) {
      blocks.push({
        type: 'heading1',
        content: trimmed.replace(/^#\s+/, ''),
        raw: line,
        weight: 56, // Larger height + margin
      });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({
        type: 'heading2',
        content: trimmed.replace(/^##\s+/, ''),
        raw: line,
        weight: 44,
      });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({
        type: 'heading3',
        content: trimmed.replace(/^###\s+/, ''),
        raw: line,
        weight: 36,
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      // List items
      blocks.push({
        type: 'list-item',
        content: trimmed.replace(/^([-*]|\d+\.)\s+/, ''),
        raw: line,
        weight: 24,
      });
    } else if (trimmed.startsWith('> ')) {
      // Blockquotes
      const quoteText = trimmed.replace(/^>\s+/, '');
      const approxLines = Math.max(1, Math.ceil(quoteText.length / 75));
      blocks.push({
        type: 'blockquote',
        content: quoteText,
        raw: line,
        weight: approxLines * 22 + 24,
      });
    } else {
      // Standard Paragraph
      const approxLines = Math.max(1, Math.ceil(trimmed.length / 80));
      blocks.push({
        type: 'paragraph',
        content: trimmed,
        raw: line,
        weight: approxLines * 22 + 10,
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
      const htmlContent = renderBlocksToHtml(currentPageBlocks);
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

export function renderBlocksToHtml(blocks: DocumentBlock[], borderColor = '#7C3AED'): string {
  let html = '';

  for (const block of blocks) {
    if (block.type === 'heading1') {
      html += `<h1 style="color: #1E1B4B; font-family: 'Sora', sans-serif; font-size: 22px; font-weight: 700; border-bottom: 2px solid ${borderColor}; padding-bottom: 6px; margin-top: 18px; margin-bottom: 12px; page-break-after: avoid; break-after: avoid-page;">${escapeHtml(block.content)}</h1>`;
    } else if (block.type === 'heading2') {
      html += `<h2 style="color: ${borderColor}; font-family: 'Sora', sans-serif; font-size: 17px; font-weight: 700; margin-top: 16px; margin-bottom: 8px; page-break-after: avoid; break-after: avoid-page;">${escapeHtml(block.content)}</h2>`;
    } else if (block.type === 'heading3') {
      html += `<h3 style="color: #1E1B4B; font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600; margin-top: 14px; margin-bottom: 6px; page-break-after: avoid; break-after: avoid-page;">${escapeHtml(block.content)}</h3>`;
    } else if (block.type === 'list-item') {
      html += `<li style="margin-left: 20px; margin-bottom: 5px; color: #334155; line-height: 1.5; font-size: 13px;">${escapeHtml(block.content)}</li>`;
    } else if (block.type === 'blockquote') {
      html += `<blockquote style="background: #F8FAFC; border-left: 4px solid ${borderColor}; padding: 10px 14px; margin: 10px 0; color: #0F172A; font-style: italic; font-size: 13px; border-radius: 0 4px 4px 0;">${escapeHtml(block.content)}</blockquote>`;
    } else if (block.type === 'table') {
      html += renderMarkdownTableToHtml(block.content, borderColor);
    } else if (block.type === 'paragraph') {
      if (!block.content) {
        html += `<div style="height: 10px;"></div>`;
      } else {
        html += `<p style="margin-bottom: 8px; color: #1E293B; line-height: 1.6; font-size: 13.5px; text-align: justify;">${escapeHtml(block.content)}</p>`;
      }
    }
  }

  return html;
}

function renderMarkdownTableToHtml(tableMarkdown: string, borderColor = '#7C3AED'): string {
  const rows = tableMarkdown.split('\n').filter((r) => r.trim());
  if (rows.length === 0) return '';

  let html = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; page-break-inside: auto; break-inside: auto;">`;

  rows.forEach((row, rowIndex) => {
    if (row.includes('---')) return; // Skip separator line
    const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

    if (rowIndex === 0) {
      html += `<thead style="display: table-header-group; page-break-inside: avoid; break-inside: avoid;"><tr style="background: #F1F5F9; border-bottom: 2px solid ${borderColor};">`;
      cells.forEach((cell) => {
        html += `<th style="padding: 8px 10px; text-align: left; font-weight: 700; color: #1E1B4B; border: 1px solid #CBD5E1;">${escapeHtml(cell.trim())}</th>`;
      });
      html += `</tr></thead><tbody>`;
    } else {
      const bg = rowIndex % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
      html += `<tr style="background: ${bg}; page-break-inside: avoid; break-inside: avoid;">`;
      cells.forEach((cell) => {
        html += `<td style="padding: 7px 10px; border: 1px solid #E2E8F0; color: #334155;">${escapeHtml(cell.trim())}</td>`;
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
