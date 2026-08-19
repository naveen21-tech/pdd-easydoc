import { generateWithOpenAI, getOpenAIConfig, cleanAIOutput } from '@/lib/ai/openai';
import { VivaQuestionItem, VivaDifficulty, VivaCategory, AIProvider } from '@/lib/types';

export interface GenerateVivaOptions {
  title: string;
  contextContent: string;
  difficulty: VivaDifficulty;
  questionCount: number;
  categories?: VivaCategory[];
  provider?: AIProvider;
}

export interface EvaluateAnswerOptions {
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  category?: string;
  difficulty?: string;
  provider?: AIProvider;
}

export interface VivaEvaluationResult {
  score: number; // 0 - 100
  correctPoints: string[];
  missingPoints: string[];
  suggestedImprovements: string[];
  feedbackComment: string;
}

export async function generateVivaQuestions(
  options: GenerateVivaOptions
): Promise<VivaQuestionItem[]> {
  const { title, contextContent, difficulty, questionCount, categories } = options;
  const count = Math.max(5, Math.min(Number(questionCount) || 25, 50));

  const categoriesStr = categories && categories.length > 0
    ? categories.join(', ')
    : 'Core Principles, Methodology, Deep Analysis, Practical Applications, Evaluation & Standards';

  const systemPrompt = `You are a Senior Academic Examiner and University Professor.
Generate exactly ${count} rigorous Multiple Choice Questions (MCQs) STRICTLY on the topic/subject "${title}" at "${difficulty}" difficulty level.
Categories to cover: ${categoriesStr}.

CRITICAL SCHEMA RULES:
1. Every question must be strictly relevant and academically rigorous for "${title}".
2. Provide exactly 4 plausible, distinct options for each question: [option0, option1, option2, option3].
3. IMPORTANT: Randomly and evenly distribute "correctOptionIndex" across 0, 1, 2, and 3 across the question set (do NOT place all answers in index 0).
4. "answer" must be the exact text of the correct option.
5. "explanation" must clearly explain why that option is correct.
6. Output MUST strictly be a valid JSON object with a "questions" array:
{
  "questions": [
    {
      "id": "mcq-1",
      "question": "Question text about ${title}?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctOptionIndex": 1,
      "answer": "Option 2",
      "explanation": "Why Option 2 is correct...",
      "difficulty": "${difficulty}",
      "category": "Core Principles"
    }
  ]
}
Return ONLY the valid JSON object.`;

  const userPrompt = `Topic / Document Title: ${title}
Difficulty: ${difficulty}
Target Questions Count: ${count}

Context / Reference Material:
${(contextContent || title).slice(0, 8000)}

Output the JSON object now.`;

  // Call Centralized OpenAI Service for MCQ / Quiz generation
  const config = getOpenAIConfig();
  const openAIRes = await generateWithOpenAI({
    task: 'mcq',
    model: config.model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
    maxTokens: 7500,
    jsonFormat: true,
  });

  if (openAIRes.success && openAIRes.text) {
    let clean = cleanAIOutput(openAIRes.text);
    if (clean.startsWith('```json')) clean = clean.slice(7);
    if (clean.startsWith('```')) clean = clean.slice(3);
    if (clean.endsWith('```')) clean = clean.slice(0, clean.length - 3);
    clean = clean.trim();

    try {
      const parsed = JSON.parse(clean);
      const arr = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.mcqs || parsed.data || []);
      if (Array.isArray(arr) && arr.length > 0) {
        return sanitizeQuestions(arr, difficulty, count);
      }
    } catch (e) {
      console.warn('OpenAI viva questions parse error, attempting regex extraction:', e);
      const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return sanitizeQuestions(parsed, difficulty, count);
          }
        } catch (innerErr) {
          console.warn('Inner regex parse error:', innerErr);
        }
      }
    }
  }

  // Fallback Synthesizer
  return generateFallbackVivaQuestions(title, difficulty, count, categories);
}

export async function evaluateVivaAnswer(
  options: EvaluateAnswerOptions
): Promise<VivaEvaluationResult> {
  const { question, expectedAnswer, userAnswer } = options;

  if (!userAnswer || userAnswer.trim().length < 3) {
    return {
      score: 15,
      correctPoints: ['Attempt recorded'],
      missingPoints: ['No core technical explanation or concepts provided'],
      suggestedImprovements: ['Explain the core mechanism, domain rationale, and practical steps.'],
      feedbackComment: 'Answer was too brief to demonstrate competence.',
    };
  }

  const systemPrompt = `You are a principal technical examiner. Evaluate the candidate's answer to the viva defense question against the expected answer.
Output ONLY a valid JSON object matching this schema:
{
  "score": 85,
  "correctPoints": ["Clearly articulated the core concepts", "Identified valid domain principles"],
  "missingPoints": ["Did not mention specific mechanisms or practical trade-offs"],
  "suggestedImprovements": ["Deepen understanding of foundational concepts and error handling."],
  "feedbackComment": "Strong, concise answer demonstrating solid understanding."
}
Return ONLY raw JSON.`;

  const userPrompt = `Question: ${question}
Expected Answer: ${expectedAnswer}
Candidate Answer: ${userAnswer}`;

  // Call Centralized OpenAI Service for answer evaluation
  const config = getOpenAIConfig();
  const openAIRes = await generateWithOpenAI({
    task: 'document',
    model: config.model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
    maxTokens: 1000,
    jsonFormat: true,
  });

  if (openAIRes.success && openAIRes.text) {
    const raw = cleanAIOutput(openAIRes.text);
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return {
          score: Math.max(0, Math.min(100, Number(parsed.score) || 75)),
          correctPoints: Array.isArray(parsed.correctPoints) ? parsed.correctPoints : ['Addressed key parts of the question'],
          missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
          suggestedImprovements: Array.isArray(parsed.suggestedImprovements) ? parsed.suggestedImprovements : [],
          feedbackComment: parsed.feedbackComment || 'Satisfactory response.',
        };
      } catch (e) {
        console.warn('OpenAI viva evaluation parse error:', e);
      }
    }
  }

  // Deterministic Evaluation Fallback
  const uWords = userAnswer.toLowerCase().split(/\s+/);
  const eWords = expectedAnswer.toLowerCase().split(/\s+/);
  const matchCount = uWords.filter((w) => w.length > 3 && eWords.includes(w)).length;
  const calculatedScore = Math.min(95, Math.max(20, Math.round((matchCount / Math.max(6, eWords.length * 0.6)) * 100)));

  return {
    score: calculatedScore,
    correctPoints: ['Addressed the question with relevant terminology', 'Communicated structured explanation'],
    missingPoints: ['Could expand further on low-level implementation details and trade-offs'],
    suggestedImprovements: ['Provide concrete examples and reference key principles.'],
    feedbackComment: calculatedScore >= 75
      ? 'Good response addressing key aspects of the question.'
      : 'Adequate response. Consider expanding with more technical depth.',
  };
}

function sanitizeQuestions(
  rawList: any[],
  difficulty: VivaDifficulty,
  targetCount: number
): VivaQuestionItem[] {
  return rawList.slice(0, targetCount).map((q: any, idx: number) => {
    let options: string[] = [];

    if (Array.isArray(q.options) && q.options.length >= 2) {
      options = q.options.slice(0, 4).map((opt: any) => String(opt).trim());
    } else if (q.optionA || q.optionB) {
      options = [
        String(q.optionA || 'Option A').trim(),
        String(q.optionB || 'Option B').trim(),
        String(q.optionC || 'Option C').trim(),
        String(q.optionD || 'Option D').trim(),
      ];
    }

    while (options.length < 4) {
      options.push(`Alternative perspective ${options.length + 1}`);
    }

    let correctOptionIndex = 0;
    if (typeof q.correctOptionIndex === 'number' && q.correctOptionIndex >= 0 && q.correctOptionIndex < options.length) {
      correctOptionIndex = q.correctOptionIndex;
    } else if (typeof q.correctOption === 'string' && ['A', 'B', 'C', 'D'].includes(q.correctOption.toUpperCase())) {
      correctOptionIndex = ['A', 'B', 'C', 'D'].indexOf(q.correctOption.toUpperCase());
    }

    return {
      id: q.id || `mcq-${idx + 1}-${Date.now()}`,
      question: String(q.question || `Question ${idx + 1}`).trim(),
      options,
      correctOptionIndex,
      answer: String(q.answer || options[correctOptionIndex] || 'Expected answer.').trim(),
      explanation: String(q.explanation || `Option ${String.fromCharCode(65 + correctOptionIndex)} is correct according to standard domain principles.`).trim(),
      difficulty: (q.difficulty || difficulty) as VivaDifficulty,
      category: (q.category || 'Core Principles') as VivaCategory,
    };
  });
}

function generateFallbackVivaQuestions(
  title: string,
  difficulty: VivaDifficulty,
  count: number,
  categories?: VivaCategory[]
): VivaQuestionItem[] {
  const cleanTitle = title.trim() || 'Academic Study';
  const templates = [
    {
      category: 'Core Principles' as VivaCategory,
      question: `What is the primary objective or foundational mechanism of ${cleanTitle}?`,
      options: [
        `To bypass domain validation and omit standard documentation`,
        `To establish a validated, systematic framework for analyzing ${cleanTitle}`,
        `To prevent reproducible outcomes across controlled environments`,
        `To restrict execution solely to theoretical simulations`,
      ],
      correctOptionIndex: 1,
      answer: `To establish a validated, systematic framework for analyzing ${cleanTitle}`,
      explanation: `Establishing a structured and validated framework is the foundational requirement for rigorous study of ${cleanTitle}.`,
    },
    {
      category: 'Methodology' as VivaCategory,
      question: `Which methodology is most effective when implementing solutions in ${cleanTitle}?`,
      options: [
        'Direct unstructured deployment without quality control or baseline metrics',
        'Single-pass arbitrary execution without error logging',
        'Iterative decomposition with continuous benchmarking and empirical verification',
        'Manual override of all automated consistency checks',
      ],
      correctOptionIndex: 2,
      answer: 'Iterative decomposition with continuous benchmarking and empirical verification',
      explanation: 'Iterative decomposition ensures maintainability, reproducibility, and robust error detection.',
    },
    {
      category: 'Evaluation & Standards' as VivaCategory,
      question: `How are outcomes in ${cleanTitle} rigorously evaluated against industry standards?`,
      options: [
        'Through standardized metrics, peer-reviewed benchmarks, and rubric compliance',
        'By relying entirely on unverified anecdotal observations',
        'By disregarding edge cases and anomalous data points',
        'By disabling validation guardrails during evaluation phases',
      ],
      correctOptionIndex: 0,
      answer: 'Through standardized metrics, peer-reviewed benchmarks, and rubric compliance',
      explanation: 'Rigorous evaluation requires quantifiable metrics and adherence to established domain standards.',
    },
    {
      category: 'Practical Applications' as VivaCategory,
      question: `What represents a primary challenge when scaling or deploying ${cleanTitle} in practice?`,
      options: [
        'Eliminating all structured testing and documentation overhead',
        'Preventing stakeholders from reviewing output data',
        'Enforcing unmodifiable hardcoded assumptions',
        'Managing environmental constraints, latency, and operational consistency',
      ],
      correctOptionIndex: 3,
      answer: 'Managing environmental constraints, latency, and operational consistency',
      explanation: 'Scaling real-world systems requires handling variable environments, latency constraints, and operational integrity.',
    },
  ];

  const results: VivaQuestionItem[] = [];
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    results.push({
      id: `mcq-fallback-${i + 1}`,
      question: `${i + 1}. [${difficulty.toUpperCase()}] ${t.question}`,
      options: t.options,
      correctOptionIndex: t.correctOptionIndex,
      answer: t.answer,
      explanation: t.explanation,
      difficulty,
      category: t.category,
    });
  }
  return results;
}