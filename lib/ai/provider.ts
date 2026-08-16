import { AIProvider } from '@/lib/types';
import {
  generateDocumentWithOllama,
  generateFallbackDocument,
  getOllamaConfig,
} from '@/lib/ai/ollama';

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
 * Main Document Generation Engine: Powered by Centralized Ollama LLM Service (llama3.2)
 */
export async function generateDocument(
  options: GenerateDocOptions
): Promise<GenerateDocResult> {
  const result = await generateDocumentWithOllama({
    title: options.title,
    templateName: options.templateName,
    tone: options.tone,
    instructions: options.instructions,
    referenceContent: options.referenceContent,
    referenceFileName: options.referenceFileName,
  });

  return {
    content: result.content,
    provider: 'ollama' as AIProvider,
    model: result.model,
    responseTimeMs: result.responseTimeMs,
    success: result.success,
    error: result.error,
  };
}

export { generateFallbackDocument };
