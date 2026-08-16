import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { generateMcqsWithOllama } from '@/lib/ai/ollama';

export const dynamic = 'force-dynamic';

export async function POST(
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

    // Verify user is classroom admin/teacher
    const { data: group } = await supabase.from('Group').select('*').eq('id', groupId).single();
    if (!group) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

    const { data: member } = await supabase
      .from('GroupMember')
      .select('role')
      .eq('groupId', groupId)
      .eq('userId', user.id)
      .maybeSingle();

    if (group.createdBy !== user.id && member?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only classroom faculty can generate questions with AI.' }, { status: 403 });
    }

    const body = await request.json();
    const topic = body.topic || body.title || 'General Knowledge';
    const requestedCount = Math.min(50, Math.max(1, parseInt(body.count) || 10));
    const instructions = body.instructions || '';
    const difficulty = body.difficulty || 'intermediate';

    // Generate MCQs using Centralized Ollama LLM Service (qwen2.5)
    const result = await generateMcqsWithOllama({
      topic,
      count: requestedCount,
      difficulty,
      instructions,
    });

    return NextResponse.json({
      success: true,
      topic,
      count: result.questions.length,
      model: result.model,
      responseTimeMs: result.responseTimeMs,
      questions: result.questions,
    });
  } catch (err: any) {
    console.error('AI question generation error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to generate questions' }, { status: 500 });
  }
}
