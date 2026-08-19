import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getGroqConfig,
  generateWithGroq,
  generateDocumentWithGroq,
  generateMcqsWithGroq,
  generateFallbackDocument,
  generateFallbackMcqs,
  checkGroqHealth,
} from '@/lib/ai/groq';

describe('Centralized Groq Cloud AI Engine Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = 'gsk_test_api_key_12345';
    process.env.GROQ_MODEL = 'llama-3.3-70b-versatile';
    process.env.GROQ_TIMEOUT_MS = '12000';
  });

  describe('Groq Configuration', () => {
    it('1. should properly load Groq configuration from environment variables', () => {
      const config = getGroqConfig();
      expect(config.apiKey).toBe('gsk_test_api_key_12345');
      expect(config.model).toBe('llama-3.3-70b-versatile');
      expect(config.timeoutMs).toBe(12000);
    });

    it('2. should use default model llama-3.3-70b-versatile when GROQ_MODEL is not set', () => {
      delete process.env.GROQ_MODEL;
      const config = getGroqConfig();
      expect(config.model).toBe('llama-3.3-70b-versatile');
    });
  });

  describe('Prompt Completions with Groq', () => {
    it('3. should generate completions via Groq Cloud API', async () => {
      const mockGroqResponse = {
        choices: [
          {
            message: {
              content: '### Distributed Systems Architecture\nDistributed systems partition state across nodes.',
            },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGroqResponse,
      } as any);

      const res = await generateWithGroq({
        prompt: 'Explain distributed systems architecture',
        system: 'You are an engineering specialist',
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe('groq');
      expect(res.model).toBe('llama-3.3-70b-versatile');
      expect(res.text).toContain('Distributed Systems Architecture');
    });

    it('4. should fall back to zero-failure synthesis when Groq API returns rate-limit (429)', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => 'Rate limit reached. Please wait.',
      } as any);

      const res = await generateWithGroq({
        prompt: 'Microservices Reliability Engineering',
      });

      expect(res.success).toBe(true);
      expect(res.text).toBeDefined();
      expect(res.text.length).toBeGreaterThan(50);
      expect(res.model).toContain('synthesis');
    });

    it('5. should fall back cleanly when Groq API network connection fails', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network connection timeout'));

      const res = await generateWithGroq({
        prompt: 'Cloud Native Microservices',
      });

      expect(res.success).toBe(true);
      expect(res.text).toBeDefined();
      expect(res.model).toContain('synthesis');
    });
  });

  describe('Document Generation with Groq', () => {
    it('6. should generate a structured multi-page document using Groq', async () => {
      const mockDoc = `# Cloud Computing Infrastructure
## 1. Executive Summary
Cloud computing enables on-demand network access to compute resources.
## 2. System Architecture
Tiered architecture ensures reliability.`;

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: mockDoc } }] }),
      } as any);

      const doc = await generateDocumentWithGroq({
        title: 'Cloud Computing Infrastructure',
        templateName: 'Technical Specification',
        tone: 'Professional',
        instructions: 'Include architectural details',
      });

      expect(doc.success).toBe(true);
      expect(doc.provider).toBe('groq');
      expect(doc.content).toContain('Cloud Computing Infrastructure');
    });

    it('7. should fall back to grounded structured document synthesis when API is offline', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Groq offline'));

      const doc = await generateDocumentWithGroq({
        title: 'High-Throughput Message Queue Architecture',
        templateName: 'Engineering Standard',
        tone: 'Academic',
        instructions: 'Document partitioning benchmarks',
      });

      expect(doc.success).toBe(true);
      expect(doc.content).toContain('High-Throughput Message Queue Architecture');
      expect(doc.content).toContain('Executive Summary');
      expect(doc.content).toContain('Technical Architecture');
    });
  });

  describe('MCQ & Examination Generation with Groq', () => {
    it('8. should generate 4-choice MCQs with proper A-D options using Groq', async () => {
      const mockMcqs = {
        questions: [
          {
            question: 'What is the primary role of a Load Balancer?',
            optionA: 'Distribute network traffic evenly across backend servers',
            optionB: 'Encrypt local hard drives',
            optionC: 'Compile TypeScript source code',
            optionD: 'Generate neural network tokens',
            correctOption: 'A',
            marks: 1,
          },
          {
            question: 'Which consistency model does Raft protocol implement?',
            optionA: 'Eventual consistency',
            optionB: 'Strong linearizable consistency',
            optionC: 'Causal consistency',
            optionD: 'Zero consistency',
            correctOption: 'B',
            marks: 1,
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: JSON.stringify(mockMcqs) } }] }),
      } as any);

      const result = await generateMcqsWithGroq({
        topic: 'Distributed Systems',
        count: 2,
        difficulty: 'intermediate',
      });

      expect(result.success).toBe(true);
      expect(result.questions.length).toBe(2);
      expect(result.questions[0].correctOption).toBe('A');
      expect(result.questions[1].correctOption).toBe('B');
      expect(result.questions[0].optionA).toBe('Distribute network traffic evenly across backend servers');
    });

    it('9. should fall back to grounded MCQ synthesis if Groq output is invalid JSON', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'Invalid unparseable JSON text' } }] }),
      } as any);

      const result = await generateMcqsWithGroq({
        topic: 'Operating Systems Scheduling',
        count: 3,
      });

      expect(result.success).toBe(true);
      expect(result.questions.length).toBe(3);
      expect(['A', 'B', 'C', 'D']).toContain(result.questions[0].correctOption);
    });
  });

  describe('Groq Service Health Check', () => {
    it('10. should report healthy when Groq API models endpoint is reachable', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 'llama-3.3-70b-versatile' }] }),
      } as any);

      const health = await checkGroqHealth();
      expect(health.isHealthy).toBe(true);
      expect(health.provider).toBe('groq');
      expect(health.model).toBe('llama-3.3-70b-versatile');
    });

    it('11. should report unhealthy when GROQ_API_KEY is not set', async () => {
      delete process.env.GROQ_API_KEY;
      const health = await checkGroqHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.error).toContain('GROQ_API_KEY is not configured');
    });

    it('12. should report unhealthy when Groq API returns HTTP 401 Unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as any);

      const health = await checkGroqHealth();
      expect(health.isHealthy).toBe(false);
      expect(health.error).toContain('401');
    });
  });
});
