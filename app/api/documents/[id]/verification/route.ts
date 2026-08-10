import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { computeDocumentChecksum, generateVerificationId } from '@/lib/verification';
import { generateQrDataUrl } from '@/lib/export/qr';

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
      include: { verification: true },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const checksum = computeDocumentChecksum(doc.content, doc.title);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    let verificationRecord = doc.verification;

    if (!verificationRecord) {
      const vId = generateVerificationId();
      verificationRecord = await prisma.documentVerification.create({
        data: {
          verificationId: vId,
          documentId: doc.id,
          userId: profile.id,
          documentTitle: doc.title,
          documentType: 'Official Document',
          checksum,
        },
      });
    } else {
      // Update checksum if modified
      verificationRecord = await prisma.documentVerification.update({
        where: { id: verificationRecord.id },
        data: { checksum, documentTitle: doc.title },
      });
    }

    const verificationUrl = `${siteUrl}/verify/${verificationRecord.verificationId}`;
    const qrDataUrl = await generateQrDataUrl(verificationUrl);

    return NextResponse.json({
      success: true,
      verification: verificationRecord,
      verificationUrl,
      qrDataUrl,
    });
  } catch (error: any) {
    console.error('Verification creation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to issue verification' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { isRevoked } = body;

    const doc = await prisma.document.findFirst({
      where: { id, userId: profile.id },
      include: { verification: true },
    });

    if (!doc || !doc.verification) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 });
    }

    const updated = await prisma.documentVerification.update({
      where: { id: doc.verification.id },
      data: {
        isRevoked: Boolean(isRevoked),
        revokedAt: isRevoked ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, verification: updated });
  } catch (error: any) {
    console.error('PATCH verification error:', error);
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
  }
}
