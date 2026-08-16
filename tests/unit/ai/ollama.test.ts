import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getOllamaConfig,
  generateWithOllama,
  generateDocumentWithOllama,
  generateMcqsWithOllama,
  extractAndSanitizeMcqs,
  checkOllamaHealth,
} from '@/lib/ai/ollama';

describe('Centralized Ollama LLM Service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.OLLAMA_BASE_URL = 'https://ollama.internal.org';
    process.env.OLLAMA_MODEL_DOCUMENT = 'llama3.2';
    process.env.OLLAMA_MODEL_MCQ = 'qwen2.5';
    process.env.OLLAMA_AUTH_TOKEN = 'secret-token-123';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Configuration & Model Routing', () => {
    it('should parse environment variables accurately', () => {
      const config = getOllamaConfig();
      expect(config.baseUrl).toBe('https://ollama.internal.org');
      expect(config.documentModel).toBe('llama3.2');
      expect(config.mcqModel).toBe('qwen2.5');
      expect(config.authToken).toBe('secret-token-123');
    });

    it('should route document tasks to llama3.2', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          message: { role: 'assistant', content: '# **AI Architecture**\n\nExecutive summary text.' },
        }),
      });

      const res = await generateWithOllama({
        task: 'document',
        prompt: 'Generate an architecture specification',
      });

      expect(res.success).toBe(true);
      expect(res.model).toBe('llama3.2');
      expect(res.text).toContain('AI Architecture');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const reqBody = JSON.parse(fetchCall[1].body);
      expect(reqBody.model).toBe('llama3.2');
      expect(fetchCall[1].headers['Authorization']).toBe('Bearer secret-token-123');
    });

    it('should route MCQ tasks to qwen2.5', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'qwen2.5',
          message: {
            role: 'assistant',
            content: JSON.stringify([
              {
                question: 'What is Next.js App Router?',
                optionA: 'A React Server Components architecture',
                optionB: 'A CSS compiler',
                optionC: 'A legacy HTML parser',
                optionD: 'A database driver',
                correctOption: 'A',
                marks: 1,
              },
            ]),
          },
        }),
      });

      const res = await generateWithOllama({
        task: 'mcq',
        prompt: 'Generate MCQs for Next.js',
        jsonFormat: true,
      });

      expect(res.success).toBe(true);
      expect(res.model).toBe('qwen2.5');

      const fetchCall = (global.fetch as any).mock.calls[0];
      const reqBody = JSON.parse(fetchCall[1].body);
      expect(reqBody.model).toBe('qwen2.5');
      expect(reqBody.format).toBe('json');
    });
  });

  describe('Document Generation with llama3.2', () => {
    it('should generate a structured document with template badge and page breaks', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'llama3.2',
          message: {
            role: 'assistant',
            content: '[TEMPLATE_BADGE] Technical Spec\n# **Distributed Cache Spec**\n\n[PAGE BREAK]\n\n## 1. Executive Summary',
          },
        }),
      });

      const doc = await generateDocumentWithOllama({
        title: 'Distributed Cache Spec',
        templateName: 'Technical Spec',
        tone: 'Technical',
        instructions: 'Design Redis cluster topology',
      });

      expect(doc.success).toBe(true);
      expect(doc.provider).toBe('ollama');
      expect(doc.model).toBe('llama3.2');
      expect(doc.content).toContain('[TEMPLATE_BADGE] Technical Spec');
      expect(doc.content).toContain('Distributed Cache Spec');
    });

    it('should fall back to structured zero-failure synthesis when Ollama is offline', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      const doc = await generateDocumentWithOllama({
        title: 'Backup Plan',
        templateName: 'Official Report',
        tone: 'Professional',
        instructions: 'Execute failover protocols',
      });

      expect(doc.success).toBe(true);
      expect(doc.content).toContain('[TEMPLATE_BADGE] Official Report');
      expect(doc.content).toContain('# **Backup Plan**');
      expect(doc.content).toContain('## 1. Executive Summary');
      expect(doc.content).toContain('## 4. Operational Plan & Timeline');
    });
  });

  describe('MCQ Generation with qwen2.5', () => {
    it('should generate and sanitize structured questions', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'qwen2.5',
          message: {
            role: 'assistant',
            content: JSON.stringify([
              {
                question: 'Which HTTP status code indicates Unauthorized access?',
                optionA: '200 OK',
                optionB: '401 Unauthorized',
                optionC: '404 Not Found',
                optionD: '500 Server Error',
                correctOption: 'B',
                marks: 1,
              },
            ]),
          },
        }),
      });

      const result = await generateMcqsWithOllama({
        topic: 'Web Security',
        count: 1,
      });

      expect(result.success).toBe(true);
      expect(result.model).toBe('qwen2.5');
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].correctOption).toBe('B');
      expect(result.questions[0].optionB).toBe('401 Unauthorized');
    });

    it('should enforce valid correctOption (A, B, C, D) and fall back on malformed output', () => {
      const raw = '```json\n[{"question": "Test Q?", "optionA": "Opt A", "optionB": "Opt B", "optionC": "Opt C", "optionD": "Opt D", "correctOption": "invalid", "marks": 1}]\n```';
      const parsed = extractAndSanitizeMcqs(raw, 1, 'Testing');

      expect(parsed).toHaveLength(1);
      expect(['A', 'B', 'C', 'D']).toContain(parsed[0].correctOption);
    });

    it('should generate fallback questions if Ollama output is completely invalid', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'qwen2.5',
          message: { role: 'assistant', content: 'I cannot generate questions as JSON.' },
        }),
      });

      const result = await generateMcqsWithOllama({
        topic: 'Cloud Computing',
        count: 3,
      });

      expect(result.success).toBe(true);
      expect(result.questions).toHaveLength(3);
      expect(result.questions[0].question).toContain('Cloud Computing');
    });
  });

  describe('Ollama Server Health Check', () => {
    it('should detect when both llama3.2 and qwen2.5 are available', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama3.2:latest' },
            { name: 'qwen2.5:latest' },
            { name: 'mistral:latest' },
          ],
        }),
      });

      const health = await checkOllamaHealth();

      expect(health.isHealthy).toBe(true);
      expect(health.documentModelAvailable).toBe(true);
      expect(health.mcqModelAvailable).toBe(true);
      expect(health.availableModels).toContain('llama3.2:latest');
      expect(health.availableModels).toContain('qwen2.5:latest');
    });

    it('should report unhealthy when Ollama server is unreachable', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const health = await checkOllamaHealth();

      expect(health.isHealthy).toBe(false);
      expect(health.documentModelAvailable).toBe(false);
      expect(health.mcqModelAvailable).toBe(false);
      expect(health.error).toBeDefined();
    });
  });
});
