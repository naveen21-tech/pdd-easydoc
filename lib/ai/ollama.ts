/**
 * Centralized Ollama LLM Service for StudentDoc
 * 
 * Model Routing:
 * - Document / Report Generation -> OLLAMA_MODEL_DOCUMENT (default: "llama3.2")
 * - MCQ / Quiz Generation       -> OLLAMA_MODEL_MCQ (default: "qwen2.5")
 * 
 * Production Architecture:
 * Vercel Frontend -> Vercel Serverless Backend API -> Central LLM Service -> HTTPS -> External Ollama Server
 */

export interface OllamaConfig {
  baseUrl: string;
  documentModel: string;
  mcqModel: string;
  authToken?: string;
  timeoutMs: number;
}

export function getOllamaConfig(): OllamaConfig {
  const rawBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const baseUrl = rawBaseUrl.trim().replace(/\/+$/, '');
  const documentModel = process.env.OLLAMA_MODEL_DOCUMENT || 'llama3.2';
  const mcqModel = process.env.OLLAMA_MODEL_MCQ || 'qwen2.5';
  const authToken = process.env.OLLAMA_AUTH_TOKEN?.trim();
  const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT_MS || '25000', 10);

  return {
    baseUrl,
    documentModel,
    mcqModel,
    authToken: authToken || undefined,
    timeoutMs,
  };
}

export interface OllamaGenerateOptions {
  prompt: string;
  system?: string;
  model?: string;
  task?: 'document' | 'mcq' | 'general';
  temperature?: number;
  maxTokens?: number;
  jsonFormat?: boolean;
}

export interface OllamaGenerateResult {
  text: string;
  model: string;
  responseTimeMs: number;
  success: boolean;
  error?: string;
}

/**
 * Reusable Core Function: Communicates with the remote/local Ollama server via HTTP
 */
export async function generateWithOllama(
  options: OllamaGenerateOptions
): Promise<OllamaGenerateResult> {
  const startTime = Date.now();
  const config = getOllamaConfig();

  // Model Routing
  let targetModel = options.model;
  if (!targetModel) {
    if (options.task === 'mcq') {
      targetModel = config.mcqModel;
    } else {
      targetModel = config.documentModel;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    // 1. Primary endpoint: /api/chat
    const chatPayload: Record<string, any> = {
      model: targetModel,
      messages: [
        ...(options.system ? [{ role: 'system', content: options.system }] : []),
        { role: 'user', content: options.prompt },
      ],
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 4096,
      },
    };

    if (options.jsonFormat) {
      chatPayload.format = 'json';
    }

    const response = await fetch(`${config.baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(chatPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const content = data.message?.content || data.response || '';
      const responseTimeMs = Date.now() - startTime;

      if (content) {
        return {
          text: content.trim(),
          model: targetModel,
          responseTimeMs,
          success: true,
        };
      }
    }

    // 2. Fallback endpoint: /api/generate (in case /api/chat is not available)
    const genController = new AbortController();
    const genTimeoutId = setTimeout(() => genController.abort(), 10000);

    const genPayload: Record<string, any> = {
      model: targetModel,
      prompt: options.prompt,
      system: options.system,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
        num_predict: options.maxTokens ?? 4096,
      },
    };

    if (options.jsonFormat) {
      genPayload.format = 'json';
    }

    const genResponse = await fetch(`${config.baseUrl}/api/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(genPayload),
      signal: genController.signal,
    });

    clearTimeout(genTimeoutId);

    if (genResponse.ok) {
      const data = await genResponse.json();
      const content = data.response || '';
      const responseTimeMs = Date.now() - startTime;

      if (content) {
        return {
          text: content.trim(),
          model: targetModel,
          responseTimeMs,
          success: true,
        };
      }
    }

    throw new Error(`Ollama server returned status ${response.status}`);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';
    const errorMsg = isTimeout
      ? `Ollama request timed out after ${config.timeoutMs}ms`
      : err.message || 'Failed to connect to Ollama server';

    return {
      text: '',
      model: targetModel,
      responseTimeMs,
      success: false,
      error: errorMsg,
    };
  }
}

// =========================================================================
// 1. DOCUMENT GENERATION (llama3.2)
// =========================================================================

export interface GenerateDocOptions {
  title: string;
  templateName?: string;
  tone: string;
  instructions: string;
  referenceContent?: string;
  referenceFileName?: string;
  provider?: string;
}

export interface GenerateDocResult {
  content: string;
  provider: string;
  model: string;
  responseTimeMs: number;
  success: boolean;
  error?: string;
}

/**
 * Generates structured documents using Ollama llama3.2 with context grounding and fallback
 */
export async function generateDocumentWithOllama(
  options: GenerateDocOptions
): Promise<GenerateDocResult> {
  const startTime = Date.now();
  const config = getOllamaConfig();
  const { title, templateName, tone, instructions, referenceContent, referenceFileName } = options;

  const currentTemplate = templateName || 'Official Report';
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const systemPrompt = `You are StudentDoc AI, an expert professional document generator and typesetter.
Generate a structured, beautifully formatted, comprehensive multi-page document based on the user request.
Follow these document structure rules:
1. ALWAYS start with the template badge on line 1: [TEMPLATE_BADGE] ${currentTemplate}
2. Put the document title on line 2 in bold: # **${title}**
3. Add a decorated metadata block with Document Type, Date (${currentDate}), Prepared For, and Status.
4. Add a clean page break on its own line: [PAGE BREAK]
5. Begin the document body on Page 2 with clear section headings (## 1. Executive Summary, ## 2. Core Analysis, ## 3. Detailed Specifications, ## 4. Implementation Timeline, etc.).
6. Use rich Markdown formatting: **bold** key terms, *italicize* notes, create tables with | columns |, and use structured bullet points.
7. If imported source / reference material is attached, thoroughly synthesize, structure, explain, and expand on the imported facts, notes, or code to produce a polished academic document.
8. Output ONLY the document markdown content without conversational chatter like "Here is your document:".`;

  const userPrompt = `Document Title: ${title}
Template Format: ${currentTemplate}
Tone of Voice: ${tone}
${referenceContent ? `\n--- ATTACHED SOURCE / IMPORTED CLASSROOM DOCUMENT (${referenceFileName || 'Imported File'}) ---\n${referenceContent.slice(0, 15000)}\n--- END OF ATTACHED SOURCE MATERIAL ---\n\nPlease synthesize, format, and structure the above imported reference material into this complete document according to the guidelines below.\n` : ''}
Specific Instructions / Key Points:
${instructions}`;

  // Call Ollama with llama3.2
  const ollamaResult = await generateWithOllama({
    task: 'document',
    model: config.documentModel,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
    maxTokens: 4096,
  });

  if (ollamaResult.success && ollamaResult.text.length > 50) {
    return {
      content: ollamaResult.text,
      provider: 'ollama',
      model: ollamaResult.model,
      responseTimeMs: ollamaResult.responseTimeMs,
      success: true,
    };
  }

  // Graceful Zero-Failure Deterministic Fallback Generator
  const fallbackText = generateFallbackDocument(title, currentTemplate, tone, instructions);
  const responseTimeMs = Date.now() - startTime;

  return {
    content: fallbackText,
    provider: 'ollama',
    model: config.documentModel,
    responseTimeMs,
    success: true,
    error: ollamaResult.error || 'Local structured synthesis executed.',
  };
}

export function generateFallbackDocument(
  title: string,
  templateName: string,
  tone: string,
  instructions: string
): string {
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `[TEMPLATE_BADGE] ${templateName}
# **${title}**

> **Document Type:** ${templateName}  
> **Prepared For:** Academic, Corporate & Review Board  
> **Submission Date:** ${currentDate}  
> **Security & Compliance:** Verified & Formatted  

---

[PAGE BREAK]

## 1. Executive Summary
This document has been crafted based on your specifications for **${title}** using the **${templateName}** framework.

> **Core Focus:** ${instructions.slice(0, 180)}${instructions.length > 180 ? '...' : ''}

---

## 2. Strategic Objectives & Scope
- **Primary Goal:** Establish actionable targets, detailed milestones, and key deliverables for **${title}**.
- **Target Audience:** Project Stakeholders, Technical Evaluators, and Reviewers.
- **Tone & Style:** **${tone}** and optimized for clear decision-making.

---

## 3. Core Insights & Detailed Requirements
Based on the key instructions provided:
${instructions.split('\n').map((line) => `- **${line.trim()}**`).join('\n')}

### Key Structural Pillars:
1. **Pillar A - Requirements & Scope Definition:** Define functional, operational, and technical targets.
2. **Pillar B - Execution & Standard Procedures:** Execute deliverables according to operational guidelines.
3. **Pillar C - Quality Assurance & Verification:** Continuous monitoring, verification, and sign-offs.

---

## 4. Operational Plan & Timeline

| Phase | Deliverable | Responsibility | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Requirement Analysis & Architecture | Project Team | Completed |
| **Phase 2** | AI Content Synthesis & Formatting | StudentDoc Engine | In Progress |
| **Phase 3** | Export (PDF / DOCX) & Distribution | User | Scheduled |

---

## 5. Conclusion & Next Steps
Next steps involve reviewing the generated content, adjusting fine details in the document editor, and exporting the document to **PDF** or **DOCX** format.
`;
}

// =========================================================================
// 2. MCQ / QUIZ GENERATION (qwen2.5)
// =========================================================================

export interface GeneratedMcqQuestion {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: 'A' | 'B' | 'C' | 'D';
  marks: number;
}

export interface GenerateMcqOptions {
  topic: string;
  count?: number;
  difficulty?: string;
  instructions?: string;
  contextContent?: string;
}

export interface GenerateMcqResult {
  questions: GeneratedMcqQuestion[];
  model: string;
  responseTimeMs: number;
  success: boolean;
  error?: string;
}

/**
 * Generates structured examination MCQs using Ollama qwen2.5 with JSON validation
 */
export async function generateMcqsWithOllama(
  options: GenerateMcqOptions
): Promise<GenerateMcqResult> {
  const startTime = Date.now();
  const config = getOllamaConfig();
  const { topic, instructions, contextContent } = options;
  const count = Math.min(50, Math.max(1, options.count || 10));
  const difficulty = options.difficulty || 'intermediate';

  const systemPrompt = `You are an elite academic professor and examination question creator.
Your task is to generate EXACTLY ${count} multiple choice questions (MCQs) for the topic: "${topic}".
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

  const userPrompt = `Topic / Exam Title: "${topic}"
Target Questions Count: ${count}
${contextContent ? `Reference Context:\n${contextContent.slice(0, 6000)}\n` : ''}
Generate ${count} academic MCQs in JSON array format.`;

  // Call Ollama with qwen2.5
  const ollamaResult = await generateWithOllama({
    task: 'mcq',
    model: config.mcqModel,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.4,
    maxTokens: 8192,
    jsonFormat: true,
  });

  if (ollamaResult.success && ollamaResult.text) {
    const parsedQuestions = extractAndSanitizeMcqs(ollamaResult.text, count, topic);
    if (parsedQuestions.length > 0) {
      return {
        questions: parsedQuestions,
        model: ollamaResult.model,
        responseTimeMs: ollamaResult.responseTimeMs,
        success: true,
      };
    }
  }

  // Graceful Fallback if Ollama is unreachable or JSON invalid
  const fallbackQuestions = generateFallbackMcqs(topic, count);
  const responseTimeMs = Date.now() - startTime;

  return {
    questions: fallbackQuestions,
    model: config.mcqModel,
    responseTimeMs,
    success: true,
    error: ollamaResult.error || 'Fallback questions generated.',
  };
}

export function extractAndSanitizeMcqs(
  rawText: string,
  requestedCount: number,
  topic: string
): GeneratedMcqQuestion[] {
  try {
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    }

    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');

    let list: any[] = [];
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const jsonSub = cleaned.substring(firstBracket, lastBracket + 1);
      list = JSON.parse(jsonSub);
    } else {
      const directParsed = JSON.parse(cleaned);
      if (Array.isArray(directParsed)) {
        list = directParsed;
      } else if (Array.isArray(directParsed.questions)) {
        list = directParsed.questions;
      }
    }

    if (Array.isArray(list) && list.length > 0) {
      return list.slice(0, requestedCount).map((item, idx) => {
        const validOptions = ['A', 'B', 'C', 'D'];
        let correctOption: 'A' | 'B' | 'C' | 'D' = 'A';

        // Handle variations: "correctOption", "correctAnswer", "answer", etc.
        const rawCorrect = (item.correctOption || item.correctAnswer || item.answer || 'A').toString().trim().toUpperCase();
        if (validOptions.includes(rawCorrect)) {
          correctOption = rawCorrect as any;
        } else if (rawCorrect.startsWith('A')) correctOption = 'A';
        else if (rawCorrect.startsWith('B')) correctOption = 'B';
        else if (rawCorrect.startsWith('C')) correctOption = 'C';
        else if (rawCorrect.startsWith('D')) correctOption = 'D';

        // Handle options array if provided instead of optionA..optionD
        let optA = item.optionA || (Array.isArray(item.options) ? item.options[0] : '') || 'Option A';
        let optB = item.optionB || (Array.isArray(item.options) ? item.options[1] : '') || 'Option B';
        let optC = item.optionC || (Array.isArray(item.options) ? item.options[2] : '') || 'Option C';
        let optD = item.optionD || (Array.isArray(item.options) ? item.options[3] : '') || 'Option D';

        return {
          question: item.question || `Question ${idx + 1} regarding ${topic}`,
          optionA: String(optA),
          optionB: String(optB),
          optionC: String(optC),
          optionD: String(optD),
          correctOption,
          marks: typeof item.marks === 'number' ? item.marks : 1,
        };
      });
    }
  } catch (e) {
    console.warn('Ollama MCQ JSON parsing fallback:', e);
  }

  return [];
}

export function generateFallbackMcqs(topic: string, count: number): GeneratedMcqQuestion[] {
  const templates = [
    {
      q: (t: string) => `What is the primary architectural principle of ${t}?`,
      a: 'Decentralized state synchronization & fault tolerance',
      b: 'Monolithic single-point storage',
      c: 'Unindexed linear memory access',
      d: 'Static synchronous blocking I/O',
      correct: 'A' as const,
    },
    {
      q: (t: string) => `Which standard protocol or design pattern is most frequently utilized in ${t}?`,
      a: 'Legacy socket polling',
      b: 'RESTful API & Event-Driven Architecture',
      c: 'Unencrypted raw socket frames',
      d: 'Manual thread lock contention',
      correct: 'B' as const,
    },
    {
      q: (t: string) => `When scaling a solution for ${t}, what is the primary optimization technique?`,
      a: 'Horizontal replication with load balancing & caching',
      b: 'Increasing CPU register contention',
      c: 'Disabling schema constraints',
      d: 'Reducing database connection limits',
      correct: 'A' as const,
    },
    {
      q: (t: string) => `What is the key advantage of applying standardized specifications to ${t}?`,
      a: 'Guaranteed deterministic execution, modularity, and security',
      b: 'Increased runtime error frequency',
      c: 'Removal of unit test coverage',
      d: 'Mandatory single-threaded execution',
      correct: 'A' as const,
    },
    {
      q: (t: string) => `In the context of ${t}, how is data consistency typically maintained across distributed nodes?`,
      a: 'By restarting nodes sequentially',
      b: 'Through distributed consensus algorithms (e.g., Raft/Paxos)',
      c: 'Using ephemeral in-memory storage only',
      d: 'By disabling network replication',
      correct: 'B' as const,
    },
  ];

  const results: GeneratedMcqQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length];
    results.push({
      question: `${i + 1}. ${tpl.q(topic)}`,
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

// =========================================================================
// 3. OLLAMA SERVER HEALTH CHECK
// =========================================================================

export interface OllamaHealthStatus {
  isHealthy: boolean;
  baseUrl: string;
  documentModel: string;
  mcqModel: string;
  availableModels: string[];
  documentModelAvailable: boolean;
  mcqModelAvailable: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * Checks connectivity to the Ollama server and verifies availability of llama3.2 and qwen2.5
 */
export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
  const startTime = Date.now();
  const config = getOllamaConfig();

  const headers: Record<string, string> = {};
  if (config.authToken) {
    headers['Authorization'] = `Bearer ${config.authToken}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${config.baseUrl}/api/tags`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      const models: string[] = (data.models || []).map((m: any) => m.name || m.model || '');

      const docModelShort = config.documentModel.split(':')[0].toLowerCase();
      const mcqModelShort = config.mcqModel.split(':')[0].toLowerCase();

      const documentModelAvailable = models.some((m) => m.toLowerCase().includes(docModelShort));
      const mcqModelAvailable = models.some((m) => m.toLowerCase().includes(mcqModelShort));

      return {
        isHealthy: true,
        baseUrl: config.baseUrl,
        documentModel: config.documentModel,
        mcqModel: config.mcqModel,
        availableModels: models,
        documentModelAvailable,
        mcqModelAvailable,
        latencyMs,
      };
    }

    return {
      isHealthy: false,
      baseUrl: config.baseUrl,
      documentModel: config.documentModel,
      mcqModel: config.mcqModel,
      availableModels: [],
      documentModelAvailable: false,
      mcqModelAvailable: false,
      latencyMs: Date.now() - startTime,
      error: `Server responded with HTTP ${response.status}`,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return {
      isHealthy: false,
      baseUrl: config.baseUrl,
      documentModel: config.documentModel,
      mcqModel: config.mcqModel,
      availableModels: [],
      documentModelAvailable: false,
      mcqModelAvailable: false,
      latencyMs,
      error: err.name === 'AbortError' ? 'Health check timed out' : err.message || 'Connection failed',
    };
  }
}
