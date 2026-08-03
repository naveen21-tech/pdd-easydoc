import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateDocument } from '@/lib/ai/provider';
import { AIProvider } from '@/lib/types';

export const dynamic = 'force-dynamic';

const generateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  templateId: z.string().optional(),
  templateName: z.string().optional(),
  tone: z.string().default('Professional'),
  instructions: z.string().min(5, 'Instructions are required'),
  provider: z.enum(['openai', 'anthropic', 'gemini']).default('openai'),
});

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid generation parameters: ' + parsed.error.issues[0]?.message },
        { status: 400 }
      );
    }

    const { title, templateId, templateName, tone, instructions, provider } = parsed.data;

    // Call AI provider service
    const aiResult = await generateDocument({
      provider: provider as AIProvider,
      title,
      templateName,
      tone,
      instructions,
    });

    // Log AIRequest row in database
    await prisma.aIRequest.create({
      data: {
        userId: user.id,
        prompt: `Title: ${title} | Tone: ${tone} | Prompt: ${instructions}`,
        provider,
        responseTimeMs: aiResult.responseTimeMs,
        success: aiResult.success,
      },
    });

    // Create Document record
    const document = await prisma.document.create({
      data: {
        userId: user.id,
        title,
        content: aiResult.content,
        templateId: templateId || null,
        status: 'COMPLETE',
      },
    });

    // Create user notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        message: `Document "${title}" generated successfully with ${provider.toUpperCase()}.`,
        type: 'success',
      },
    });

    return NextResponse.json({
      document,
      responseTimeMs: aiResult.responseTimeMs,
      provider,
    });
  } catch (err: any) {
    console.error('API /api/ai/generate error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate document' },
      { status: 500 }
    );
  }
}
