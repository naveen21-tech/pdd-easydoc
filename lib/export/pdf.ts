// Multi-Page A4 PDF & HTML Document Exporter with Word-like Page Margins & Pagination

import { paginateDocument, PaginatedPage } from './pagination';

export interface PdfExportOptions {
  borderColor?: string;
  borderStyle?: 'solid' | 'double' | 'formal' | 'none';
  borderWidth?: number;
  author?: string;
  institution?: string;
  department?: string;
}

export function generateStyledHtmlDocument(
  title: string,
  markdownContent: string,
  options?: PdfExportOptions
): string {
  const borderColor = options?.borderColor || '#7C3AED'; // Default Royal Purple
  const borderStyle = options?.borderStyle || 'solid';
  const borderWidth = options?.borderWidth || 2;
  const author = options?.author || '';
  const institution = options?.institution || '';

  // 1. Paginate content into discrete A4 pages
  const { pages, totalPages } = paginateDocument(markdownContent);

  // Border CSS calculation
  let pageBorderCss = '';
  if (borderStyle !== 'none') {
    if (borderStyle === 'double') {
      pageBorderCss = `border: 6px double ${borderColor};`;
    } else if (borderStyle === 'formal') {
      pageBorderCss = `border: ${borderWidth}px solid ${borderColor}; outline: 3px double ${borderColor}; outline-offset: 4px;`;
    } else {
      pageBorderCss = `border: ${borderWidth}px solid ${borderColor};`;
    }
  }

  // 2. Render each A4 page sheet
  const pagesHtml = pages
    .map((page: PaginatedPage) => {
      return `
      <div class="a4-page">
        <!-- Running Header -->
        <header class="page-header">
          <div class="header-brand">
            <span class="brand-badge">E</span>
            <span class="brand-title">EasyDoc</span>
          </div>
          <div class="header-meta">
            <span class="doc-title">${escapeHtml(title)}</span>
            ${institution ? `<span class="doc-inst">• ${escapeHtml(institution)}</span>` : ''}
          </div>
        </header>

        <!-- Page Content Area -->
        <main class="page-content">
          ${page.htmlContent}
        </main>

        <!-- Running Footer with Page Numbers -->
        <footer class="page-footer">
          <div class="footer-left">
            <span>Confidential & Proprietary</span>
            ${author ? `<span>• Author: ${escapeHtml(author)}</span>` : ''}
          </div>
          <div class="footer-right">
            <span class="page-counter">Page ${page.pageNumber} of ${totalPages}</span>
          </div>
        </footer>
      </div>
    `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} - EasyDoc Multi-Page Document</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0F172A;
      color: #0F172A;
      padding: 30px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }

    /* A4 Multi-Page Layout (210mm x 297mm) */
    .a4-page {
      background: #FFFFFF;
      width: 210mm;
      min-height: 297mm;
      height: 297mm;
      padding: 20mm 20mm 20mm 20mm;
      margin-bottom: 24px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      border-radius: 2px;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      ${pageBorderCss}
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid ${borderColor};
      padding-bottom: 8px;
      margin-bottom: 16px;
      font-size: 11px;
      color: #64748B;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand-badge {
      background: linear-gradient(135deg, #7C3AED, #4F46E5);
      color: #FFFFFF;
      font-weight: 800;
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .brand-title {
      font-family: 'Sora', sans-serif;
      font-weight: 700;
      color: ${borderColor};
      font-size: 13px;
      letter-spacing: -0.3px;
    }

    .header-meta {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 65%;
      text-align: right;
    }

    .page-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      line-height: 1.6;
    }

    .page-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      margin-top: 16px;
      font-size: 10.5px;
      color: #64748B;
      font-weight: 500;
    }

    .page-counter {
      background: #F1F5F9;
      color: #1E293B;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 10px;
      border: 1px solid #CBD5E1;
    }

    /* Print Specific Rules for Pixel-Perfect Multi-Page PDF Generation */
    @page {
      size: A4 portrait;
      margin: 0;
    }

    @media print {
      body {
        background: transparent !important;
        padding: 0 !important;
      }
      .a4-page {
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        height: 297mm !important;
        max-height: 297mm !important;
        width: 210mm !important;
      }
    }
  </style>
</head>
<body>
  ${pagesHtml}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
