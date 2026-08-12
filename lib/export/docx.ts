import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  ShadingType,
} from 'docx';

export interface DocxExportOptions {
  author?: string;
  institution?: string;
  templateName?: string;
}

// Parses inline bold (**text**), italic (*text*), underline (<u>text</u>), and inline code (`code`) into native Word TextRuns
function parseFormattedTextRuns(rawText: string, baseOptions: Partial<any> = {}): TextRun[] {
  const runs: TextRun[] = [];

  // Match markdown tokens: **bold**, *italic*, `code`, <u>underline</u>, or plain text
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|<u>[^<]+<\/u>|[^*`<_]+|.)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    const token = match[0];
    if (!token) continue;

    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      runs.push(
        new TextRun({
          text: token.slice(2, -2),
          bold: true,
          color: baseOptions.color || '0F172A',
          size: baseOptions.size || 22,
          font: baseOptions.font,
        })
      );
    } else if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          italics: true,
          color: baseOptions.color || '1E293B',
          size: baseOptions.size || 22,
          font: baseOptions.font,
        })
      );
    } else if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      runs.push(
        new TextRun({
          text: token.slice(1, -1),
          font: 'Courier New',
          color: '7C3AED',
          size: 20,
          shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
        })
      );
    } else if (token.startsWith('<u>') && token.endsWith('</u>') && token.length >= 7) {
      runs.push(
        new TextRun({
          text: token.slice(3, -4),
          underline: {},
          color: baseOptions.color || '0F172A',
          size: baseOptions.size || 22,
        })
      );
    } else {
      runs.push(
        new TextRun({
          text: token,
          bold: baseOptions.bold,
          italics: baseOptions.italics,
          color: baseOptions.color || '1E293B',
          size: baseOptions.size || 22,
          font: baseOptions.font,
        })
      );
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text: rawText, ...baseOptions })];
}

export async function generateDocxBuffer(
  title: string,
  markdownContent: string,
  options?: DocxExportOptions
): Promise<Buffer> {
  const lines = markdownContent.split('\n');
  const children: (Paragraph | Table)[] = [];
  const templateName = options?.templateName || 'Official Document';

  // 1. Front Title Page Header Decoration (Template Badge)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `TEMPLATE: ${templateName.toUpperCase()}`,
          bold: true,
          color: '7C3AED',
          size: 19, // 9.5pt
          shading: { fill: 'F5F3FF', type: ShadingType.CLEAR },
        }),
      ],
      spacing: { before: 100, after: 120 },
    })
  );

  // 2. Bold & Bigger Title on Front Title Page
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          color: '0F172A',
          size: 56, // 28pt bold title
        }),
      ],
      spacing: { before: 120, after: 200 },
      border: {
        bottom: {
          color: '7C3AED',
          size: 24,
          style: BorderStyle.SINGLE,
          space: 8,
        },
      },
    })
  );

  let inTable = false;
  let tableRowsRaw: string[] = [];

  const flushTable = () => {
    if (tableRowsRaw.length > 0) {
      const rows: TableRow[] = [];

      tableRowsRaw.forEach((r, idx) => {
        if (r.includes('---')) return;
        const cellTexts = r.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
        const isHeader = idx === 0;

        const cells = cellTexts.map((txt) => {
          return new TableCell({
            children: [
              new Paragraph({
                children: parseFormattedTextRuns(txt.trim(), {
                  bold: isHeader,
                  color: isHeader ? '1E1B4B' : '334155',
                  size: 20, // 10pt
                }),
              }),
            ],
            shading: isHeader
              ? { fill: 'F1F5F9', type: ShadingType.CLEAR }
              : idx % 2 === 0
              ? { fill: 'F8FAFC', type: ShadingType.CLEAR }
              : undefined,
            margins: { top: 120, bottom: 120, left: 150, right: 150 },
          });
        });

        rows.push(
          new TableRow({
            children: cells,
            tableHeader: isHeader,
            cantSplit: true,
          })
        );
      });

      if (rows.length > 0) {
        children.push(
          new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          })
        );
        children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      }

      tableRowsRaw = [];
      inTable = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Skip duplicate title if it matches main title
    if (trimmed === `# ${title}` || trimmed === `# **${title}**`) {
      return;
    }

    // Skip template badge line as we added it at top
    if (trimmed.startsWith('[TEMPLATE_BADGE]')) {
      return;
    }

    // Check Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      tableRowsRaw.push(trimmed);
      return;
    } else if (inTable) {
      flushTable();
    }

    if (!trimmed) {
      children.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      return;
    }

    // Manual Page Break
    if (
      trimmed === '---' ||
      trimmed === '***' ||
      trimmed === '___' ||
      trimmed.toLowerCase() === '[page break]' ||
      trimmed.toLowerCase() === '[page-break]' ||
      trimmed.toLowerCase().includes('page-break-after')
    ) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );
      return;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      children.push(
        new Paragraph({
          children: parseFormattedTextRuns(trimmed.replace(/^#\s+/, ''), {
            bold: true,
            size: 40, // 20pt
            color: '1E1B4B',
          }),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 140 },
          keepNext: true,
        })
      );
    } else if (trimmed.startsWith('## ')) {
      // Heading 2
      children.push(
        new Paragraph({
          children: parseFormattedTextRuns(trimmed.replace(/^##\s+/, ''), {
            bold: true,
            size: 32, // 16pt
            color: '7C3AED',
          }),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 220, after: 110 },
          keepNext: true,
        })
      );
    } else if (trimmed.startsWith('### ')) {
      // Heading 3
      children.push(
        new Paragraph({
          children: parseFormattedTextRuns(trimmed.replace(/^###\s+/, ''), {
            bold: true,
            size: 26, // 13pt
            color: '1E1B4B',
          }),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 180, after: 90 },
          keepNext: true,
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // Bullet list item
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '•  ', bold: true, color: '7C3AED', size: 22 }),
            ...parseFormattedTextRuns(trimmed.substring(2), { size: 22 }),
          ],
          indent: { left: 400 },
          spacing: { after: 70 },
        })
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      // Numbered list item
      const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
      const numStr = numMatch ? numMatch[1] : '1.';
      const rest = numMatch ? numMatch[2] : trimmed;
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${numStr}  `, bold: true, color: '7C3AED', size: 22 }),
            ...parseFormattedTextRuns(rest, { size: 22 }),
          ],
          indent: { left: 400 },
          spacing: { after: 70 },
        })
      );
    } else if (trimmed.startsWith('> ')) {
      // Blockquote
      children.push(
        new Paragraph({
          children: parseFormattedTextRuns(trimmed.replace(/^>\s+/, ''), {
            italics: true,
            color: '1E1B4B',
            size: 22,
          }),
          indent: { left: 500, right: 300 },
          spacing: { before: 120, after: 120 },
          border: {
            left: {
              color: '7C3AED',
              space: 12,
              style: BorderStyle.SINGLE,
              size: 24,
            },
          },
        })
      );
    } else {
      // Standard text paragraph with inline bold / italic parsing
      children.push(
        new Paragraph({
          children: parseFormattedTextRuns(trimmed, {
            size: 22, // 11pt
            color: '1E293B',
          }),
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: 276 }, // 1.15 line spacing
        })
      );
    }
  });

  if (inTable) {
    flushTable();
  }

  // Define multi-page Word document with exact A4 page dimensions and native headers/footers
  const doc = new DocxDocument({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // 210mm (A4 width in twips/dxa)
              height: 16838, // 297mm (A4 height in twips/dxa)
            },
            margin: {
              top: 1134, // 20mm (1134 dxa)
              bottom: 1134, // 20mm
              left: 1134, // 20mm
              right: 1134, // 20mm
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `StudentDoc • ${title}`,
                    size: 18, // 9pt
                    color: '7C3AED',
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Page ',
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: '1E293B',
                    bold: true,
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 18,
                    color: '64748B',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: '1E293B',
                    bold: true,
                  }),
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 },
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
