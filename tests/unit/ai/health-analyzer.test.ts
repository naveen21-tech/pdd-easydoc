import { describe, it, expect } from 'vitest';
import { analyzeDocumentHealth } from '@/lib/ai/health-analyzer';

describe('Document Health Analyzer Service (lib/ai/health-analyzer.ts)', () => {
  it('should analyze document text and compute detailed quality scores and issue items', async () => {
    const documentText = `# Software Requirement Specification
## 1. Introduction
This system provides automated document compilation with high throughput.

## 2. Architecture
The architecture comprises API gateways, event queues, and database replicas.
`;

    const report = await analyzeDocumentHealth({
      title: 'Software Requirement Specification',
      content: documentText,
    });

    expect(report).toBeDefined();
    expect(typeof report.overallScore).toBe('number');
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);

    expect(typeof report.structureScore).toBe('number');
    expect(typeof report.readabilityScore).toBe('number');
    expect(typeof report.grammarScore).toBe('number');
    expect(typeof report.professionalismScore).toBe('number');
    expect(typeof report.completenessScore).toBe('number');
    expect(typeof report.formattingScore).toBe('number');
    expect(Array.isArray(report.issues)).toBe(true);
  });

  it('should detect short/incomplete documents and provide actionable fixes', async () => {
    const shortDoc = 'Hello world.';
    const report = await analyzeDocumentHealth({
      title: 'Short Doc',
      content: shortDoc,
    });

    expect(report).toBeDefined();
    expect(report.overallScore).toBeLessThan(90);
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.issues[0].suggestedFix).toBeDefined();
  });
});
