import { AIProvider } from '@/lib/types';
import {
  generateDocumentWithGroq,
  getGroqConfig,
} from '@/lib/ai/groq';
import {
  generateDocumentWithGemini,
  getGeminiConfig,
} from '@/lib/ai/gemini';
import {
  generateDocumentWithOpenAI,
  generateFallbackDocument,
  getOpenAIConfig,
} from '@/lib/ai/openai';

export interface GenerateDocOptions {
  provider?: AIProvider;
  title: string;
  templateName?: string;
  tone: string;
  instructions: string;
  referenceContent?: string;
  referenceFileName?: string;
}

export interface GenerateDocResult {
  content: string;
  provider: AIProvider;
  model: string;
  responseTimeMs: number;
  success: boolean;
  error?: string;
}

/**
 * Main Document Generation Engine: Powered by Groq LPU, Google Gemini & OpenAI
 */
export async function generateDocument(
  options: GenerateDocOptions
): Promise<GenerateDocResult> {
  const chosenProvider = options.provider || (process.env.GROQ_API_KEY ? 'groq' : 'gemini');

  if (chosenProvider === 'gemini') {
    const result = await generateDocumentWithGemini({
      title: options.title,
      templateName: options.templateName,
      tone: options.tone,
      instructions: options.instructions,
      referenceContent: options.referenceContent,
      referenceFileName: options.referenceFileName,
    });

    return {
      content: result.content,
      provider: (result.provider || 'gemini') as AIProvider,
      model: result.model,
      responseTimeMs: result.responseTimeMs,
      success: result.success,
      error: result.error,
    };
  }

  if (chosenProvider === 'openai') {
    const result = await generateDocumentWithOpenAI({
      title: options.title,
      templateName: options.templateName,
      tone: options.tone,
      instructions: options.instructions,
      referenceContent: options.referenceContent,
      referenceFileName: options.referenceFileName,
    });

    return {
      content: result.content,
      provider: (result.provider || 'openai') as AIProvider,
      model: result.model,
      responseTimeMs: result.responseTimeMs,
      success: result.success,
      error: result.error,
    };
  }

  if (chosenProvider === 'anthropic') {
    const startTime = Date.now();
    const fallbackContent = generateFallbackDocument(
      options.title,
      options.templateName,
      options.tone,
      options.instructions
    );
    return {
      content: fallbackContent,
      provider: chosenProvider,
      model: `${chosenProvider}-synthesis`,
      responseTimeMs: Date.now() - startTime,
      success: true,
    };
  }

  // Default: High-Speed Groq Engine
  const result = await generateDocumentWithGroq({
    title: options.title,
    templateName: options.templateName,
    tone: options.tone,
    instructions: options.instructions,
    referenceContent: options.referenceContent,
    referenceFileName: options.referenceFileName,
  });

  return {
    content: result.content,
    provider: (result.provider || 'groq') as AIProvider,
    model: result.model,
    responseTimeMs: result.responseTimeMs,
    success: result.success,
    error: result.error,
  };
}

export { generateFallbackDocument, getGroqConfig, getGeminiConfig, getOpenAIConfig };
