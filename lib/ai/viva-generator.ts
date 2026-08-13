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
  const count = Math.max(5, Math.min(Number(questionCount) || 25, 50));

  const categoriesStr = categories && categories.length > 0
    ? categories.join(', ')
    : 'Technical, Architecture, Database, Programming, Security, Testing, Deployment, Project-specific';

  const systemPrompt = `You are a Principal Engineering Examiner and Senior Technical Professor.
Generate exactly ${count} rigorous, high-quality Multiple Choice Questions (MCQs) and technical exam questions for "${title}" at "${difficulty}" difficulty.
Categories to cover: ${categoriesStr}.

For every single question, provide:
1. "question": A precise, challenging conceptual or practical problem
2. "options": An array of EXACTLY 4 distinct, plausible options (strings)
3. "correctOptionIndex": The 0-based index (0, 1, 2, or 3) of the correct option
4. "answer": The full text of the correct option / expected technical answer
5. "explanation": Comprehensive rationale explaining why the correct choice is optimal and why the other 3 distractors are incorrect
6. "difficulty": "${difficulty}"
7. "category": "Technical" | "Architecture" | "Database" | "Programming" | "Security" | "Testing" | "Deployment" | "Project-specific"

Output ONLY a valid JSON array conforming to this exact schema:
[
  {
    "id": "mcq-1",
    "question": "Which caching invalidation pattern guarantees strong consistency across distributed nodes?",
    "options": [
      "Write-through cache with synchronous transactional write",
      "Cache-aside with TTL expiration",
      "Write-behind asynchronous batching",
      "Read-through cache with eventual consistency"
    ],
    "correctOptionIndex": 0,
    "answer": "Write-through cache with synchronous transactional write",
    "explanation": "Write-through caching updates the cache and the backing store synchronously within the same transaction, ensuring zero stale reads at the cost of higher write latency.",
    "difficulty": "${difficulty}",
    "category": "Architecture"
  }
]
Return ONLY raw JSON. Do not include markdown code blocks or conversational text.`;

  const userPrompt = `Document / Topic Title: ${title}
Difficulty Level: ${difficulty}
Target Questions Count: ${count}

Context & Specifications:
${(contextContent || title).slice(0, 8000)}`;

  // 1. Try Groq AI (Llama 3.3 70B)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !groqKey.toLowerCase().includes('mock') && !groqKey.includes('your-groq-key')) {
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
          temperature: 0.4,
          max_tokens: 7500,
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
      console.warn('Groq MCQ generation fallback:', e);
    }
  }

  // 2. Try Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && !geminiKey.toLowerCase().includes('mock') && !geminiKey.includes('your-gemini-key')) {
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
      console.warn('Gemini MCQ generation fallback:', e);
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
Candidate Answer: ${userAnswer}`;

  // 1. Try Groq AI
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !groqKey.toLowerCase().includes('mock') && !groqKey.includes('your-groq-key')) {
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
          max_tokens: 1000,
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
  return raw.slice(0, targetCount).map((q, idx) => {
    let options: string[] = [];
    if (Array.isArray(q.options) && q.options.length >= 4) {
      options = q.options.slice(0, 4).map((opt: any) => String(opt).trim());
    } else {
      const correctText = String(q.answer || 'Correct implementation approach').trim();
      options = [
        correctText,
        'Asynchronous single-threaded event loop polling without backpressure',
        'Direct synchronous disk I/O locking without in-memory buffering',
        'Unbounded in-memory queue accumulation without rate limiting',
      ];
    }

    const correctOptionIndex = typeof q.correctOptionIndex === 'number' && q.correctOptionIndex >= 0 && q.correctOptionIndex < options.length
      ? q.correctOptionIndex
      : 0;

    return {
      id: q.id || `mcq-${idx + 1}-${Date.now()}`,
      question: String(q.question || `Technical Question ${idx + 1}`).trim(),
      options,
      correctOptionIndex,
      answer: String(q.answer || options[correctOptionIndex] || 'Expected technical answer.').trim(),
      explanation: String(q.explanation || `Option ${String.fromCharCode(65 + correctOptionIndex)} is correct because it aligns with standard engineering best practices and architectural specifications.`).trim(),
      difficulty: (q.difficulty || difficulty) as VivaDifficulty,
      category: (q.category || 'Technical') as VivaCategory,
    };
  });
}

function generateFallbackVivaQuestions(
  title: string,
  difficulty: VivaDifficulty,
  count: number
): VivaQuestionItem[] {
  const bank: {
    category: VivaCategory;
    question: string;
    options: string[];
    correctOptionIndex: number;
    answer: string;
    explanation: string;
  }[] = [
    {
      category: 'Architecture',
      question: `In the system design of ${title}, which architectural pattern best minimizes coupling between microservices while enabling asynchronous task execution?`,
      options: [
        'Event-Driven Architecture with Message Brokers (e.g., Kafka, RabbitMQ)',
        'Synchronous Monolithic Shared Memory Buffering',
        'Direct Peer-to-Peer REST polling on high-frequency intervals',
        'Centralized Single-Point Database Table Locks',
      ],
      correctOptionIndex: 0,
      answer: 'Event-Driven Architecture with Message Brokers (e.g., Kafka, RabbitMQ)',
      explanation: 'Event-driven architecture decouples producers from consumers by transmitting events through distributed message brokers, providing durability, retries, and high-throughput async processing.',
    },
    {
      category: 'Security',
      question: `What is the primary vulnerability prevented by utilizing parameterized ORM queries instead of raw string concatenation in ${title}?`,
      options: [
        'SQL Injection (SQLi)',
        'Cross-Site Request Forgery (CSRF)',
        'Distributed Denial of Service (DDoS)',
        'Server-Side Request Forgery (SSRF)',
      ],
      correctOptionIndex: 0,
      answer: 'SQL Injection (SQLi)',
      explanation: 'Parameterized queries treat user inputs strictly as query parameters rather than executable SQL code, completely eliminating SQL injection vulnerabilities.',
    },
    {
      category: 'Database',
      question: `Which database indexing structure is most commonly employed for range queries and primary key B-Tree lookups in relational engines?`,
      options: [
        'B+ Tree Index',
        'Inverted Index',
        'Hash Index',
        'Bitmap Index without tree ordering',
      ],
      correctOptionIndex: 0,
      answer: 'B+ Tree Index',
      explanation: 'B+ Trees store sequential pointers across leaf nodes, making them exceptionally fast for range scans (<, >, BETWEEN) as well as logarithmic point lookups.',
    },
    {
      category: 'Programming',
      question: `In modern React/Next.js architectures supporting ${title}, what occurs during client-side hydration?`,
      options: [
        'React attaches event listeners to the pre-rendered HTML DOM received from the server',
        'The server completely re-renders the database schema into client memory',
        'All client cookies are automatically deleted and renewed',
        'Static CSS files are recompiled into WebAssembly binaries',
      ],
      correctOptionIndex: 0,
      answer: 'React attaches event listeners to the pre-rendered HTML DOM received from the server',
      explanation: 'Hydration is the process where React preserves the fast initial HTML sent by SSR and injects stateful reactivity and interactive event listeners into the DOM.',
    },
    {
      category: 'Testing',
      question: `Which test phase specifically verifies that interacting software modules exchange data and handle contracts correctly as a combined unit?`,
      options: [
        'Integration Testing',
        'Isolated Unit Testing',
        'Static Linting Analysis',
        'A/B Canary Experimentation',
      ],
      correctOptionIndex: 0,
      answer: 'Integration Testing',
      explanation: 'Integration testing focuses on the interfaces, API endpoints, and database interactions between individual units to ensure correct holistic behavior.',
    },
    {
      category: 'Deployment',
      question: `What is the key advantage of a Blue-Green deployment strategy in production environments?`,
      options: [
        'Near-instant rollback capability with zero downtime during ingress switchover',
        'Guaranteed reduction of production database storage size by 50%',
        'Automatic compilation of frontend JavaScript into machine bytecode',
        'Elimination of all unit testing requirements prior to production release',
      ],
      correctOptionIndex: 0,
      answer: 'Near-instant rollback capability with zero downtime during ingress switchover',
      explanation: 'Blue-Green deployments maintain two identical production environments; traffic is routed to the new environment once validated, allowing instantaneous rollback if errors arise.',
    },
    {
      category: 'Technical',
      question: `Under high concurrency, what mechanism prevents database connection exhaustion when scaling multiple application replicas?`,
      options: [
        'Connection Pooling with pgBouncer / Proxy Layer',
        'Creating a new unconstrained DB connection for every single HTTP request',
        'Disabling all database indexes during peak hours',
        'Running all queries synchronously on the main thread',
      ],
      correctOptionIndex: 0,
      answer: 'Connection Pooling with pgBouncer / Proxy Layer',
      explanation: 'Connection pooling maintains a pool of pre-established database connections, reusing them across incoming requests to avoid overwhelming database server memory.',
    },
    {
      category: 'Project-specific',
      question: `What is the primary benefit of generating structured Markdown before exporting documents to PDF or DOCX formats?`,
      options: [
        'Platform-agnostic intermediate representation that can be styled, parsed, and converted to multiple targets',
        'Doubles the compute speed of the host operating system',
        'Removes the need for database storage',
        'Enforces mandatory AES-256 encryption on every paragraph',
      ],
      correctOptionIndex: 0,
      answer: 'Platform-agnostic intermediate representation that can be styled, parsed, and converted to multiple targets',
      explanation: 'Markdown acts as a clean, semantic intermediate representation (IR) that can be easily validated, edited by LLMs, and compiled to PDF, DOCX, and HTML.',
    },
    {
      category: 'Architecture',
      question: `Which principle of the CAP theorem states that every non-failing node returns a response for every request, without guarantee of latest data?`,
      options: [
        'Availability (A)',
        'Consistency (C)',
        'Partition Tolerance (P)',
        'Durability (D)',
      ],
      correctOptionIndex: 0,
      answer: 'Availability (A)',
      explanation: 'Availability guarantees that every request receives a non-error response, even in the presence of network partitions, though the data might not be the latest.',
    },
    {
      category: 'Security',
      question: `How does JSON Web Token (JWT) verification operate statelessly on edge middleware?`,
      options: [
        'By validating the cryptographic signature using a shared secret or public key without querying the DB',
        'By performing a synchronous SQL lookup on every single API route',
        'By sending an SMS OTP code to the server administrator',
        'By storing the full password hash in the client LocalStorage',
      ],
      correctOptionIndex: 0,
      answer: 'By validating the cryptographic signature using a shared secret or public key without querying the DB',
      explanation: 'JWTs contain signed payloads; edge nodes can verify authenticity mathematically using cryptographic public/private keys without hitting central databases.',
    },
    {
      category: 'Database',
      question: `In ACID transaction properties, what does "Isolation" guarantee?`,
      options: [
        'Concurrent transactions execute without interfering with one another or reading partial states',
        'Transactions survive sudden system power loss or hard drive crashes',
        'All or nothing execution of a transaction bundle',
        'Database schemas remain identical across read replicas',
      ],
      correctOptionIndex: 0,
      answer: 'Concurrent transactions execute without interfering with one another or reading partial states',
      explanation: 'Isolation ensures that concurrent transactions operate as if they were executed sequentially, preventing dirty reads, non-repeatable reads, and phantom reads.',
    },
    {
      category: 'Programming',
      question: `What is the time complexity of looking up a value by key in a well-balanced Hash Map?`,
      options: [
        'Average O(1), Worst Case O(n)',
        'Always O(log n)',
        'Always O(n^2)',
        'Always O(n log n)',
      ],
      correctOptionIndex: 0,
      answer: 'Average O(1), Worst Case O(n)',
      explanation: 'Hash maps compute bucket indices in O(1) time on average. In the worst case where all keys collide into the same bucket, lookup degrades to O(n).',
    },
    {
      category: 'Architecture',
      question: `Which rate-limiting algorithm uses a fixed capacity counter that drains at a constant continuous rate?`,
      options: [
        'Leaky Bucket Algorithm',
        'Sliding Window Log',
        'Token Bucket with burst allowlist',
        'Exponential Backoff Jitter',
      ],
      correctOptionIndex: 0,
      answer: 'Leaky Bucket Algorithm',
      explanation: 'The Leaky Bucket algorithm processes incoming requests from a queue at a constant rate, smoothing bursty traffic into a predictable egress stream.',
    },
    {
      category: 'Security',
      question: `What HTTP header prevents Cross-Site Scripting (XSS) by restricting the domains from which scripts, styles, and assets can load?`,
      options: [
        'Content-Security-Policy (CSP)',
        'Strict-Transport-Security (HSTS)',
        'X-Frame-Options',
        'Access-Control-Allow-Origin',
      ],
      correctOptionIndex: 0,
      answer: 'Content-Security-Policy (CSP)',
      explanation: 'Content Security Policy (CSP) restricts the resources (JavaScript, CSS, Images) that the browser is allowed to load for a given page, mitigating XSS attacks.',
    },
    {
      category: 'Testing',
      question: `In modern continuous integration, what is a "Canary Deployment"?`,
      options: [
        'Routing a small fraction of real production user traffic (e.g. 5%) to the new release to monitor error metrics',
        'Running all unit tests on a physical bird-themed staging server',
        'Deploying the application exclusively on developer local machines',
        'Terminating all background jobs every 24 hours',
      ],
      correctOptionIndex: 0,
      answer: 'Routing a small fraction of real production user traffic (e.g. 5%) to the new release to monitor error metrics',
      explanation: 'Canary releases gradually roll out new features to a small subset of real users to verify telemetry and error rates before full fleet deployment.',
    },
    {
      category: 'Deployment',
      question: `What does the 12-Factor App methodology recommend for managing application configuration secrets?`,
      options: [
        'Store configuration strictly in environment variables injected at runtime',
        'Hardcode API keys and passwords directly inside git repository source files',
        'Create a public unauthenticated API endpoint that serves passwords',
        'Store secrets inside image EXIF metadata headers',
      ],
      correctOptionIndex: 0,
      answer: 'Store configuration strictly in environment variables injected at runtime',
      explanation: 'Factor III mandates strict separation of config from code, storing configuration in environment variables to enable safe multi-environment deployments.',
    },
    {
      category: 'Technical',
      question: `What is the primary function of a Circuit Breaker pattern in microservice architectures?`,
      options: [
        'Prevent cascading failures by stopping calls to a failing dependency once a threshold of errors is met',
        'Cut power to server racks during electrical surges',
        'Encrypt all incoming WebSocket traffic using TLS 1.3',
        'Automatically compress JSON payloads into gzip streams',
      ],
      correctOptionIndex: 0,
      answer: 'Prevent cascading failures by stopping calls to a failing dependency once a threshold of errors is met',
      explanation: 'Circuit breakers wrap protected calls. If failure rates exceed limits, the circuit opens immediately returning fallbacks and avoiding resource exhaustion.',
    },
    {
      category: 'Programming',
      question: `Which TypeScript utility type constructs a type with all properties of T set to optional?`,
      options: [
        'Partial<T>',
        'Required<T>',
        'Readonly<T>',
        'Record<K, T>',
      ],
      correctOptionIndex: 0,
      answer: 'Partial<T>',
      explanation: 'Partial<T> transforms all property keys in interface T into optional (? :) properties.',
    },
    {
      category: 'Database',
      question: `In PostgreSQL, what is the main purpose of the VACUUM command?`,
      options: [
        'Reclaim storage occupied by dead row versions (tuples) updated or deleted by MVCC',
        'Delete all tables and start a fresh database instance',
        'Format the operating system disk into NTFS',
        'Encrypt existing columns with AES-GCM',
      ],
      correctOptionIndex: 0,
      answer: 'Reclaim storage occupied by dead row versions (tuples) updated or deleted by MVCC',
      explanation: 'PostgreSQL Multi-Version Concurrency Control (MVCC) keeps old row versions on updates/deletes. VACUUM reclaims dead tuple space for future writes.',
    },
    {
      category: 'Architecture',
      question: `What is the main benefit of CQRS (Command Query Responsibility Segregation)?`,
      options: [
        'Separating read operations from write mutations to optimize models and scaling independently',
        'Combining database queries and user interfaces into a single monolithic file',
        'Enforcing synchronous HTTP calls across all frontend components',
        'Removing the need for database backups',
      ],
      correctOptionIndex: 0,
      answer: 'Separating read operations from write mutations to optimize models and scaling independently',
      explanation: 'CQRS splits data modification (Commands) from data retrieval (Queries), allowing read models to use caching or elastic stores while write models maintain ACID compliance.',
    },
    {
      category: 'Security',
      question: `What does the SameSite=Strict cookie attribute prevent?`,
      options: [
        'Cross-Site Request Forgery (CSRF) on cross-origin navigational requests',
        'SQL Injection in server-side stored procedures',
        'DNS Spoofing and ARP poisoning',
        'Buffer overflow vulnerabilities in C libraries',
      ],
      correctOptionIndex: 0,
      answer: 'Cross-Site Request Forgery (CSRF) on cross-origin navigational requests',
      explanation: 'SameSite=Strict prevents the browser from sending the cookie in all cross-site browsing contexts, effectively thwarting CSRF attacks.',
    },
    {
      category: 'Technical',
      question: `What algorithm is used by Git to identify differences between file revisions?`,
      options: [
        'Myers Diff Algorithm',
        'Dijkstra Shortest Path',
        'Bellman-Ford Matrix Algorithm',
        'QuickSort Pivot Comparison',
      ],
      correctOptionIndex: 0,
      answer: 'Myers Diff Algorithm',
      explanation: 'Git uses Eugene Myers O(ND) difference algorithm to compute the shortest edit script (SES) between file revisions efficiently.',
    },
    {
      category: 'Database',
      question: `What is an eventual consistency model in distributed NoSQL databases?`,
      options: [
        'If no new updates are made, all replicas will eventually converge and return the same value',
        'Data is permanently deleted after 24 hours of storage',
        'Every read is guaranteed to return the most recent write instantly across the globe',
        'Transactions only run when the database is completely idle',
      ],
      correctOptionIndex: 0,
      answer: 'If no new updates are made, all replicas will eventually converge and return the same value',
      explanation: 'Eventual consistency guarantees that in the absence of new updates, all distributed replicas will eventually synchronize and return identical data.',
    },
    {
      category: 'Testing',
      question: `What is Mutation Testing in software verification?`,
      options: [
        'Introducing small synthetic bugs (mutants) into source code to check if unit tests catch and fail on them',
        'Modifying the operating system kernel during live user traffic',
        'Altering database passwords randomly to test password recovery',
        'Changing CSS styles dynamically based on user screen width',
      ],
      correctOptionIndex: 0,
      answer: 'Introducing small synthetic bugs (mutants) into source code to check if unit tests catch and fail on them',
      explanation: 'Mutation testing measures the quality and resilience of unit test suites by deliberately injecting faults into source code to verify that test suites "kill" the mutants.',
    },
    {
      category: 'Deployment',
      question: `In Docker and Kubernetes container orchestration, what is a "Liveness Probe"?`,
      options: [
        'A health check that determines if a container is running; if it fails, the container is restarted',
        'A tool that scans source code for copyright violations',
        'A probe that measures internet upload bandwidth in real-time',
        'A software license verification protocol',
      ],
      correctOptionIndex: 0,
      answer: 'A health check that determines if a container is running; if it fails, the container is restarted',
      explanation: 'Kubernetes uses liveness probes to know when to restart a container (e.g. if an app enters a deadlock state and becomes unresponsive).',
    },
  ];

  const questions: VivaQuestionItem[] = [];
  for (let i = 0; i < count; i++) {
    const item = bank[i % bank.length];
    const randomizedOptions = [...item.options];
    // Rotate options deterministically based on index for variation
    const shift = (i + 1) % 4;
    const correctOpt = randomizedOptions[item.correctOptionIndex];
    const rotated = [...randomizedOptions.slice(shift), ...randomizedOptions.slice(0, shift)];
    const newCorrectIdx = rotated.indexOf(correctOpt);

    questions.push({
      id: `mcq-${i + 1}`,
      question: `[Q${i + 1}] ${item.question.replace(/\$\{title\}/g, title)}`,
      options: rotated,
      correctOptionIndex: newCorrectIdx >= 0 ? newCorrectIdx : 0,
      answer: correctOpt,
      explanation: item.explanation,
      difficulty,
      category: item.category,
    });
  }

  return questions;
}
