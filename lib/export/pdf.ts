// PDF exporter for serverless environment with custom page borders and cover page support

export interface PdfExportOptions {
  borderColor?: string;
  borderStyle?: 'solid' | 'double' | 'formal' | 'none';
  borderWidth?: number;
}

export function generateStyledHtmlDocument(
  title: string,
  markdownContent: string,
  options?: PdfExportOptions
): string {
  const borderColor = options?.borderColor || '#7C3AED'; // Default Royal Purple
  const borderStyle = options?.borderStyle || 'solid';
  const borderWidth = options?.borderWidth || 2;

  // Convert Markdown to clean styled HTML for PDF printing / rendering
  const lines = markdownContent.split('\n');
  let htmlBody = '';

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      htmlBody += `<br/>`;
      return;
    }

    if (trimmed === '---' || trimmed === '***' || trimmed.toLowerCase().includes('page-break')) {
      htmlBody += `<div style="page-break-after: always; break-after: page; height: 1px; margin: 30px 0;"></div>`;
      return;
    }

    if (trimmed.startsWith('# ')) {
      htmlBody += `<h1 style="color: #1E1B4B; font-family: 'Sora', sans-serif; font-size: 24px; border-bottom: 2px solid ${borderColor}; padding-bottom: 8px; margin-top: 24px; margin-bottom: 12px;">${escapeHtml(trimmed.replace('# ', ''))}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      htmlBody += `<h2 style="color: ${borderColor}; font-family: 'Sora', sans-serif; font-size: 18px; margin-top: 20px; margin-bottom: 8px;">${escapeHtml(trimmed.replace('## ', ''))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      htmlBody += `<h3 style="color: #1E1B4B; font-family: 'Sora', sans-serif; font-size: 15px; margin-top: 16px; margin-bottom: 6px;">${escapeHtml(trimmed.replace('### ', ''))}</h3>`;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      htmlBody += `<li style="margin-bottom: 6px; color: #334155;">${escapeHtml(trimmed.substring(2))}</li>`;
    } else if (trimmed.startsWith('> ')) {
      htmlBody += `<blockquote style="background: #F8FAFC; border-left: 4px solid ${borderColor}; padding: 12px 16px; margin: 12px 0; color: #0F172A; font-style: italic;">${escapeHtml(trimmed.replace('> ', ''))}</blockquote>`;
    } else if (trimmed.startsWith('|')) {
      htmlBody += `<p style="font-family: monospace; background: #F8FAFC; padding: 6px; border: 1px solid #E2E8F0; margin: 4px 0;">${escapeHtml(trimmed)}</p>`;
    } else {
      htmlBody += `<p style="margin-bottom: 10px; color: #1E293B; line-height: 1.6;">${escapeHtml(trimmed)}</p>`;
    }
  });

  // Border CSS calculation
  let pageBorderCss = '';
  if (borderStyle !== 'none') {
    if (borderStyle === 'double') {
      pageBorderCss = `border: 6px double ${borderColor}; padding: 30px; border-radius: 4px;`;
    } else if (borderStyle === 'formal') {
      pageBorderCss = `border: ${borderWidth}px solid ${borderColor}; outline: 4px double ${borderColor}; outline-offset: 4px; padding: 35px;`;
    } else {
      pageBorderCss = `border: ${borderWidth}px solid ${borderColor}; padding: 30px; border-radius: 6px;`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      margin: 30px;
      padding: 10px;
      color: #0F172A;
      background: #FFFFFF;
    }
    .page-container {
      ${pageBorderCss}
      min-h-screen;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      border-bottom: 1.5px solid ${borderColor};
      padding-bottom: 12px;
    }
    .brand {
      color: ${borderColor};
      font-family: 'Sora', sans-serif;
      font-weight: 800;
      font-size: 20px;
      letter-spacing: -0.5px;
    }
    .meta {
      font-size: 11px;
      color: #64748B;
      font-weight: 500;
    }
    @media print {
      body { margin: 0; padding: 10px; }
      @page { size: A4; margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="header">
      <div class="brand">EasyDoc</div>
      <div class="meta">Document ID: ${escapeHtml(title)} • Exported: ${new Date().toLocaleDateString()}</div>
    </div>
    ${htmlBody}
  </div>
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
