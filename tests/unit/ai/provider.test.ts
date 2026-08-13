import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDocument, GenerateDocOptions } from '@/lib/ai/provider';

describe('AI Provider Service (lib/ai/provider.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate fallback content when API keys are not present or invalid', async () => {
    const options: GenerateDocOptions = {
      provider: 'groq',
      title: 'Cloud Distributed System Architecture',
      tone: 'Formal & Technical',
      instructions: 'Explain microservices and consensus protocols',
      templateName: 'Software Architecture Document',
    };

    const result = await generateDocument(options);

    expect(result).toBeDefined();
    expect(typeof result.content).toBe('string');
    expect(result.content).toContain('[TEMPLATE_BADGE] Software Architecture Document');
    expect(result.content).toContain('# **Cloud Distributed System Architecture**');
    expect(result.content).toContain('## 1. Executive Summary');
  });

  it('should correctly format template badges and custom templates', async () => {
    const options: GenerateDocOptions = {
      provider: 'gemini',
      title: 'Annual Research Thesis',
      tone: 'Academic & Rigorous',
      instructions: 'Research findings on quantum cryptography',
      templateName: 'Academic Research Paper',
    };

    const result = await generateDocument(options);

    expect(result.content).toContain('[TEMPLATE_BADGE] Academic Research Paper');
    expect(result.content).toContain('# **Annual Research Thesis**');
  });

  it('should handle edge cases with empty title or instructions gracefully', async () => {
    const options: GenerateDocOptions = {
      provider: 'groq',
      title: '',
      tone: 'Professional',
      instructions: '',
    };

    const result = await generateDocument(options);

    expect(result).toBeDefined();
    expect(typeof result.content).toBe('string');
    expect(result.content.length).toBeGreaterThan(50);
  });
});
