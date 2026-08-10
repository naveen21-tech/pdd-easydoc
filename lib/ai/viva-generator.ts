import { GoogleGenerativeAI } from '@google/generative-ai';
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
  const count = Math.max(4, Math.min(Number(questionCount) || 8, 15));

  const categoriesStr = categories && categories.length > 0
    ? categories.join(', ')
    : 'Technical, Architecture, Database, Programming, Security, Testing, Deployment, Project-specific';

  const systemPrompt = `You are a Senior University Examiner, Technical Defense Lead, and Principal Engineer.
Generate exactly ${count} high-caliber viva defense and technical examination questions for "${title}" at "${difficulty}" difficulty.
Categories to cover: ${categoriesStr}.

Output ONLY a valid JSON array conforming to this exact schema:
[
  {
    "id": "viva-1",
    "question": "Clear, rigorous technical question asking about mechanism, trade-offs, or implementation",
    "answer": "Exhaustive, technically sound expected answer with reasoning, architecture details, and keywords",
    "difficulty": "${difficulty}",
    "category": "Technical" | "Architecture" | "Database" | "Programming" | "Security" | "Testing" | "Deployment" | "Project-specific"
  }
]
Return ONLY raw JSON.`;

  const userPrompt = `Project / Document Topic: ${title}
Difficulty Level: ${difficulty}
Target Questions: ${count}

Context & Specifications:
${(contextContent || title).slice(0, 7000)}`;

  // 1. Try Groq AI
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'mock-key' && !groqKey.includes('your-groq-key')) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 3500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const match = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return sanitizeQuestions(parsed, difficulty, count);
          }
        }
      }
    } catch (e) {
      console.warn('Groq viva generation fallback:', e);
    }
  }

  // 2. Try Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'mock-key' && !geminiKey.includes('your-gemini-key')) {
    try {
      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const res = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const raw = res.response.text();
      const match = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizeQuestions(parsed, difficulty, count);
        }
      }
    } catch (e) {
      console.warn('Gemini viva generation fallback:', e);
    }
  }

  // 3. Fallback Synthesizer
  return generateFallbackVivaQuestions(title, difficulty, count);
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
      suggestedImprovements: ['Explain the core mechanism, architectural rationale, and execution steps.'],
      feedbackComment: 'Answer was too brief to demonstrate technical competence.',
    };
  }

  const systemPrompt = `You are a principal technical examiner. Evaluate the candidate's answer to the viva defense question against the expected answer.
Output ONLY a valid JSON object matching this schema:
{
  "score": 85,
  "correctPoints": ["Clearly articulated the core concepts", "Identified valid architectural trade-offs"],
  "missingPoints": ["Did not mention connection pooling or edge caching mechanisms"],
  "suggestedImprovements": ["Deepen understanding of asynchronous concurrency and error handling."],
  "feedbackComment": "Strong, concise answer demonstrating solid technical understanding."
}`;

  const userPrompt = `Question: ${question}
Expected Answer: ${expectedAnswer}
Candidate's Answer: ${userAnswer}`;

  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'mock-key' && !groqKey.includes('your-groq-key')) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 1200,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            score: Math.max(0, Math.min(100, Number(parsed.score) || 75)),
            correctPoints: Array.isArray(parsed.correctPoints) ? parsed.correctPoints : ['Addressed key parts of the question'],
            missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
            suggestedImprovements: Array.isArray(parsed.suggestedImprovements) ? parsed.suggestedImprovements : [],
            feedbackComment: parsed.feedbackComment || 'Satisfactory response.',
          };
        }
      }
    } catch (e) {
      console.warn('Groq viva evaluation fallback:', e);
    }
  }

  // Deterministic Evaluation Fallback
  const uWords = userAnswer.toLowerCase().split(/\s+/);
  const eWords = expectedAnswer.toLowerCase().split(/\s+/);
  const matchCount = uWords.filter((w) => w.length > 3 && eWords.includes(w)).length;
  const calculatedScore = Math.min(95, Math.max(45, Math.round((matchCount / Math.max(5, eWords.length * 0.4)) * 100)));

  return {
    score: calculatedScore,
    correctPoints: ['Addressed the question with relevant terminology', 'Communicated structured explanation'],
    missingPoints: ['Could expand further on low-level implementation details and trade-offs'],
    suggestedImprovements: ['Provide concrete examples and reference performance metrics.'],
    feedbackComment: calculatedScore > 75
      ? 'Good technical clarity and solid grasp of the subject.'
      : 'Acceptable foundation, but would benefit from deeper technical specificity.',
  };
}

function sanitizeQuestions(
  raw: any[],
  difficulty: VivaDifficulty,
  targetCount: number
): VivaQuestionItem[] {
  return raw.slice(0, targetCount).map((q, idx) => ({
    id: q.id || `viva-${idx + 1}-${Date.now()}`,
    question: String(q.question || `Technical Question ${idx + 1}`).trim(),
    answer: String(q.answer || 'Expected answer with technical rationale and architectural considerations.').trim(),
    difficulty: (q.difficulty || difficulty) as VivaDifficulty,
    category: (q.category || 'Technical') as VivaCategory,
  }));
}

function generateFallbackVivaQuestions(
  title: string,
  difficulty: VivaDifficulty,
  count: number
): VivaQuestionItem[] {
  const bank = [
    {
      category: 'Architecture' as const,
      question: `How does the core system topology of ${title} handle horizontal scalability and fault isolation?`,
      answer: `The system utilizes a decoupled multi-tier architecture where stateless application servers communicate with persistent data stores via connection pools. Load balancers distribute ingress traffic, while asynchronous task queues isolate heavy background jobs to prevent thread blocking.`,
    },
    {
      category: 'Security' as const,
      question: `What security mechanisms prevent unauthorized access, privilege escalation, and SQL injection in ${title}?`,
      answer: `Authentication is enforced via cryptographic JWT / cookie sessions validated in edge middleware. Data queries use parameterized ORM queries preventing SQL injection, while Row-Level Security (RLS) policies and Role-Based Access Control (RBAC) restrict unauthorized resource mutation.`,
    },
    {
      category: 'Database' as const,
      question: `Explain the database schema indexing strategy and transaction isolation level used in ${title}.`,
      answer: `Indexes (B-Trees) are applied to primary lookups such as user foreign keys and timestamps to optimize query latency. Critical multi-table mutations are wrapped in ACID-compliant atomic transactions to guarantee data consistency during concurrent requests.`,
    },
    {
      category: 'Programming' as const,
      question: `How are asynchronous operations, error boundaries, and state hydration managed in the frontend?`,
      answer: `Server-Side Rendering (SSR) streams pre-rendered HTML while React hydrates interactive state client-side. Async operations use native Fetch with exponential backoff and central try-catch error boundaries preventing cascading application crashes.`,
    },
    {
      category: 'Testing' as const,
      question: `What automated testing strategy ensures regression prevention across major releases of ${title}?`,
      answer: `A comprehensive testing pyramid includes unit tests for business utilities, integration tests for API endpoints, and end-to-end verification matrices. Automated CI/CD pipelines run these test suites prior to staging deployments.`,
    },
    {
      category: 'Deployment' as const,
      question: `Describe the zero-downtime deployment process and environment variable management for production.`,
      answer: `Deployments use containerized builds or edge serverless functions with blue-green routing. Environment secrets are injected via secure vaults without exposing keys in client bundles, allowing instant rollbacks if health check probes fail.`,
    },
    {
      category: 'Project-specific' as const,
      question: `What is the single biggest technical trade-off made during the development of ${title}?`,
      answer: `Balancing sub-second response latency with heavy AI computation was addressed by implementing streaming responses, local caching layers, and asynchronous background workers instead of synchronous blocking execution.`,
    },
    {
      category: 'Technical' as const,
      question: `How would ${title} behave under a 10x traffic spike, and what caching strategies mitigate database bottlenecks?`,
      answer: `Redis in-memory caching serves repeated read operations, while CDN edge caches deliver static assets. Database connection pooling (e.g. pgBouncer) prevents connection exhaustion, allowing auto-scaling groups to absorb traffic bursts smoothly.`,
    },
  ];

  const questions: VivaQuestionItem[] = [];
  for (let i = 0; i < count; i++) {
    const item = bank[i % bank.length];
    questions.push({
      id: `viva-${i + 1}`,
      question: item.question,
      answer: item.answer,
      difficulty,
      category: item.category,
    });
  }

  return questions;
}
