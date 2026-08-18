import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateGroupSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Group & Creator via Prisma (bypasses RLS so creator details are always available)
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // 2. Check if user is a member or admin
    const myMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    const isCreator = group.createdBy === user.id;
    if (!isCreator && !myMember) {
      return NextResponse.json({ error: 'Access denied. You are not a member of this group.' }, { status: 403 });
    }

    const myRole = isCreator ? 'ADMIN' : (myMember?.role || 'MEMBER');

    // 3. Fetch all Members with their full Profile data (names, emails, avatars)
    const membersList = await prisma.groupMember.findMany({
      where: { groupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    // Ensure the creator is represented in the members list if not already present
    const hasCreatorInMembers = membersList.some((m) => m.userId === group.createdBy);
    const membersData = hasCreatorInMembers
      ? membersList
      : [
          {
            id: `creator-${group.id}`,
            groupId: group.id,
            userId: group.createdBy,
            role: 'ADMIN' as const,
            joinedAt: group.createdAt,
            user: group.creator,
          },
          ...membersList,
        ];

    // 4. Fetch Documents (Teacher sees all; Student sees teacher materials + only their own submissions)
    const allDocs = await prisma.groupDocument.findMany({
      where: { groupId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isAdmin = myRole === 'ADMIN';
    const documentsData = allDocs.filter((doc) => {
      if (isAdmin) return true; // Teacher sees all documents and student submissions
      // Students see teacher/admin materials + only their own submissions
      return doc.uploadedBy === group.createdBy || doc.uploadedBy === user.id;
    });

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        joinCode: group.joinCode,
        createdBy: group.createdBy,
        creator: group.creator,
        role: myRole,
        memberCount: membersData.length,
        documentCount: documentsData.length,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
      },
      members: membersData.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      })),
      documents: documentsData.map((d) => ({
        id: d.id,
        groupId: d.groupId,
        uploadedBy: d.uploadedBy,
        title: d.title,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        content: d.content,
        fileType: d.fileType,
        fileSize: d.fileSize,
        documentId: d.documentId,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        uploader: d.uploader,
      })),
      myRole,
    });
  } catch (err: any) {
    console.error('Fetch group details error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch group details' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only group administrators can modify group settings.' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      },
    });

    return NextResponse.json({ group: updatedGroup });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id;
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    if (group.createdBy !== user.id) {
      return NextResponse.json({ error: 'Only the group creator can delete this group.' }, { status: 403 });
    }

    await prisma.group.delete({ where: { id: groupId } });

    return NextResponse.json({ success: true, message: 'Group deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete group' }, { status: 500 });
  }
}
