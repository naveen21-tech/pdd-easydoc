import { generateWithOpenAI, getOpenAIConfig, cleanAIOutput } from '@/lib/ai/openai';
import { HealthReportItem, HealthIssueItem, AIProvider } from '@/lib/types';

export interface AnalyzeHealthOptions {
  title: string;
  content: string;
  provider?: AIProvider;
}

export async function analyzeDocumentHealth(
  options: AnalyzeHealthOptions
): Promise<HealthReportItem> {
  const { title, content } = options;

  // Perform algorithmic heuristic analysis first
  const baseMetrics = calculateHeuristicHealth(content);

  const systemPrompt = `You are EasyDoc Chief Document Quality Inspector & Proofreader.
Analyze the provided document across 6 pillars: Structure, Readability, Grammar, Professionalism, Completeness, and Formatting.
Score each pillar from 0 to 100, and calculate an overall weighted score.
Provide 4-8 actionable improvement issues, each with a concrete auto-fix suggestion and action.

Output ONLY valid JSON matching this schema:
{
  "overallScore": 91,
  "structureScore": 94,
  "readabilityScore": 87,
  "grammarScore": 92,
  "professionalismScore": 95,
  "completenessScore": 88,
  "formattingScore": 90,
  "issues": [
    {
      "id": "issue-1",
      "category": "Completeness" | "Structure" | "Readability" | "Grammar" | "Professionalism" | "Formatting",
      "severity": "low" | "medium" | "high",
      "title": "Add a Conclusion & Next Steps section",
      "description": "The document concludes abruptly without summarizing final deliverables or next milestones.",
      "suggestedFix": "Append a structured ## 5. Conclusion & Action Items section.",
      "autoFixAction": {
        "type": "append",
        "replacement": "\\n\\n---\\n\\n## 5. Conclusion & Next Milestones\\nIn summary, the objectives outlined in this specification establish verified engineering standards and actionable deliverables for project stakeholders."
      }
    }
  ]
}
Return ONLY raw JSON.`;

  const userPrompt = `Document Title: ${title}
Document Content:
${content.slice(0, 7000)}`;

  // Call Centralized OpenAI Service
  const config = getOpenAIConfig();
  const openAIRes = await generateWithOpenAI({
    task: 'health',
    model: config.model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.3,
    maxTokens: 3000,
    jsonFormat: true,
  });

  if (openAIRes.success && openAIRes.text) {
    const raw = cleanAIOutput(openAIRes.text).replace(/```json|```/g, '').trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (typeof parsed.overallScore === 'number') {
          return {
            ...parsed,
            calculatedAt: new Date().toISOString(),
          };
        }
      } catch (e) {
        console.warn('OpenAI health report parse error:', e);
      }
    }
  }

  // Heuristic Fallback
  return baseMetrics;
}

function calculateHeuristicHealth(content: string): HealthReportItem {
  const lines = content.split('\n');
  const words = content.split(/\s+/).filter(Boolean);
  const headings = lines.filter((l) => l.startsWith('#') || l.startsWith('##'));
  const hasPageBreaks = content.includes('[PAGE BREAK]');
  const hasTitle = lines.some((l) => l.startsWith('# '));
  const hasConclusion = content.toLowerCase().includes('conclusion') || content.toLowerCase().includes('summary');
  const hasTable = content.includes('|');

  const issues: HealthIssueItem[] = [];

  let structureScore = 88;
  if (!hasTitle) {
    structureScore -= 15;
    issues.push({
      id: 'issue-title',
      category: 'Structure',
      severity: 'high',
      title: 'Missing Top-Level Document Title (H1)',
      description: 'Documents require a prominent # Title heading on the first page.',
      suggestedFix: 'Add # [Document Title] to the top of the file.',
      autoFixAction: {
        type: 'prepend',
        replacement: '# **Executive Document Title**\n\n',
      },
    });
  }

  if (!hasConclusion) {
    structureScore -= 10;
    issues.push({
      id: 'issue-conclusion',
      category: 'Completeness',
      severity: 'medium',
      title: 'Add a Conclusion & Next Milestones section',
      description: 'The document lacks a dedicated final conclusion summarizing key deliverables.',
      suggestedFix: 'Append a ## Conclusion section.',
      autoFixAction: {
        type: 'append',
        replacement: '\n\n---\n\n## Conclusion & Next Steps\nIn summary, the specifications and implementation workflows presented in this document fulfill all operational requirements and provide an actionable blueprint for stakeholders.\n',
      },
    });
  }

  let formattingScore = 90;
  if (!hasPageBreaks && lines.length > 30) {
    formattingScore -= 10;
    issues.push({
      id: 'issue-breaks',
      category: 'Formatting',
      severity: 'low',
      title: 'Insert A4 Page Breaks',
      description: 'Insert [PAGE BREAK] tags between major sections to ensure clean page pagination in exports.',
      suggestedFix: 'Add [PAGE BREAK] after the title block.',
      autoFixAction: {
        type: 'format',
      },
    });
  }

  const readabilityScore = Math.min(96, Math.max(75, 95 - (words.length > 500 ? 5 : 0)));
  const grammarScore = 94;
  const professionalismScore = 92;
  const completenessScore = hasConclusion && hasTable ? 95 : 85;

  const overallScore = Math.round(
    (structureScore + readabilityScore + grammarScore + professionalismScore + completenessScore + formattingScore) / 6
  );

  return {
    overallScore,
    structureScore,
    readabilityScore,
    grammarScore,
    professionalismScore,
    completenessScore,
    formattingScore,
    issues,
    calculatedAt: new Date().toISOString(),
  };
}
