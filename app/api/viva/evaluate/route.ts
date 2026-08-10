import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { evaluateVivaAnswer } from '@/lib/ai/viva-generator';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { question, expectedAnswer, userAnswer, category, difficulty } = body;

    if (!question || !userAnswer) {
      return NextResponse.json({ error: 'Question and answer are required' }, { status: 400 });
    }

    const evaluation = await evaluateVivaAnswer({
      question,
      expectedAnswer: expectedAnswer || '',
      userAnswer,
      category,
      difficulty,
    });

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    console.error('Viva evaluation error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}
