import { GoogleGenerativeAI } from '@google/generative-ai';
import { SlideItem, PresentationStyle, AIProvider } from '@/lib/types';

export interface GeneratePresentationOptions {
  documentTitle: string;
  documentContent: string;
  slideCount: number;
  style: PresentationStyle;
  provider?: AIProvider;
}

export async function generatePresentationSlides(
  options: GeneratePresentationOptions
): Promise<SlideItem[]> {
  const { documentTitle, documentContent, slideCount, style } = options;
  const count = Math.max(4, Math.min(Number(slideCount) || 8, 15));
  const title = documentTitle.trim() || 'Executive Presentation';
  const content = documentContent.trim() || title;

  const systemPrompt = `You are EasyDoc Presentation AI, a principal keynote architect and executive slide designer.
Create an exceptional ${count}-slide presentation deck in "${style}" style based on the provided document.
Output ONLY a valid JSON array of Slide objects matching this exact schema:
[
  {
    "id": "slide-1",
    "slideNumber": 1,
    "title": "Clear Impactful Title",
    "subtitle": "Short descriptive subtitle or context",
    "bullets": [
      "Key takeaway or engineering insight 1",
      "Key takeaway or engineering insight 2",
      "Key takeaway or engineering insight 3"
    ],
    "layout": "title" | "content" | "split" | "quote" | "stats" | "conclusion",
    "notes": "Concise speaker notes for the presenter during viva/keynote"
  }
]
Rules:
- Slide 1 MUST have layout "title".
- Slide ${count} (the last slide) MUST have layout "conclusion".
- Every slide MUST have an array of 2-4 concise, professional bullet points.
- Return ONLY the raw JSON array. Do not include markdown codeblocks or conversational text.`;

  const userPrompt = `Document Title: ${title}
Presentation Style: ${style}
Requested Slide Count: ${count}

Source Document Text:
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
          temperature: 0.4,
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

  // 3. Robust Deterministic Fallback Generator
  return generateFallbackSlides(title, content, count, style);
}

function extractSlidesJson(text: string): any[] | null {
  if (!text) return null;
  try {
    // Try clean parse first
    const clean = text.replace(/```json|```/g, '').trim();
    const direct = JSON.parse(clean);
    if (Array.isArray(direct)) return direct;
  } catch (e) {
    // Fallback: extract array using regex
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
  const sanitized: SlideItem[] = rawSlides.map((s, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === rawSlides.length - 1;

    let bullets: string[] = [];
    if (Array.isArray(s.bullets)) {
      bullets = s.bullets.map((b: any) => String(b || '').trim()).filter(Boolean);
    } else if (typeof s.bullets === 'string') {
      bullets = [s.bullets.trim()];
    }

    if (bullets.length === 0) {
      bullets = [
        `Key specification and architecture design for ${s.title || 'this section'}`,
        'Modular execution satisfying performance benchmarks',
        'Verified compliance with system standards',
      ];
    }

    return {
      id: s.id || `slide-${idx + 1}-${Date.now()}`,
      slideNumber: idx + 1,
      title: String(s.title || (isFirst ? title : `Slide ${idx + 1}`)).trim(),
      subtitle: s.subtitle ? String(s.subtitle).trim() : undefined,
      bullets,
      layout: (s.layout || (isFirst ? 'title' : isLast ? 'conclusion' : 'content')) as SlideItem['layout'],
      notes: s.notes ? String(s.notes).trim() : `Discuss key technical aspects of ${s.title || 'this slide'}.`,
    };
  });

  return sanitized;
}

function generateFallbackSlides(
  title: string,
  content: string,
  slideCount: number,
  style: PresentationStyle
): SlideItem[] {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const headings = lines
    .filter((l) => l.startsWith('#') || l.startsWith('##') || l.startsWith('###'))
    .map((h) => h.replace(/^[#\s*]+/, '').replace(/[*#]+$/, '').trim())
    .filter(Boolean);

  const defaultSections = [
    { title: title || 'Executive Overview', layout: 'title' as const, subtitle: `A ${style} Presentation created with EasyDoc AI` },
    { title: 'Problem Statement & Motivation', layout: 'content' as const, subtitle: 'Identified challenges and systemic bottlenecks' },
    { title: 'Proposed Solution & Core Architecture', layout: 'split' as const, subtitle: 'High-level component topology and design' },
    { title: 'Technical Stack & Implementation', layout: 'content' as const, subtitle: 'Tools, frameworks, and engineering workflows' },
    { title: 'Key Performance & Benchmark Results', layout: 'stats' as const, subtitle: 'Quantitative metrics and test outcomes' },
    { title: 'Security, Compliance & Scalability', layout: 'content' as const, subtitle: 'Data privacy, authorization, and load capacity' },
    { title: 'Strategic Roadmap & Future Scope', layout: 'content' as const, subtitle: 'Planned features and enhancement phases' },
    { title: 'Summary & Technical Q&A Conclusion', layout: 'conclusion' as const, subtitle: 'Deliverables summary and panel questions' },
  ];

  const targetCount = Math.max(4, Math.min(slideCount, 15));
  const slides: SlideItem[] = [];

  for (let i = 0; i < targetCount; i++) {
    const isFirst = i === 0;
    const isLast = i === targetCount - 1;

    let slideTitle = headings[i] || defaultSections[i % defaultSections.length].title;
    let layout: SlideItem['layout'] = isFirst ? 'title' : isLast ? 'conclusion' : 'content';

    if (isFirst) {
      slides.push({
        id: `slide-${i + 1}`,
        slideNumber: i + 1,
        title: title || 'Project Presentation',
        subtitle: `Professional ${style} Deck • EasyDoc Keynote Studio`,
        bullets: [
          'High-Level Architecture & Technical Defense',
          `Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          'Verified Engineering Standards & Compliance',
        ],
        layout: 'title',
        notes: 'Introduce project objectives, key team members, and high-level agenda.',
      });
    } else if (isLast) {
      slides.push({
        id: `slide-${i + 1}`,
        slideNumber: i + 1,
        title: 'Conclusion & Key Takeaways',
        subtitle: 'Summary of deliverables and outcomes',
        bullets: [
          'Demonstrated high modularity and robust software architecture',
          'Satisfied all performance and security benchmarks',
          'Open for Questions & Technical Discussion (Q&A)',
        ],
        layout: 'conclusion',
        notes: 'Summarize key project achievements and invite questions from the panel.',
      });
    } else {
      slides.push({
        id: `slide-${i + 1}`,
        slideNumber: i + 1,
        title: slideTitle,
        subtitle: 'Key Highlights & Specifications',
        bullets: [
          `Pillar ${i}.1: High-precision engineering workflows tailored for ${style}`,
          `Pillar ${i}.2: Scalable execution and seamless component integration`,
          `Pillar ${i}.3: Verified reliability and compliance checks`,
        ],
        layout,
        notes: `Focus on the technical rationale and operational metrics for ${slideTitle}.`,
      });
    }
  }

  return slides;
}
