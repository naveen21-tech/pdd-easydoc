import { GoogleGenerativeAI } from '@google/generative-ai';
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

  // 1. Try Groq AI
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && !groqKey.toLowerCase().includes('mock') && !groqKey.includes('your-groq-key')) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 3000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content?.replace(/```json|```/g, '').trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (typeof parsed.overallScore === 'number') {
            return {
              ...parsed,
              calculatedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch (e) {
      console.warn('Groq health analyzer fallback:', e);
    }
  }

  // 2. Try Gemini AI
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && !geminiKey.toLowerCase().includes('mock') && !geminiKey.includes('your-gemini-key')) {
    try {
      const ai = new GoogleGenerativeAI(geminiKey);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const res = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const raw = res.response.text().replace(/```json|```/g, '').trim();
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.overallScore === 'number') {
          return {
            ...parsed,
            calculatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('Gemini health analyzer fallback:', e);
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
