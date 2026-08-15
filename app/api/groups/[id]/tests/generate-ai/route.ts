import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GeneratedQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks: number;
}

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

    const systemPrompt = `You are an elite academic professor and examination question creator.
Your task is to generate EXACTLY ${requestedCount} multiple choice questions (MCQs) for the topic: "${topic}".
Difficulty level: ${difficulty}.
${instructions ? `Special Instructions: ${instructions}` : ''}

CRITICAL RULES:
1. Each question must have exactly 4 plausible choices (Option A, Option B, Option C, Option D).
2. Exactly one option must be the strictly correct answer.
3. The 'correctOption' field MUST be exactly one of: "A", "B", "C", or "D".
4. Questions must be technically accurate, high-quality, and non-repetitive.
5. Return ONLY a valid JSON array of question objects without markdown wrapping or commentary.

JSON Schema format:
[
  {
    "question": "Question text here",
    "optionA": "Choice A text",
    "optionB": "Choice B text",
    "optionC": "Choice C text",
    "optionD": "Choice D text",
    "correctOption": "A",
    "marks": 1
  }
]`;

    let generatedQuestions: GeneratedQuestion[] | null = null;

    // 1. Try Groq (Llama-3.3-70B)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && !groqKey.includes('your-groq-key')) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Generate ${requestedCount} MCQs on the topic: "${topic}". Output valid JSON array only.` },
            ],
            temperature: 0.6,
            max_tokens: 8192,
          }),
        });

        if (groqRes.ok) {
          const data = await groqRes.json();
          const rawText = data.choices?.[0]?.message?.content || '';
          generatedQuestions = extractJsonArray(rawText);
        }
      } catch (err) {
        console.warn('Groq MCQ generation error:', err);
      }
    }

    // 2. Try Gemini fallback
    if (!generatedQuestions || generatedQuestions.length === 0) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey && !geminiKey.includes('your-gemini-key')) {
        try {
          const ai = new GoogleGenerativeAI(geminiKey);
          const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(`${systemPrompt}\n\nGenerate ${requestedCount} MCQs for "${topic}" in JSON array format.`);
          const rawText = result.response.text() || '';
          generatedQuestions = extractJsonArray(rawText);
        } catch (err) {
          console.warn('Gemini MCQ generation error:', err);
        }
      }
    }

    // 3. Fallback generator if AI API keys are offline
    if (!generatedQuestions || generatedQuestions.length === 0) {
      generatedQuestions = generateFallbackMcqs(topic, requestedCount);
    }

    // Format & sanitize questions
    const sanitized = generatedQuestions.slice(0, requestedCount).map((q, idx) => {
      const validOptions = ['A', 'B', 'C', 'D'];
      const rawCorrect = (q.correctOption || 'A').toUpperCase();
      const correctOption: 'A' | 'B' | 'C' | 'D' = validOptions.includes(rawCorrect) ? (rawCorrect as any) : 'A';

      return {
        question: q.question || `Question ${idx + 1} regarding ${topic}`,
        optionA: q.optionA || 'First alternative',
        optionB: q.optionB || 'Second alternative',
        optionC: q.optionC || 'Third alternative',
        optionD: q.optionD || 'Fourth alternative',
        correctOption,
        marks: q.marks || 1,
      };
    });

    return NextResponse.json({
      success: true,
      topic,
      count: sanitized.length,
      questions: sanitized,
    });
  } catch (err: any) {
    console.error('AI question generation error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to generate questions' }, { status: 500 });
  }
}

function extractJsonArray(rawText: string): GeneratedQuestion[] | null {
  try {
    // Strip markdown code fences if present
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    }

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const jsonSub = cleaned.substring(firstBracket, lastBracket + 1);
      const parsed = JSON.parse(jsonSub);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    const directParsed = JSON.parse(cleaned);
    if (Array.isArray(directParsed)) return directParsed;
    if (Array.isArray(directParsed.questions)) return directParsed.questions;
  } catch (e) {
    console.error('Failed to parse AI JSON:', e);
  }
  return null;
}

function generateFallbackMcqs(topic: string, count: number): GeneratedQuestion[] {
  const templates = [
    {
      q: (t: string, i: number) => `What is the fundamental principle behind ${t} in modern systems?`,
      a: 'Decentralized state synchronization',
      b: 'Systematic resource abstraction and modular scalability',
      c: 'Manual hardware thread provisioning',
      d: 'Static unoptimized throughput',
      correct: 'B' as const,
    },
    {
      q: (t: string, i: number) => `Which standard protocol or architectural pattern is most frequently utilized in ${t}?`,
      a: 'RESTful API & Event-Driven Architecture',
      b: 'Legacy Monolithic Polling',
      c: 'Single-node unindexed storage',
      d: 'Unencrypted raw socket frames',
      correct: 'A' as const,
    },
    {
      q: (t: string, i: number) => `When scaling a solution for ${t}, what is the primary bottleneck typically encountered?`,
      a: 'CPU register allocation',
      b: 'Database I/O concurrency and network latency',
      c: 'Source code file length',
      d: 'Font rendering time',
      correct: 'B' as const,
    },
    {
      q: (t: string, i: number) => `What is the key advantage of applying best practices to ${t}?`,
      a: 'Increased error rates',
      b: 'Guaranteed deterministic execution, fault tolerance, and security',
      c: 'Removal of automated testing',
      d: 'Mandatory single-threaded execution',
      correct: 'B' as const,
    },
    {
      q: (t: string, i: number) => `In the context of ${t}, how is data consistency typically maintained across distributed nodes?`,
      a: 'Through consensus algorithms like Raft or Paxos',
      b: 'By disabling network replication',
      c: 'Using ephemeral local memory only',
      d: 'By restarting servers periodically',
      correct: 'A' as const,
    },
  ];

  const results: GeneratedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length];
    results.push({
      question: `${i + 1}. ${tpl.q(topic, i + 1)}`,
      optionA: tpl.a,
      optionB: tpl.b,
      optionC: tpl.c,
      optionD: tpl.d,
      correctOption: tpl.correct,
      marks: 1,
    });
  }

  return results;
}
