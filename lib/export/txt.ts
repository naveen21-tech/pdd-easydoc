// Plain Text and Markdown exporter utilities

export function generatePlainText(title: string, markdownContent: string): string {
  const dateStr = new Date().toLocaleDateString();
  const header = `================================================================================
${title.toUpperCase()}
EasyDoc Export | Date: ${dateStr}
================================================================================

`;

  // Strip Markdown syntax for clean plain text export
  const cleanContent = markdownContent
    .replace(/^#+\s+/gm, '') // Remove heading hashes
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // Remove bold/italics
    .replace(/^>\s+/gm, '   ') // Blockquotes to indented text
    .replace(/`{1,3}[^`]*`{1,3}/g, '') // Inline code / backticks
    .trim();

  return header + cleanContent;
}

export function generateMarkdownText(title: string, markdownContent: string): string {
  const dateStr = new Date().toLocaleDateString();
  const header = `<!--
Document: ${title}
Exported via EasyDoc on ${dateStr}
-->

`;
  return header + markdownContent;
}
