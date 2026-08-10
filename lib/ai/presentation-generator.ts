import { GoogleGenerativeAI } from '@google/generative-ai';
import { SlideItem, PresentationStyle, AIProvider } from '@/lib/types';

export interface GeneratePresentationOptions {
  documentTitle: string;
  documentContent: string;
  slideCount: number;
  style: PresentationStyle;
  provider?: AIProvider;
}

export interface EnhanceSlideOptions {
  deckTitle: string;
  slideTitle: string;
  currentBullets?: string[];
  style?: PresentationStyle;
}

export async function generatePresentationSlides(
  options: GeneratePresentationOptions
): Promise<SlideItem[]> {
  const { documentTitle, documentContent, slideCount, style } = options;
  const count = Math.max(4, Math.min(Number(slideCount) || 8, 15));
  const title = (documentTitle || '').trim() || 'Software Architecture & System Design';
  const content = (documentContent || '').trim() || title;

  const systemPrompt = `You are EasyDoc Presentation AI, a principal keynote architect and domain specialist.
Generate a rich, substantive, technical, and highly detailed ${count}-slide presentation deck in "${style}" style based on the topic and document.

CRITICAL CONTENT QUALITY RULES:
1. NO GENERIC PLACEHOLDERS. Never output filler text like "Pillar 1.1", "Key feature", or vague statements.
2. Provide specific, insightful bullet points containing real technical terms, architecture layers, algorithms, metrics, protocols, tools, and quantified outcomes relevant to "${title}".
3. Every slide MUST contain 3 to 4 detailed, informative bullet points that explain the concepts thoroughly.
4. Structure the deck logically:
   - Slide 1: layout "title" (Compelling Title, Context Subtitle, High-Level Pillars)
   - Slide 2: Problem Statement, Inefficiencies & Background
   - Slide 3: Proposed Architecture & Conceptual Model
   - Slide 4: Technology Stack, Frameworks & Tooling
   - Slide 5: Core Implementation, Workflow & Algorithms
   - Slide 6: Performance Benchmarks, Latency & Quantitative Results
   - Slide 7: Security, Scalability & Fault Tolerance
   - Slide ${count}: layout "conclusion" (Strategic Deliverables, Impact & Technical Q&A)
5. Include actionable presenter speaker notes for every slide.

Output ONLY a valid JSON array conforming to this schema:
[
  {
    "id": "slide-1",
    "slideNumber": 1,
    "title": "Precise Slide Title",
    "subtitle": "Informative subtitle with context",
    "bullets": [
      "Deep technical point explaining key mechanism with real terms",
      "Quantitative benchmark or architectural rationale",
      "Integration or workflow outcome"
    ],
    "layout": "title" | "content" | "split" | "quote" | "stats" | "conclusion",
    "notes": "Clear speaking notes for the presenter"
  }
]
Return ONLY raw JSON.`;

  const userPrompt = `Presentation Topic / Title: ${title}
Presentation Style: ${style}
Target Slide Count: ${count}

Source Document / Context:
${content.slice(0, 8000)}`;

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
        const parsed = extractSlidesJson(raw);
        if (parsed && parsed.length > 0) {
          return sanitizeSlides(parsed, title, style, count);
        }
      }
    } catch (e) {
      console.warn('Groq presentation parsing fallback:', e);
    }
  }

  // 2. Try Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'mock-key' && !geminiKey.includes('your-gemini-key')) {
    try {
      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const res = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const rawText = res.response.text();
      const parsed = extractSlidesJson(rawText);
      if (parsed && parsed.length > 0) {
        return sanitizeSlides(parsed, title, style, count);
      }
    } catch (e) {
      console.warn('Gemini presentation parsing fallback:', e);
    }
  }

  // 3. Domain-Aware Synthesis Engine
  return generateDomainAwareSlides(title, content, count, style);
}

export async function enhanceSlideContent(
  options: EnhanceSlideOptions
): Promise<{ title: string; subtitle: string; bullets: string[]; notes: string }> {
  const { deckTitle, slideTitle, style = 'Academic' } = options;

  const systemPrompt = `You are EasyDoc Presentation AI. Generate 3-4 detailed, high-impact, technical bullet points and speaker notes for a slide titled "${slideTitle}" in a presentation about "${deckTitle}".
Output ONLY valid JSON:
{
  "title": "${slideTitle}",
  "subtitle": "Informative subtitle",
  "bullets": [
    "Detailed point 1 with real domain concepts",
    "Detailed point 2 with architecture/methodology details",
    "Detailed point 3 with metrics or outcomes"
  ],
  "notes": "Speaker notes for the presenter"
}`;

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
          messages: [{ role: 'system', content: systemPrompt }],
          temperature: 0.5,
          max_tokens: 1000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || '';
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed.bullets) && parsed.bullets.length > 0) {
            return {
              title: parsed.title || slideTitle,
              subtitle: parsed.subtitle || 'Technical Overview',
              bullets: parsed.bullets,
              notes: parsed.notes || `Key discussion points for ${slideTitle}.`,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Groq enhance slide error:', e);
    }
  }

  // Fallback enhanced bullets
  const domain = detectDomain(deckTitle + ' ' + slideTitle);
  const bullets = generateDomainBullets(slideTitle, domain, deckTitle);

  return {
    title: slideTitle,
    subtitle: `Key Architecture & Implementation Scope`,
    bullets,
    notes: `Explain the foundational design principles and execution milestones for ${slideTitle}.`,
  };
}

function extractSlidesJson(text: string): any[] | null {
  if (!text) return null;
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const direct = JSON.parse(clean);
    if (Array.isArray(direct)) return direct;
  } catch (e) {
    const match = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      try {
        const extracted = JSON.parse(match[0]);
        if (Array.isArray(extracted)) return extracted;
      } catch (err) {
        console.warn('Regex JSON parse error:', err);
      }
    }
  }
  return null;
}

function sanitizeSlides(
  rawSlides: any[],
  title: string,
  style: PresentationStyle,
  targetCount: number
): SlideItem[] {
  const domain = detectDomain(title);

  const sanitized: SlideItem[] = rawSlides.map((s, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === rawSlides.length - 1;

    let bullets: string[] = [];
    if (Array.isArray(s.bullets)) {
      bullets = s.bullets
        .map((b: any) => String(b || '').trim())
        .filter((b: string) => b.length > 0 && !b.startsWith('Pillar ') && !b.startsWith('Key specification'));
    } else if (typeof s.bullets === 'string' && s.bullets.trim()) {
      bullets = [s.bullets.trim()];
    }

    // If bullets were empty or generic, synthesize rich domain bullets
    if (bullets.length === 0) {
      bullets = generateDomainBullets(s.title || `Slide ${idx + 1}`, domain, title);
    }

    return {
      id: s.id || `slide-${idx + 1}-${Date.now()}`,
      slideNumber: idx + 1,
      title: String(s.title || (isFirst ? title : `Key Focus Area ${idx + 1}`)).trim(),
      subtitle: s.subtitle ? String(s.subtitle).trim() : undefined,
      bullets,
      layout: (s.layout || (isFirst ? 'title' : isLast ? 'conclusion' : 'content')) as SlideItem['layout'],
      notes: s.notes ? String(s.notes).trim() : `Discuss key technical aspects of ${s.title || 'this slide'}.`,
    };
  });

  return sanitized;
}

type DomainType = 'ai' | 'cloud' | 'security' | 'health' | 'fintech' | 'web' | 'iot' | 'data' | 'general';

function detectDomain(text: string): DomainType {
  const t = text.toLowerCase();
  if (t.includes('ai') || t.includes('learning') || t.includes('neural') || t.includes('gpt') || t.includes('llm') || t.includes('vision') || t.includes('nlp')) {
    return 'ai';
  }
  if (t.includes('cloud') || t.includes('microservice') || t.includes('kubernetes') || t.includes('docker') || t.includes('aws') || t.includes('serverless') || t.includes('distributed')) {
    return 'cloud';
  }
  if (t.includes('security') || t.includes('crypto') || t.includes('blockchain') || t.includes('auth') || t.includes('cyber') || t.includes('threat') || t.includes('vulnerability')) {
    return 'security';
  }
  if (t.includes('health') || t.includes('medical') || t.includes('clinical') || t.includes('patient') || t.includes('bio') || t.includes('hospital')) {
    return 'health';
  }
  if (t.includes('fintech') || t.includes('bank') || t.includes('payment') || t.includes('finance') || t.includes('trade') || t.includes('stock')) {
    return 'fintech';
  }
  if (t.includes('web') || t.includes('react') || t.includes('next') || t.includes('frontend') || t.includes('full stack') || t.includes('api') || t.includes('mobile') || t.includes('app')) {
    return 'web';
  }
  if (t.includes('iot') || t.includes('sensor') || t.includes('robot') || t.includes('embedded') || t.includes('hardware') || t.includes('smart')) {
    return 'iot';
  }
  if (t.includes('data') || t.includes('analytics') || t.includes('pipeline') || t.includes('warehouse') || t.includes('bi') || t.includes('etl')) {
    return 'data';
  }
  return 'general';
}

function generateDomainBullets(slideTitle: string, domain: DomainType, deckTitle: string): string[] {
  const st = slideTitle.toLowerCase();

  if (st.includes('problem') || st.includes('motivation') || st.includes('challenge')) {
    if (domain === 'ai') {
      return [
        'High computational latency and token cost when deploying large-scale neural models in production',
        'Data drift and degraded generalization accuracy across heterogeneous edge distributions',
        'Lack of explainable interpretability creating compliance barriers in mission-critical applications',
      ];
    } else if (domain === 'cloud') {
      return [
        'Monolithic architectures fail to scale horizontally under unpredictable peak transaction spikes',
        'Cascading network failures and high p99 latency across unoptimized inter-service RPC calls',
        'Over-provisioned infrastructure causing 35%+ cloud expenditure waste without SLA guarantees',
      ];
    } else if (domain === 'security') {
      return [
        'Rapidly expanding attack surfaces across distributed APIs and decoupled cloud endpoints',
        'Vulnerability to zero-day injection attacks, unauthorized privilege escalation, and data exfiltration',
        'Inadequate audit trail integrity leading to non-compliance with strict regulatory standards',
      ];
    } else if (domain === 'health') {
      return [
        'Fragmented patient health records siloed across incompatible legacy EHR/EMR databases',
        'Diagnostic delays caused by manual screening of multi-gigabyte medical imaging scans',
        'Strict HIPAA/GDPR constraints hindering collaborative clinical research without privacy guarantees',
      ];
    }
    return [
      `Existing legacy systems lack modern automation, creating throughput bottlenecks in ${deckTitle}`,
      'High maintenance overhead, recurring manual errors, and suboptimal data synchronization',
      'Inability to provide real-time visibility, security compliance, and multi-tenant scalability',
    ];
  }

  if (st.includes('architecture') || st.includes('solution') || st.includes('topology') || st.includes('design')) {
    if (domain === 'ai') {
      return [
        'Multi-tiered pipeline orchestrating embedding generation, vector indexing, and transformer inference',
        'Quantized model weights (INT8/FP16) optimized for high-throughput GPU/TPU acceleration',
        'Asynchronous response streaming with fallback routing ensuring 99.9% inference availability',
      ];
    } else if (domain === 'cloud') {
      return [
        'Event-driven microservices architecture communicating via Kafka / RabbitMQ message brokers',
        'Stateful caching layer with Redis clusters reducing primary database load by up to 75%',
        'Kubernetes ingress controllers with automated pod autoscaling and blue-green zero-downtime deployments',
      ];
    } else if (domain === 'security') {
      return [
        'Zero-Trust security model enforcing granular RBAC and JWT cryptographic token verification',
        'End-to-end payload encryption utilizing AES-256-GCM and automated TLS 1.3 certificate rotation',
        'Immutable cryptographic audit ledger capturing all administrative events with SHA-256 hashing',
      ];
    }
    return [
      `Modular, layered architecture designed specifically for high-reliability ${deckTitle}`,
      'Decoupled presentation, business logic, and persistent storage tiers ensuring high maintainability',
      'Asynchronous task queues handling compute-intensive background workloads without UI blocking',
    ];
  }

  if (st.includes('tech') || st.includes('stack') || st.includes('tool') || st.includes('framework')) {
    if (domain === 'ai') {
      return [
        'Core ML Engines: PyTorch, Hugging Face Transformers, ONNX Runtime, and TensorRT',
        'Orchestration & Data: LangChain, LlamaIndex, Pinecone / pgvector, and FastAPI backends',
        'Inference Infrastructure: Groq LPU acceleration, Google Vertex AI, and Docker containerization',
      ];
    } else if (domain === 'cloud' || domain === 'web') {
      return [
        'Frontend & Presentation: Next.js 14 App Router, React 18, Tailwind CSS, and TypeScript',
        'Backend & Database: Node.js runtime, Prisma ORM, PostgreSQL with connection pooling, and Redis',
        'Cloud & CI/CD: Vercel Edge Network, Supabase Backend-as-a-Service, and GitHub Actions automation',
      ];
    } else if (domain === 'security') {
      return [
        'Cryptography: Web Crypto API, OpenSSL, Argon2 password hashing, and OAuth 2.0 / OIDC',
        'Scanning & Monitoring: OWASP ZAP automated security scanners, SonarQube static analysis, and Sentry',
        'Storage: Encrypted PostgreSQL with row-level security (RLS) policies and automated key rotation',
      ];
    }
    return [
      'Frontend: Next.js, React, Tailwind CSS, TypeScript for responsive, accessible user interfaces',
      'Backend & Services: RESTful / GraphQL APIs, Node.js, Prisma ORM, PostgreSQL, and Redis cache',
      'DevOps & Infrastructure: Docker containers, GitHub Actions CI/CD pipeline, and Cloud deployment',
    ];
  }

  if (st.includes('result') || st.includes('performance') || st.includes('metric') || st.includes('benchmark')) {
    return [
      'Reduced average end-to-end response latency from 1.4s down to ~280ms under standard production load',
      'Achieved 99.95% system uptime with zero data corruption across 50,000+ benchmarked operations',
      'Improved resource utilization efficiency by 42%, lowering compute costs while maintaining SLA compliance',
    ];
  }

  if (st.includes('security') || st.includes('scalability') || st.includes('compliance')) {
    return [
      'Role-based access control (RBAC) with row-level security preventing cross-tenant data leaks',
      'Horizontal auto-scaling configured to handle 10x traffic spikes with automatic pod balancing',
      'Full compliance with ISO 27001, SOC 2, and data protection guidelines with continuous vulnerability scanning',
    ];
  }

  if (st.includes('conclusion') || st.includes('summary') || st.includes('takeaway') || st.includes('q&a')) {
    return [
      `Successfully delivered complete architectural and functional implementation of ${deckTitle}`,
      'Demonstrated high modularity, empirical performance gains, and verified enterprise reliability',
      'Established roadmap for multi-region deployment and advanced telemetry integrations',
      'Thank you for your time — Open for Questions and Technical Discussion (Q&A)',
    ];
  }

  return [
    `Engineered robust, production-grade workflows tailored specifically to ${slideTitle}`,
    `Integrated multi-tiered validation ensuring data integrity and seamless component communication`,
    `Optimized for sub-second execution with end-to-end monitoring and error recovery protocols`,
  ];
}

function generateDomainAwareSlides(
  title: string,
  content: string,
  slideCount: number,
  style: PresentationStyle
): SlideItem[] {
  const domain = detectDomain(title + ' ' + content);
  const targetCount = Math.max(4, Math.min(slideCount, 15));

  const slideTemplates = [
    { title: title, subtitle: `Executive Technical Presentation • ${style} Theme`, layout: 'title' as const },
    { title: 'Executive Summary & Background', subtitle: 'Project context, core objectives, and stakeholder value', layout: 'content' as const },
    { title: 'Problem Statement & Existing Gaps', subtitle: 'Critical bottlenecks and architectural challenges identified', layout: 'content' as const },
    { title: 'Proposed System Architecture', subtitle: 'Modular component design, data flow, and conceptual topology', layout: 'split' as const },
    { title: 'Core Technology Stack & Tooling', subtitle: 'Languages, frameworks, databases, and infrastructure choices', layout: 'content' as const },
    { title: 'Implementation Details & Key Workflows', subtitle: 'Step-by-step operational mechanisms and algorithm pipelines', layout: 'content' as const },
    { title: 'Performance Metrics & Benchmark Results', subtitle: 'Measured throughput, latency improvements, and stress testing', layout: 'stats' as const },
    { title: 'Security, Scalability & Compliance', subtitle: 'Zero-trust authorization, data encryption, and horizontal scaling', layout: 'content' as const },
    { title: 'Strategic Roadmap & Future Scope', subtitle: 'Upcoming engineering phases, features, and platform expansion', layout: 'content' as const },
    { title: 'Summary & Technical Q&A Defense', subtitle: 'Final project deliverables summary and panel discussion', layout: 'conclusion' as const },
  ];

  const slides: SlideItem[] = [];

  for (let i = 0; i < targetCount; i++) {
    const isFirst = i === 0;
    const isLast = i === targetCount - 1;

    let tpl = slideTemplates[i % slideTemplates.length];
    if (isFirst) {
      tpl = slideTemplates[0];
    } else if (isLast) {
      tpl = slideTemplates[slideTemplates.length - 1];
    }

    const bullets = generateDomainBullets(tpl.title, domain, title);

    slides.push({
      id: `slide-${i + 1}`,
      slideNumber: i + 1,
      title: isFirst ? title : tpl.title,
      subtitle: tpl.subtitle,
      bullets,
      layout: isFirst ? 'title' : isLast ? 'conclusion' : tpl.layout,
      notes: isFirst
        ? `Introduce ${title}, outline the main agenda, and set expectations for the presentation.`
        : isLast
        ? `Summarize key deliverables of ${title} and invite questions from the audience or examination committee.`
        : `Walk the audience through ${tpl.title}, emphasizing technical decisions and architectural advantages.`,
    });
  }

  return slides;
}
