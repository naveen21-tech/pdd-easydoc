// PDF exporter for serverless environment

export function generateStyledHtmlDocument(title: string, markdownContent: string): string {
  // Convert Markdown to clean styled HTML for PDF printing / rendering
  const lines = markdownContent.split('\n');
  let htmlBody = '';

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      htmlBody += `<br/>`;
      return;
    }

    if (trimmed.startsWith('# ')) {
      htmlBody += `<h1 style="color: #0B1B33; font-family: 'Sora', sans-serif; font-size: 24px; border-bottom: 2px solid #1D4ED8; padding-bottom: 8px; margin-top: 24px; margin-bottom: 12px;">${escapeHtml(trimmed.replace('# ', ''))}</h1>`;
    } else if (trimmed.startsWith('## ')) {
      htmlBody += `<h2 style="color: #1D4ED8; font-family: 'Sora', sans-serif; font-size: 18px; margin-top: 20px; margin-bottom: 8px;">${escapeHtml(trimmed.replace('## ', ''))}</h2>`;
    } else if (trimmed.startsWith('### ')) {
      htmlBody += `<h3 style="color: #0B1B33; font-family: 'Sora', sans-serif; font-size: 15px; margin-top: 16px; margin-bottom: 6px;">${escapeHtml(trimmed.replace('### ', ''))}</h3>`;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      htmlBody += `<li style="margin-bottom: 6px; color: #334155;">${escapeHtml(trimmed.substring(2))}</li>`;
    } else if (trimmed.startsWith('> ')) {
      htmlBody += `<blockquote style="background: #F5F8FC; border-left: 4px solid #1D4ED8; padding: 12px 16px; margin: 12px 0; color: #0B1B33; font-style: italic;">${escapeHtml(trimmed.replace('> ', ''))}</blockquote>`;
    } else if (trimmed.startsWith('|')) {
      // Table formatting preview
      htmlBody += `<p style="font-family: monospace; background: #F8FAFC; padding: 6px; border: 1px solid #E2E8F0; margin: 4px 0;">${escapeHtml(trimmed)}</p>`;
    } else {
      htmlBody += `<p style="margin-bottom: 10px; color: #1E293B; line-height: 1.6;">${escapeHtml(trimmed)}</p>`;
    }
  });

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@600;700&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      margin: 40px;
      padding: 20px;
      color: #0B1B33;
      background: #FFFFFF;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      border-bottom: 1px solid #DCE6F5;
      padding-bottom: 15px;
    }
    .brand {
      color: #1D4ED8;
      font-family: 'Sora', sans-serif;
      font-weight: 700;
      font-size: 20px;
    }
    .meta {
      font-size: 12px;
      color: #64748B;
    }
    @media print {
      body { margin: 0; padding: 20px; }
      @page { size: A4; margin: 20mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">EasyDoc</div>
    <div class="meta">Exported: ${new Date().toLocaleDateString()}</div>
  </div>
  ${htmlBody}
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
