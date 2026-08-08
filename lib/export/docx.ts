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
}

export async function generateDocxBuffer(
  title: string,
  markdownContent: string,
  options?: DocxExportOptions
): Promise<Buffer> {
  const lines = markdownContent.split('\n');
  const children: (Paragraph | Table)[] = [];

  // Document Main Title
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 300 },
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
                children: [
                  new TextRun({
                    text: txt.trim(),
                    bold: isHeader,
                    color: isHeader ? '1E1B4B' : '334155',
                    size: 20, // 10pt
                  }),
                ],
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
          text: trimmed.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 280, after: 140 },
          keepNext: true,
        })
      );
    } else if (trimmed.startsWith('## ')) {
      // Heading 2
      children.push(
        new Paragraph({
          text: trimmed.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 220, after: 110 },
          keepNext: true,
        })
      );
    } else if (trimmed.startsWith('### ')) {
      // Heading 3
      children.push(
        new Paragraph({
          text: trimmed.replace(/^###\s+/, ''),
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
            new TextRun({
              text: '• ' + trimmed.substring(2),
              size: 22, // 11pt
            }),
          ],
          indent: { left: 400 },
          spacing: { after: 70 },
        })
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      // Numbered list item
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed,
              size: 22,
            }),
          ],
          indent: { left: 400 },
          spacing: { after: 70 },
        })
      );
    } else if (trimmed.startsWith('> ')) {
      // Blockquote
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace(/^>\s+/, ''),
              italics: true,
              color: '1E1B4B',
              size: 22,
            }),
          ],
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
      // Standard text paragraph
      const cleanText = trimmed.replace(/[*_]/g, '');
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanText,
              size: 22, // 11pt
              color: '1E293B',
            }),
          ],
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
                    text: `EasyDoc • ${title}`,
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
