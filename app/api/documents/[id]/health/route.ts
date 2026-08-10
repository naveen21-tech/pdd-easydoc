import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { analyzeDocumentHealth } from '@/lib/ai/health-analyzer';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const doc = await prisma.document.findFirst({
      where: { id, userId: profile.id },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const report = await analyzeDocumentHealth({
      title: doc.title,
      content: doc.content,
    });

    // Upsert health report in database
    try {
      await prisma.documentHealthReport.upsert({
        where: { documentId: id },
        create: {
          documentId: id,
          overallScore: report.overallScore,
          structureScore: report.structureScore,
          readabilityScore: report.readabilityScore,
          grammarScore: report.grammarScore,
          professionalismScore: report.professionalismScore,
          completenessScore: report.completenessScore,
          formattingScore: report.formattingScore,
          issues: report.issues as any,
        },
        update: {
          overallScore: report.overallScore,
          structureScore: report.structureScore,
          readabilityScore: report.readabilityScore,
          grammarScore: report.grammarScore,
          professionalismScore: report.professionalismScore,
          completenessScore: report.completenessScore,
          formattingScore: report.formattingScore,
          issues: report.issues as any,
        },

      });
    } catch (dbErr) {
      console.warn('Prisma document health upsert note:', dbErr);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('POST /api/documents/[id]/health error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to score document' },
      { status: 500 }
    );
  }
}
