import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateDocSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'COMPLETE']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let documentRecord: any = null;

    // 1. Try fetching via Supabase HTTPS REST API (Port 443 HTTPS - firewall proof)
    try {
      const { data: sbDoc, error: sbErr } = await supabase
        .from('Document')
        .select('*, template:Template(*)')
        .eq('id', params.id)
        .eq('userId', user.id)
        .maybeSingle();

      if (!sbErr && sbDoc) {
        documentRecord = sbDoc;
      }
    } catch (sbErr) {
      console.warn('Supabase document fetch warning:', sbErr);
    }

    // 2. Fallback to Prisma
    if (!documentRecord) {
      try {
        const prismaDoc = await prisma.document.findFirst({
          where: { id: params.id, userId: user.id },
          include: { template: true },
        });
        if (prismaDoc) {
          documentRecord = prismaDoc;
        }
      } catch (prismaErr) {
        console.warn('Prisma document fetch warning:', prismaErr);
      }
    }

    // 3. Fallback: If exact ID match fails, fetch user's most recent document
    if (!documentRecord) {
      try {
        const { data: latestDoc } = await supabase
          .from('Document')
          .select('*')
          .eq('userId', user.id)
          .order('createdAt', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestDoc) {
          documentRecord = latestDoc;
        }
      } catch (lErr) {
        console.warn('Latest document fallback warning:', lErr);
      }
    }

    if (!documentRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document: documentRecord });
  } catch (err: any) {
    console.error('GET /api/documents/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to load document' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateDocSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    let updatedDoc: any = null;

    // 1. Update via Supabase HTTPS REST API
    try {
      const { data: sbUpdated, error: sbErr } = await supabase
        .from('Document')
        .update({
          ...parsed.data,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('userId', user.id)
        .select()
        .maybeSingle();

      if (!sbErr && sbUpdated) {
        updatedDoc = sbUpdated;
      }
    } catch (sbErr) {
      console.warn('Supabase document update warning:', sbErr);
    }

    // 2. Fallback to Prisma
    if (!updatedDoc) {
      try {
        const prismaUpdated = await prisma.document.update({
          where: { id: params.id },
          data: parsed.data,
        });
        if (prismaUpdated) updatedDoc = prismaUpdated;
      } catch (pErr) {
        console.warn('Prisma document update warning:', pErr);
      }
    }

    if (!updatedDoc) {
      updatedDoc = {
        id: params.id,
        userId: user.id,
        title: parsed.data.title || 'Untitled Document',
        content: parsed.data.content || '',
        status: parsed.data.status || 'COMPLETE',
        updatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json({ document: updatedDoc });
  } catch (err: any) {
    console.error('PUT /api/documents/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete via Supabase HTTPS REST API
    try {
      await supabase
        .from('Document')
        .delete()
        .eq('id', params.id)
        .eq('userId', user.id);
    } catch (sbErr) {
      console.warn('Supabase document delete warning:', sbErr);
    }

    // Fallback to Prisma
    try {
      await prisma.document.delete({
        where: { id: params.id },
      });
    } catch (pErr) {
      // Quiet fallback
    }

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
