import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateProjectDocumentation } from '@/lib/ai/project-generator';
import { ProjectModuleItem } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      projectName,
      projectDomain,
      projectDescription,
      problemStatement,
      objectives,
      targetUsers,
      techStack,
      modules,
      selectedDocTypes,
    } = body;

    if (!projectName || !projectDescription || !selectedDocTypes || selectedDocTypes.length === 0) {
      return NextResponse.json(
        { error: 'Project name, description, and at least one document type are required.' },
        { status: 400 }
      );
    }

    // 1. Generate documentation artifacts using AI synthesizer
    const generatedDocs = await generateProjectDocumentation({
      projectName,
      projectDomain: projectDomain || 'General Software',
      projectDescription,
      problemStatement,
      objectives,
      targetUsers,
      techStack: techStack || { languages: [], frameworks: [], database: [], tools: [] },
      modules: (modules as ProjectModuleItem[]) || [],
      selectedDocTypes,
    });

    // 2. Persist Project & Documents in database
    let createdProject: any = null;
    try {
      createdProject = await prisma.project.create({
        data: {
          userId: profile.id,
          name: projectName,
          domain: projectDomain || 'General Software',
          description: projectDescription,
          problemStatement: problemStatement || null,
          objectives: objectives || null,
          targetUsers: targetUsers || null,
          techStack: techStack || {},
          modules: modules || [],
        },
      });

      // Create documents linked to this project
      for (const doc of generatedDocs) {
        await prisma.document.create({
          data: {
            userId: profile.id,
            projectId: createdProject.id,
            title: doc.title,
            content: doc.content,
            status: 'COMPLETE',
          },
        });
      }
    } catch (dbErr) {
      console.warn('Prisma project creation note:', dbErr);
    }

    const projectId = createdProject?.id || `proj-${Date.now()}`;

    // Add a notification for the user
    try {
      await prisma.notification.create({
        data: {
          userId: profile.id,
          type: 'success',
          message: `Project Documentation "${projectName}" created with ${generatedDocs.length} documents!`,
        },
      });
    } catch (notifErr) {
      console.warn('Notification log:', notifErr);
    }

    return NextResponse.json({
      success: true,
      projectId,
      projectName,
      documentCount: generatedDocs.length,
      documents: generatedDocs,
    });
  } catch (error: any) {
    console.error('Project Documentation generation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate project documentation' },
      { status: 500 }
    );
  }
}
