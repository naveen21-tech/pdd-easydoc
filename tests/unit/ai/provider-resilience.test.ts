import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateDocument, GenerateDocOptions } from '@/lib/ai/provider';

describe('AI Engine: Multi-Model Resilience & Fallbacks (Area 7)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. should generate document using OpenAI synthesis fallback', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Cloud Native Microservices Architecture',
      tone: 'Formal & Technical',
      instructions: 'Explain service mesh and distributed tracing',
      templateName: 'Software Architecture Document',
    };

    const res = await generateDocument(options);
    expect(res.content).toBeDefined();
    expect(res.content).toContain('Cloud Native Microservices Architecture');
    expect(res.content).toContain('Software Architecture Document');
  });

  it('2. should generate document using Gemini 1.5 Flash synthesis fallback', async () => {
    const options: GenerateDocOptions = {
      provider: 'gemini',
      title: 'Quantum Cryptography Thesis',
      tone: 'Academic & Rigorous',
      instructions: 'Discuss BB84 protocol and quantum key distribution',
      templateName: 'Academic Research Paper',
    };

    const res = await generateDocument(options);
    expect(res.content).toContain('Quantum Cryptography Thesis');
    expect(res.content).toContain('Academic Research Paper');
  });

  it('3. should generate document using Claude 3.5 Sonnet fallback', async () => {
    const options: GenerateDocOptions = {
      provider: 'anthropic',
      title: 'Company Executive Summary',
      tone: 'Professional & Concise',
      instructions: 'Financial summary for fiscal year 2026',
      templateName: 'Business Proposal',
    };

    const res = await generateDocument(options);
    expect(res.content).toContain('Company Executive Summary');
  });

  it('4. should generate document using OpenAI GPT-4o fallback', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Machine Learning Pipelines',
      tone: 'Formal & Technical',
      instructions: 'Model training and inference optimization',
      templateName: 'Technical Specification',
    };

    const res = await generateDocument(options);
    expect(res.content).toContain('Machine Learning Pipelines');
  });

  it('5. should handle empty title with safe default title', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: '',
      tone: 'Professional',
      instructions: 'General notes',
    };

    const res = await generateDocument(options);
    expect(res.content).toBeDefined();
    expect(res.content.length).toBeGreaterThan(50);
  });

  it('6. should handle empty instructions with default outline synthesis', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Autonomous Drone Systems',
      tone: 'Formal & Technical',
      instructions: '',
    };

    const res = await generateDocument(options);
    expect(res.content).toContain('Autonomous Drone Systems');
    expect(res.content).toContain('1. Introduction');
  });

  it('7. should include document template badge in generated markdown', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Operating Systems Lab',
      tone: 'Academic',
      instructions: 'Lab experiment',
      templateName: 'Lab Report',
    };

    const res = await generateDocument(options);
    expect(res.content).toContain('[TEMPLATE_BADGE] Lab Report');
  });

  it('8. should calculate and return execution response time in milliseconds', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Performance Benchmark',
      tone: 'Formal',
      instructions: 'Benchmark metrics',
    };

    const res = await generateDocument(options);
    expect(typeof res.responseTimeMs).toBe('number');
    expect(res.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('9. should return success boolean flag true on completed generation', async () => {
    const options: GenerateDocOptions = {
      provider: 'gemini',
      title: 'Success Flag Test',
      tone: 'Formal',
      instructions: 'Testing flags',
    };

    const res = await generateDocument(options);
    expect(res.success).toBe(true);
  });

  it('10. should construct 5+ structured sections in generated document', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Full Specification Document',
      tone: 'Formal & Technical',
      instructions: 'Comprehensive architecture',
    };

    const res = await generateDocument(options);
    expect(res.content).toContain('1. Introduction & Overview');
    expect(res.content).toContain('2. Core Concepts & Theoretical Framework');
    expect(res.content).toContain('5. Conclusion & Recommendations');
  });

  it('11. should format document with table of metrics or specifications', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'System Benchmarking Spec',
      tone: 'Formal & Technical',
      instructions: 'Benchmarking metrics table',
    };

    const res = await generateDocument(options);
    expect(res.content).toContain('|');
  });

  it('12. should handle very long instructions exceeding 2,000 characters', async () => {
    const longInstructions = 'Detail '.repeat(400);
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Detailed Instructions Test',
      tone: 'Formal',
      instructions: longInstructions,
    };

    const res = await generateDocument(options);
    expect(res.content).toBeDefined();
    expect(res.success).toBe(true);
  });

  it('13. should handle special symbols in document title gracefully', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'C++ & Rust: Memory Safety vs Performance (2026)',
      tone: 'Technical',
      instructions: 'Compare borrow checker and manual allocation',
    };

    const res = await generateDocument(options);
    expect(res.content).toContain('C++ & Rust');
  });

  it('14. should format metadata date footer in generated document', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Annual Review',
      tone: 'Formal',
      instructions: 'Review 2026',
    };

    const res = await generateDocument(options);
    const currentYear = new Date().getFullYear().toString();
    expect(res.content).toContain(currentYear);
  });

  it('15. should sanitize output content to remove markdown code-fence wrapper artifacts', async () => {
    const options: GenerateDocOptions = {
      provider: 'openai',
      title: 'Code Fence Sanitization Test',
      tone: 'Technical',
      instructions: 'Testing sanitization',
    };

    const res = await generateDocument(options);
    expect(res.content.startsWith('```markdown')).toBe(false);
  });
});
