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
} from 'docx';

export async function generateDocxBuffer(title: string, markdownContent: string): Promise<Buffer> {
  const lines = markdownContent.split('\n');
  const children: (Paragraph | Table)[] = [];

  // Title Header
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 300 },
    })
  );

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace('# ', ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace('## ', ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: trimmed.replace('### ', ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '• ' + trimmed.substring(2),
            }),
          ],
          indent: { left: 360 },
          spacing: { after: 60 },
        })
      );
    } else if (trimmed.startsWith('> ')) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: trimmed.replace('> ', ''),
              italics: true,
              color: '1D4ED8',
            }),
          ],
          indent: { left: 400 },
          spacing: { before: 100, after: 100 },
        })
      );
    } else {
      // Parse bold/italic simple formatting
      const cleanText = trimmed.replace(/[*_]/g, '');
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cleanText,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }
  });

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
