import { AIProvider } from '@/lib/types';
import {
  generateDocumentWithGroq,
  generateFallbackDocument,
  getGroqConfig,
} from '@/lib/ai/groq';

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
 * Main Document Generation Engine: Powered by Groq Cloud LPU AI (llama-3.3-70b-versatile)
 */
export async function generateDocument(
  options: GenerateDocOptions
): Promise<GenerateDocResult> {
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

export { generateFallbackDocument, getGroqConfig };
