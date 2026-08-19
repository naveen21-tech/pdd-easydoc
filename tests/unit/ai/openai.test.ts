import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getOpenAIConfig,
  generateWithOpenAI,
  generateDocumentWithOpenAI,
  generateMcqsWithOpenAI,
  generateFallbackDocument,
  generateFallbackMcqs,
  checkOpenAIHealth,
} from '@/lib/ai/openai';

describe('Centralized OpenAI AI Engine Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.OPENAI_API_KEY = 'sk-test-openai-key-12345';
    process.env.OPENAI_MODEL = 'gpt-4o-mini';
    process.env.OPENAI_TIMEOUT_MS = '12000';
  });

  describe('OpenAI Configuration', () => {
    it('1. should properly load OpenAI configuration from environment variables', () => {
      const config = getOpenAIConfig();
      expect(config.apiKey).toBe('sk-test-openai-key-12345');
      expect(config.model).toBe('gpt-4o-mini');
      expect(config.timeoutMs).toBe(12000);
    });

    it('2. should use default model gpt-4o-mini when OPENAI_MODEL is not set', () => {
      delete process.env.OPENAI_MODEL;
      const config = getOpenAIConfig();
      expect(config.model).toBe('gpt-4o-mini');
    });
  });

  describe('Prompt Completions with OpenAI', () => {
    it('3. should generate completions via OpenAI API', async () => {
      const mockOpenAIResponse = {
        choices: [
          {
            message: {
              content: 'Photosynthesis is the process by which green plants convert sunlight into chemical energy.',
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpenAIResponse,
      } as any);

      const res = await generateWithOpenAI({
        prompt: 'What is photosynthesis?',
        system: 'You are a biology teacher.',
        task: 'general',
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe('openai');
      expect(res.text).toContain('Photosynthesis');
    });

    it('4. should fall back cleanly when OpenAI API returns rate-limit (429)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      } as any);

      const res = await generateWithOpenAI({
        prompt: 'Document Title: Photosynthesis in Plants',
        task: 'document',
      });

      expect(res.success).toBe(true);
      expect(res.text).toContain('Photosynthesis in Plants');
    });
  });

  describe('Document Generation with OpenAI', () => {
    it('5. should generate a structured multi-page document using OpenAI', async () => {
      const mockContent = `# Quantum Computing Architecture\n\n## 1. Executive Summary\nQuantum computing leverages qubits...`;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockContent } }],
        }),
      } as any);

      const doc = await generateDocumentWithOpenAI({
        title: 'Quantum Computing Architecture',
        templateName: 'Technical Specification',
        tone: 'Professional',
        instructions: 'Detail superconducting qubits and fault-tolerant error correction.',
      });

      expect(doc.success).toBe(true);
      expect(doc.provider).toBe('openai');
      expect(doc.content).toContain('Quantum Computing Architecture');
    });
  });

  describe('MCQ & Examination Generation with OpenAI', () => {
    it('6. should generate 4-choice MCQs with proper A-D options using OpenAI', async () => {
      const mockMcqJson = JSON.stringify({
        questions: [
          {
            question: 'What is the primary carrier of genetic information in cells?',
            optionA: 'DNA',
            optionB: 'Hemoglobin',
            optionC: 'Insulin',
            optionD: 'Cellulose',
            correctOption: 'A',
            marks: 1,
          },
          {
            question: 'Which organelle is known as the powerhouse of the cell?',
            optionA: 'Nucleus',
            optionB: 'Mitochondria',
            optionC: 'Ribosome',
            optionD: 'Endoplasmic Reticulum',
            correctOption: 'B',
            marks: 1,
          },
        ],
      });

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockMcqJson } }],
        }),
      } as any);

      const result = await generateMcqsWithOpenAI({
        topic: 'Cell Biology',
        count: 2,
        difficulty: 'intermediate',
      });

      expect(result.success).toBe(true);
      expect(result.questions.length).toBe(2);
      expect(result.questions[0].question).toContain('genetic information');
      expect(result.questions[0].correctOption).toBe('A');
      expect(result.questions[1].correctOption).toBe('B');
    });
  });

  describe('OpenAI Service Health Check', () => {
    it('7. should report healthy when OpenAI API models endpoint is reachable', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'gpt-4o-mini' }] }),
      } as any);

      const health = await checkOpenAIHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.provider).toBe('openai');
    });

    it('8. should report unhealthy when OPENAI_API_KEY is not set', async () => {
      delete process.env.OPENAI_API_KEY;
      const health = await checkOpenAIHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.error).toContain('OPENAI_API_KEY is not configured');
    });
  });
});
