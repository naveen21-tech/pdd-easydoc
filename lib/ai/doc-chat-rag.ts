import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';
import { DocumentChunk, DocumentSourceReference, DocChatQueryResponse } from '@/lib/types';

// ============================================================================
// 1. TEXT EXTRACTION FROM BUFFERS
// ============================================================================

export async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: string,
  fileName: string
): Promise<string> {
  const cleanType = fileType.toLowerCase();
  const lowerName = fileName.toLowerCase();

  // TXT or Markdown
  if (cleanType.includes('text') || lowerName.endsWith('.txt') || lowerName.endsWith('.md')) {
    return buffer.toString('utf-8');
  }

  // DOCX via Mammoth
  if (
    cleanType.includes('word') ||
    cleanType.includes('docx') ||
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value.trim();
      }
    } catch (docxErr) {
      console.warn('Mammoth docx extraction error, attempting raw text fallback:', docxErr);
    }
  }

  // PDF via pdf-parse
  if (cleanType.includes('pdf') || lowerName.endsWith('.pdf')) {
    try {
      const pdfParseLib = require('pdf-parse');
      const pdfParseFn = typeof pdfParseLib === 'function' ? pdfParseLib : pdfParseLib.default;
      if (pdfParseFn) {
        const pdfData = await pdfParseFn(buffer);
        if (pdfData.text && pdfData.text.trim().length > 0) {
          return pdfData.text.trim();
        }
      }
    } catch (pdfErr) {
      console.warn('pdf-parse error, attempting stream fallback:', pdfErr);
    }
  }

  // Fallback string extraction for UTF-8 readable streams
  const rawString = buffer.toString('utf-8').replace(/[^\x20-\x7E\t\n\r]/g, ' ');
  if (rawString.trim().length > 50) {
    return rawString.trim();
  }

  throw new Error(
    `Unable to extract text from "${fileName}". Please ensure the file is a valid PDF, DOCX, or TXT file.`
  );
}

// ============================================================================
// 2. INTELLIGENT SEMANTIC CHUNKING
// ============================================================================

export function chunkDocumentText(
  text: string,
  targetWordCount: number = 350,
  overlapWords: number = 50
): DocumentChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Normalize line endings
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split by headings or paragraph boundaries
  const rawParagraphs = normalized.split(/\n\s*\n/);
  const chunks: DocumentChunk[] = [];

  let currentChunkWords: string[] = [];
  let currentSectionTitle = 'General Content';
  let chunkCounter = 1;

  for (const para of rawParagraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Detect section headings
    if (trimmed.startsWith('#') || trimmed.match(/^(section|chapter|unit|part)\s+\d+/i)) {
      const headingText = trimmed.split('\n')[0].replace(/^#+\s*/, '').trim();
      if (headingText.length > 2 && headingText.length < 100) {
        currentSectionTitle = headingText;
      }
    }

    const words = trimmed.split(/\s+/);

    if (currentChunkWords.length + words.length > targetWordCount && currentChunkWords.length > 0) {
      // Finalize current chunk
      const content = currentChunkWords.join(' ');
      chunks.push({
        id: `chunk-${chunkCounter}`,
        chunkIndex: chunkCounter,
        sectionTitle: currentSectionTitle,
        content,
        wordCount: currentChunkWords.length,
      });
      chunkCounter++;

      // Retain sliding overlap
      const overlap = currentChunkWords.slice(-overlapWords);
      currentChunkWords = [...overlap, ...words];
    } else {
      currentChunkWords.push(...words);
    }
  }

  // Add remainder
  if (currentChunkWords.length > 0) {
    chunks.push({
      id: `chunk-${chunkCounter}`,
      chunkIndex: chunkCounter,
      sectionTitle: currentSectionTitle,
      content: currentChunkWords.join(' '),
      wordCount: currentChunkWords.length,
    });
  }

  return chunks;
}

// ============================================================================
// 3. SEMANTIC & KEYWORD RELEVANCE RETRIEVAL (BM25 / TF-IDF SIMULATION)
// ============================================================================

export function retrieveRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  topK: number = 4
): DocumentSourceReference[] {
  if (!chunks || chunks.length === 0) return [];
  if (!query || query.trim().length === 0) {
    return chunks.slice(0, topK).map((c) => ({
      chunkIndex: c.chunkIndex,
      sectionTitle: c.sectionTitle,
      snippet: c.content.slice(0, 200) + '...',
      relevanceScore: 1.0,
    }));
  }

  // Tokenize & sanitize query
  const queryTokens = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const scoredChunks = chunks.map((chunk) => {
    const contentLower = chunk.content.toLowerCase();
    const sectionLower = chunk.sectionTitle.toLowerCase();
    let score = 0;

    // Exact phrase match boost
    if (contentLower.includes(query.toLowerCase())) {
      score += 15;
    }

    // Token frequency & section relevance
    for (const token of queryTokens) {
      if (sectionLower.includes(token)) {
        score += 8; // Heavy boost for section title match
      }

      const regex = new RegExp(`\\b${token}\\b`, 'gi');
      const matches = contentLower.match(regex);
      if (matches) {
        score += Math.min(matches.length * 2, 10);
      }
    }

    return {
      chunk,
      score,
    };
  });

  // Sort by highest relevance score
  scoredChunks.sort((a, b) => b.score - a.score);

  // If no strong keyword match, take the first topK chunks to ensure context is provided
  const selected = scoredChunks.slice(0, topK);

  return selected.map((item) => ({
    chunkIndex: item.chunk.chunkIndex,
    sectionTitle: item.chunk.sectionTitle,
    snippet: item.chunk.content.length > 280 ? item.chunk.content.slice(0, 280) + '...' : item.chunk.content,
    relevanceScore: Math.round(item.score * 10) / 10,
  }));
}

// ============================================================================
// 4. SUGGESTED QUESTIONS GENERATOR
// ============================================================================

export function generateSuggestedQuestions(
  documentTitle: string,
  chunks: DocumentChunk[]
): string[] {
  const questions: string[] = [];

  // Question 1: Executive Summary
  questions.push(`Summarize the key objectives and findings in "${documentTitle}".`);

  // Question 2 & 3: Section specific questions
  const uniqueSections = Array.from(
    new Set(chunks.map((c) => c.sectionTitle).filter((s) => s && s !== 'General Content'))
  );

  if (uniqueSections.length > 0) {
    questions.push(`What are the main details covered in ${uniqueSections[0]}?`);
  } else {
    questions.push('What are the main technical requirements or specifications?');
  }

  if (uniqueSections.length > 1) {
    questions.push(`Explain the methodology or workflow described in ${uniqueSections[1]}.`);
  } else {
    questions.push('What are the critical conclusions or action items mentioned?');
  }

  // Question 4: Specific extraction
  questions.push('What are the key trade-offs, constraints, or challenges highlighted in this document?');

  return questions.slice(0, 4);
}

// ============================================================================
// 5. GROUNDED QUESTION-ANSWERING SYNTHESIS
// ============================================================================

const NOT_AVAILABLE_RESPONSE = 'This information is not available in the uploaded document.';

export async function answerDocumentQuery(params: {
  question: string;
  documentTitle: string;
  chunks: DocumentChunk[];
  chatHistory?: { role: string; content: string }[];
}): Promise<DocChatQueryResponse> {
  const { question, documentTitle, chunks, chatHistory = [] } = params;

  // 1. Retrieve most relevant context chunks
  const relevantSources = retrieveRelevantChunks(question, chunks, 4);
  const relevantChunksContent = relevantSources
    .map(
      (s) =>
        `[CHUNK #${s.chunkIndex} | SECTION: ${s.sectionTitle}]\n${
          chunks.find((c) => c.chunkIndex === s.chunkIndex)?.content || s.snippet
        }`
    )
    .join('\n\n---\n\n');

  // Grounding System Prompt
  const systemPrompt = `You are EasyDoc Document Chat AI, a precise, factual, and strictly grounded Document Question Answering Assistant.

CRITICAL GROUNDING RULES:
1. Answer the user's question using ONLY the provided Document Context Chunks from "${documentTitle}".
2. If the answer cannot be factually and directly found or deduced from the provided chunks, you MUST respond EXACTLY with:
"${NOT_AVAILABLE_RESPONSE}"
3. Do NOT make assumptions, extrapolate without evidence, or introduce external knowledge not present in the document.
4. Whenever you state a fact or finding from the text, cite the source in brackets, e.g. "[Section: ${relevantSources[0]?.sectionTitle || 'Overview'}, Chunk #${relevantSources[0]?.chunkIndex || 1}]".
5. Provide clear, structured, readable markdown answers with bullet points where appropriate.`;

  const userPrompt = `DOCUMENT CONTEXT CHUNKS:
${relevantChunksContent}

USER QUESTION:
${question}

Provide a direct, grounded answer with citations based strictly on the context chunks above. If the context does not contain the answer, reply with "${NOT_AVAILABLE_RESPONSE}".`;

  // 1. Try Groq AI
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'mock-key' && !groqKey.includes('your-groq-key')) {
    try {
      const messages: any[] = [{ role: 'system', content: systemPrompt }];

      // Include last 2 conversation turns for contextual follow-ups
      if (chatHistory.length > 0) {
        const recentHistory = chatHistory.slice(-4);
        for (const h of recentHistory) {
          messages.push({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.content,
          });
        }
      }

      messages.push({ role: 'user', content: userPrompt });

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages,
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          const isAvailable = !text.includes(NOT_AVAILABLE_RESPONSE);
          return {
            success: true,
            answer: text,
            relevantSources: isAvailable ? relevantSources : [],
            isAvailable,
          };
        }
      }
    } catch (e) {
      console.warn('Groq doc-chat fallback:', e);
    }
  }

  // 2. Try Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'mock-key' && !geminiKey.includes('your-gemini-key')) {
    try {
      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const res = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const text = res.response.text()?.trim();
      if (text) {
        const isAvailable = !text.includes(NOT_AVAILABLE_RESPONSE);
        return {
          success: true,
          answer: text,
          relevantSources: isAvailable ? relevantSources : [],
          isAvailable,
        };
      }
    } catch (e) {
      console.warn('Gemini doc-chat fallback:', e);
    }
  }

  // 3. Fallback Extractive Synthesizer
  return fallbackExtractiveAnswer(question, relevantSources, chunks);
}

function fallbackExtractiveAnswer(
  question: string,
  sources: DocumentSourceReference[],
  chunks: DocumentChunk[]
): DocChatQueryResponse {
  if (!sources || sources.length === 0 || !chunks || chunks.length === 0) {
    return {
      success: true,
      answer: NOT_AVAILABLE_RESPONSE,
      relevantSources: [],
      isAvailable: false,
    };
  }

  const queryTerms = question
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  const matchedSentences: { sentence: string; chunk: DocumentChunk; score: number }[] = [];

  for (const src of sources) {
    const chunk = chunks.find((c) => c.chunkIndex === src.chunkIndex);
    if (!chunk) continue;

    const sentences = chunk.content.split(/(?<=[.?!])\s+/);
    for (const s of sentences) {
      const sLower = s.toLowerCase();
      let matchCount = 0;
      for (const t of queryTerms) {
        if (sLower.includes(t)) matchCount++;
      }
      if (matchCount > 0) {
        matchedSentences.push({ sentence: s.trim(), chunk, score: matchCount });
      }
    }
  }

  matchedSentences.sort((a, b) => b.score - a.score);

  if (matchedSentences.length === 0) {
    return {
      success: true,
      answer: NOT_AVAILABLE_RESPONSE,
      relevantSources: [],
      isAvailable: false,
    };
  }

  const topSentences = matchedSentences.slice(0, 3);
  const formattedAnswer = topSentences
    .map((item) => `• ${item.sentence} *[Section: ${item.chunk.sectionTitle}, Chunk #${item.chunk.chunkIndex}]*`)
    .join('\n\n');

  return {
    success: true,
    answer: `Based on the document context:\n\n${formattedAnswer}`,
    relevantSources: sources.slice(0, 2),
    isAvailable: true,
  };
}

const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'that', 'to', 'for', 'of', 'with', 'as',
  'by', 'from', 'about', 'what', 'who', 'where', 'when', 'how', 'why', 'can', 'you', 'tell', 'me',
  'does', 'this', 'document', 'give', 'show', 'explain', 'are', 'was', 'were', 'been',
]);
