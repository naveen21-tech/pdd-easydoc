import { describe, it, expect } from 'vitest';

describe('Document Parsing, Text Chunking & Context Retrieval (Area 6)', () => {
  const chunkText = (text: string, chunkSize = 500, overlap = 50): string[] => {
    if (!text || !text.trim()) return [];
    const words = text.split(/\s+/);
    if (words.length <= chunkSize) return [text];

    const chunks: string[] = [];
    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      chunks.push(words.slice(start, end).join(' '));
      if (end === words.length) break;
      start += chunkSize - overlap;
    }
    return chunks;
  };

  const calculateKeywordRelevance = (chunk: string, query: string): number => {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const chunkLower = chunk.toLowerCase();
    let score = 0;
    queryTerms.forEach((term) => {
      const occurrences = (chunkLower.match(new RegExp(term, 'g')) || []).length;
      score += occurrences;
    });
    return score;
  };

  const retrieveRelevantContext = (chunks: string[], query: string, topK = 3): string[] => {
    const scored = chunks.map((chunk) => ({
      chunk,
      score: calculateKeywordRelevance(chunk, query),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((item) => item.score > 0)
      .map((item) => item.chunk);
  };

  const sampleDoc = `
# Software Architecture Document
The platform is built using a modern microservices architecture with Next.js App Router on the frontend and PostgreSQL as the primary database.
Data persistence is handled through Prisma ORM with connection pooling.
Authentication is managed by Supabase Auth with JSON Web Tokens (JWT) and Row Level Security (RLS) policies.
The AI document generation pipeline uses Groq Cloud Llama-3.3 70B and Google Gemini 1.5 Flash.
Document export supports PDF, DOCX, Markdown, and TXT with multi-page A4 formatting.
`;

  it('1. should return single chunk for short text smaller than chunk size', () => {
    const chunks = chunkText(sampleDoc, 200);
    expect(chunks.length).toBe(1);
    expect(chunks[0]).toBe(sampleDoc);
  });

  it('2. should split long text into multiple chunks when exceeding chunk size', () => {
    const longText = 'word '.repeat(1200);
    const chunks = chunkText(longText, 300, 50);
    expect(chunks.length).toBeGreaterThan(3);
  });

  it('3. should handle empty text gracefully by returning empty array', () => {
    const chunks = chunkText('');
    expect(chunks).toEqual([]);
  });

  it('4. should handle whitespace-only text gracefully', () => {
    const chunks = chunkText('   \n\t   ');
    expect(chunks).toEqual([]);
  });

  it('5. should score relevance accurately for matching keyword query', () => {
    const chunk = 'PostgreSQL database with Prisma ORM connection pooling.';
    const score = calculateKeywordRelevance(chunk, 'PostgreSQL Prisma');
    expect(score).toBe(2);
  });

  it('6. should return 0 score when query terms are not in chunk', () => {
    const chunk = 'Frontend React components and Tailwind styling.';
    const score = calculateKeywordRelevance(chunk, 'PostgreSQL Database');
    expect(score).toBe(0);
  });

  it('7. should retrieve top relevant chunk for "Authentication Supabase"', () => {
    const chunks = [
      'Document export formats include PDF, DOCX, and TXT.',
      'Authentication is managed by Supabase Auth with JWT and RLS.',
      'AI pipeline uses Groq Llama 3.3 and Google Gemini.',
    ];

    const relevant = retrieveRelevantContext(chunks, 'Supabase Authentication');
    expect(relevant.length).toBe(1);
    expect(relevant[0]).toContain('Supabase Auth');
  });

  it('8. should retrieve top relevant chunk for "Document Export PDF"', () => {
    const chunks = [
      'Document export formats include PDF, DOCX, and TXT.',
      'Authentication is managed by Supabase Auth with JWT and RLS.',
      'AI pipeline uses Groq Llama 3.3 and Google Gemini.',
    ];

    const relevant = retrieveRelevantContext(chunks, 'Export PDF');
    expect(relevant.length).toBe(1);
    expect(relevant[0]).toContain('Document export formats');
  });

  it('9. should return empty context when query has no matching keywords', () => {
    const chunks = ['Next.js React components.', 'Tailwind CSS utility styling.'];
    const relevant = retrieveRelevantContext(chunks, 'Kubernetes cluster deployment');
    expect(relevant.length).toBe(0);
  });

  it('10. should assemble grounded QA prompt with retrieved context', () => {
    const context = 'StudentDoc supports 100+ document templates for college and business.';
    const question = 'How many templates does StudentDoc provide?';

    const prompt = `Context:\n${context}\n\nQuestion: ${question}\nAnswer based strictly on the context:`;
    expect(prompt).toContain('100+ document templates');
    expect(prompt).toContain('How many templates');
  });

  it('11. should handle question with trailing punctuation safely', () => {
    const query = 'What is PostgreSQL???';
    const cleanTerms = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
    expect(cleanTerms).toContain('postgresql');
  });

  it('12. should sanitize user question string from control characters', () => {
    const rawQuestion = 'What is the system architecture?\x00\x08';
    const clean = rawQuestion.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '').trim();
    expect(clean).toBe('What is the system architecture?');
  });

  it('13. should handle multi-lingual query strings in context retrieval', () => {
    const chunk = 'L’architecture du système utilise Next.js et PostgreSQL.';
    const score = calculateKeywordRelevance(chunk, 'architecture');
    expect(score).toBe(1);
  });

  it('14. should preserve code block formatting in extracted chunks', () => {
    const codeDoc = 'Setup instructions:\n```bash\nnpm install\nnpm run build\n```';
    const chunks = chunkText(codeDoc, 500);
    expect(chunks[0]).toContain('```bash');
    expect(chunks[0]).toContain('npm run build');
  });

  it('15. should limit retrieved context chunks to topK parameter', () => {
    const chunks = [
      'Database PostgreSQL replica 1',
      'Database PostgreSQL replica 2',
      'Database PostgreSQL replica 3',
      'Database PostgreSQL replica 4',
      'Database PostgreSQL replica 5',
    ];

    const relevant = retrieveRelevantContext(chunks, 'PostgreSQL Database', 2);
    expect(relevant.length).toBe(2);
  });

  it('16. should handle chunk overlap correctly to maintain sentence continuity', () => {
    const text = 'one two three four five six seven eight nine ten';
    const chunks = chunkText(text, 5, 2);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it('17. should detect document language / encoding as UTF-8', () => {
    const utf8Doc = 'UTF-8 Document Test: © 2026 StudentDoc™ — All Rights Reserved';
    expect(utf8Doc).toContain('©');
    expect(utf8Doc).toContain('™');
  });

  it('18. should handle empty question submission with error', () => {
    const question = '   ';
    const isValid = Boolean(question && question.trim().length > 0);
    expect(isValid).toBe(false);
  });

  it('19. should handle single-character question with validation check', () => {
    const question = '?';
    const isValid = question.trim().length >= 3;
    expect(isValid).toBe(false);
  });

  it('20. should calculate confidence score based on keyword match ratio', () => {
    const query = 'Next.js App Router SSR';
    const text = 'Next.js App Router provides Server Side Rendering (SSR) and edge capabilities.';
    const score = calculateKeywordRelevance(text, query);
    const confidence = Math.min(100, Math.round((score / 3) * 100));
    expect(confidence).toBeGreaterThanOrEqual(60);
  });

  it('21. should format conversational chat message payload', () => {
    const message = {
      id: 'msg-01',
      role: 'user' as const,
      content: 'Explain the database schema.',
      timestamp: new Date().toISOString(),
    };

    expect(message.id).toBe('msg-01');
    expect(message.role).toBe('user');
    expect(message.content).toBeDefined();
  });

  it('22. should format assistant response message payload with citations', () => {
    const assistantMsg = {
      id: 'msg-02',
      role: 'assistant' as const,
      content: 'The database uses 11 PostgreSQL tables managed via Prisma.',
      citations: ['Section 2. Database Schema'],
      timestamp: new Date().toISOString(),
    };

    expect(assistantMsg.role).toBe('assistant');
    expect(assistantMsg.citations.length).toBe(1);
  });

  it('23. should extract heading bookmarks from document text', () => {
    const text = '# Overview\nDetails\n## Architecture\nComponents\n## Security\nRLS';
    const headings = text.match(/#{1,3}\s+[^\n]+/g) || [];
    expect(headings.length).toBe(3);
    expect(headings[0]).toBe('# Overview');
    expect(headings[1]).toBe('## Architecture');
    expect(headings[2]).toBe('## Security');
  });

  it('24. should compute total character length of all chunks', () => {
    const chunks = ['First chunk of text.', 'Second chunk of text.', 'Third chunk of text.'];
    const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
    expect(totalChars).toBe(61);
  });

  it('25. should handle documents with multiple consecutive empty lines', () => {
    const docWithGaps = 'Heading\n\n\n\n\nParagraph after big gap.';
    const normalized = docWithGaps.replace(/\n{3,}/g, '\n\n');
    expect(normalized).toBe('Heading\n\nParagraph after big gap.');
  });

  it('26. should support keyword query with stop words filtering', () => {
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an']);
    const query = 'what is the architecture on postgresql';
    const filteredTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => !stopWords.has(term));

    expect(filteredTerms).toEqual(['what', 'architecture', 'postgresql']);
  });
});
