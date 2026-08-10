import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const verificationId = decodeURIComponent(id).trim().toUpperCase();

    const record = await prisma.documentVerification.findUnique({
      where: { verificationId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
    });

    if (!record) {
      return NextResponse.json(
        { found: false, message: 'Document Verification ID not found in registry.' },
        { status: 404 }
      );
    }

    // Increment scan count
    try {
      await prisma.documentVerification.update({
        where: { id: record.id },
        data: { scanCount: { increment: 1 } },
      });
    } catch (e) {
      console.warn('Scan count increment error:', e);
    }

    return NextResponse.json({
      found: true,
      verificationId: record.verificationId,
      documentTitle: record.documentTitle,
      documentType: record.documentType,
      issuedAt: record.issuedAt,
      isRevoked: record.isRevoked,
      revokedAt: record.revokedAt,
      checksum: record.checksum.substring(0, 16) + '...', // Safe truncated checksum
      status: record.isRevoked ? 'REVOKED' : 'VALID',
    });
  } catch (error: any) {
    console.error('Public verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify document credential' },
      { status: 500 }
    );
  }
}
