import { describe, it, expect } from 'vitest';

// 1. Assignment Auto-Review Simulation Engine
function analyzeDocumentSubmission(
  content: string,
  assignment: {
    requiredSections: string[];
    minReferences: number;
    requiredKeywords: string[];
    minWordCount: number;
  }
) {
  const normalizedText = content.toLowerCase();
  const rawWords = content.split(/\s+/).filter((w) => w.trim().length > 0);
  const wordCount = rawWords.length;

  const sectionChecks: Array<{ name: string; present: boolean }> = [];
  let foundSectionCount = 0;
  const missingRequirements: string[] = [];

  const sectionAliases: Record<string, string[]> = {
    'title page': ['title', 'report on', 'prepared by'],
    'introduction': ['introduction', 'overview', 'background'],
    'problem statement': ['problem statement', 'motivation', 'challenges'],
    'objectives': ['objectives', 'scope', 'aim', 'goals'],
    'methodology': ['methodology', 'methods', 'architecture', 'system design'],
    'results': ['results', 'evaluation', 'analysis', 'findings'],
    'conclusion': ['conclusion', 'summary', 'future work'],
    'references': ['references', 'bibliography', 'citations'],
  };

  const sectionsToEvaluate = assignment.requiredSections.length > 0
    ? assignment.requiredSections
    : ['Title Page', 'Introduction', 'Problem Statement', 'Objectives', 'Methodology', 'Results', 'Conclusion', 'References'];

  sectionsToEvaluate.forEach((secName: string) => {
    const lowerName = secName.toLowerCase().trim();
    const aliases = sectionAliases[lowerName] || [lowerName];
    
    const isPresent = aliases.some((alias) => {
      const regex = new RegExp(`(^|\\n|#+|\\*+)\\s*${alias}`, 'i');
      return regex.test(content) || normalizedText.includes(alias);
    });

    if (isPresent) {
      foundSectionCount++;
      sectionChecks.push({ name: secName, present: true });
    } else {
      sectionChecks.push({ name: secName, present: false });
      missingRequirements.push(`${secName} section missing`);
    }
  });

  // References
  let referencesCount = 0;
  const citationMatches = content.match(/\[\d+\]/g);
  if (citationMatches) {
    referencesCount = new Set(citationMatches).size;
  }

  const minRefs = assignment.minReferences || 0;
  const referencesSatisfied = minRefs === 0 || referencesCount >= minRefs;
  if (!referencesSatisfied) {
    missingRequirements.push(`Only ${referencesCount} reference(s) found (minimum ${minRefs} required)`);
  }

  // Keywords
  const keywords = assignment.requiredKeywords || [];
  const keywordsFound: string[] = [];
  keywords.forEach((kw) => {
    if (normalizedText.includes(kw.toLowerCase().trim())) {
      keywordsFound.push(kw);
    } else {
      missingRequirements.push(`Required keyword "${kw}" not found`);
    }
  });

  // Word count
  const minWords = assignment.minWordCount || 0;
  const wordCountSatisfied = minWords === 0 || wordCount >= minWords;
  if (!wordCountSatisfied) {
    missingRequirements.push(`Document length is ${wordCount} words (minimum ${minWords} required)`);
  }

  // Quality score
  let sectionScore = (foundSectionCount / sectionsToEvaluate.length) * 60;
  let refScore = referencesSatisfied ? 20 : Math.min(20, (referencesCount / Math.max(1, minRefs)) * 20);
  let kwScore = keywords.length > 0 ? (keywordsFound.length / keywords.length) * 10 : 10;
  let lenScore = wordCountSatisfied ? 10 : Math.min(10, (wordCount / Math.max(1, minWords)) * 10);

  let qualityScore = Math.min(100, Math.max(20, Math.round(sectionScore + refScore + kwScore + lenScore)));

  return {
    sectionChecks,
    foundSectionCount,
    referencesCount,
    referencesSatisfied,
    keywordsFound,
    wordCount,
    qualityScore,
    missingRequirements,
  };
}

describe('Smart Classroom Unit Tests', () => {
  describe('Assignment Auto-Review Engine', () => {
    const sampleAssignment = {
      requiredSections: ['Title Page', 'Introduction', 'Problem Statement', 'Objectives', 'Methodology', 'Results', 'Conclusion', 'References'],
      minReferences: 3,
      requiredKeywords: ['deadlock', 'synchronization'],
      minWordCount: 50,
    };

    it('should calculate high quality score for complete document with all sections and citations', () => {
      const fullDoc = `
# Title: Distributed Operating Systems
## Introduction
This report analyzes distributed deadlocks and synchronization protocols.
## Problem Statement
Addressing resource allocation contention in concurrent clusters.
## Objectives
To evaluate distributed deadlock detection algorithms.
## Methodology
We implemented a wait-for-graph cycle detector.
## Results
Latency reduced by 34% with zero false deadlocks.
## Conclusion
Synchronization mechanisms provide deterministic execution.
## References
[1] Lamport, L. (1978). Time, clocks, and the ordering of events.
[2] Chandy, K. M. (1983). Distributed deadlock detection.
[3] Tanenbaum, A. (2016). Distributed Systems Principles.
      `;

      const review = analyzeDocumentSubmission(fullDoc, sampleAssignment);
      expect(review.foundSectionCount).toBe(8);
      expect(review.referencesCount).toBeGreaterThanOrEqual(3);
      expect(review.referencesSatisfied).toBe(true);
      expect(review.keywordsFound).toContain('deadlock');
      expect(review.keywordsFound).toContain('synchronization');
      expect(review.qualityScore).toBeGreaterThanOrEqual(90);
      expect(review.missingRequirements.length).toBe(0);
    });

    it('should flag missing sections and low reference count', () => {
      const incompleteDoc = `
# Title: OS Notes
## Introduction
Brief introduction with deadlock concepts.
## Results
Experimental data here.
      `;

      const review = analyzeDocumentSubmission(incompleteDoc, sampleAssignment);
      expect(review.foundSectionCount).toBeLessThan(8);
      expect(review.referencesSatisfied).toBe(false);
      expect(review.qualityScore).toBeLessThan(75);
      expect(review.missingRequirements.some((r) => r.includes('Methodology'))).toBe(true);
      expect(review.missingRequirements.some((r) => r.includes('References'))).toBe(true);
    });
  });

  describe('Adaptive MCQ Topic Proficiency Scoring', () => {
    it('should calculate topic-wise percentages and accurately flag weak topics', () => {
      const questions = [
        { id: 'q1', topic: 'Operating Systems', marks: 1, correctOption: 'A' },
        { id: 'q2', topic: 'Operating Systems', marks: 1, correctOption: 'B' },
        { id: 'q3', topic: 'Computer Networks', marks: 1, correctOption: 'C' },
        { id: 'q4', topic: 'Computer Networks', marks: 1, correctOption: 'D' },
      ];

      const studentAnswers = {
        q1: 'A', // Correct (OS)
        q2: 'A', // Wrong (OS) -> 50%
        q3: 'A', // Wrong (CN)
        q4: 'B', // Wrong (CN) -> 0%
      };

      const topicStats: Record<string, { total: number; correct: number; percentage: number }> = {};
      questions.forEach((q) => {
        if (!topicStats[q.topic]) topicStats[q.topic] = { total: 0, correct: 0, percentage: 0 };
        topicStats[q.topic].total++;
        if (studentAnswers[q.id as keyof typeof studentAnswers] === q.correctOption) {
          topicStats[q.topic].correct++;
        }
      });

      Object.keys(topicStats).forEach((t) => {
        topicStats[t].percentage = (topicStats[t].correct / topicStats[t].total) * 100;
      });

      expect(topicStats['Operating Systems'].percentage).toBe(50);
      expect(topicStats['Computer Networks'].percentage).toBe(0);

      // Ranked weak topics
      const weakList = Object.entries(topicStats)
        .map(([name, d]) => ({ name, ...d }))
        .sort((a, b) => a.percentage - b.percentage);

      expect(weakList[0].name).toBe('Computer Networks');
    });
  });

  describe('Faculty Intelligence Analytics Aggregation', () => {
    it('should compute participation rate and identify top performers and interventions', () => {
      const students = [
        { userId: 'u1', name: 'Alice' },
        { userId: 'u2', name: 'Bob' },
        { userId: 'u3', name: 'Charlie' },
      ];

      const attempts = [
        { userId: 'u1', score: 90, percentage: 90 },
        { userId: 'u2', score: 40, percentage: 40 },
      ];

      const submissions = [
        { userId: 'u1', qualityScore: 95 },
        { userId: 'u2', qualityScore: 50 },
      ];

      const activeIds = new Set([...attempts.map((a) => a.userId), ...submissions.map((s) => s.userId)]);
      const participationRate = Math.round((activeIds.size / students.length) * 100);

      expect(participationRate).toBe(67); // 2 out of 3

      const topPerformers = students.filter((st) => {
        const userAtt = attempts.find((a) => a.userId === st.userId);
        return userAtt && userAtt.percentage >= 75;
      });

      const needsAttention = students.filter((st) => {
        const userAtt = attempts.find((a) => a.userId === st.userId);
        return !userAtt || userAtt.percentage < 60;
      });

      expect(topPerformers.length).toBe(1);
      expect(topPerformers[0].name).toBe('Alice');
      expect(needsAttention.length).toBe(2); // Bob (40%) and Charlie (0%)
    });
  });

  describe('Smart Recommendation Pathway Mapping', () => {
    it('should map weak topic to corresponding Knowledge Hub study notes and actions', () => {
      const weakTopic = 'Computer Networks';
      const materials = [
        { id: 'm1', title: 'OS Deadlock Notes', topic: 'Operating Systems', unit: 'Unit 1' },
        { id: 'm2', title: 'TCP/IP and OSI Layer Notes', topic: 'Computer Networks', unit: 'Unit 3' },
      ];

      const matchedDoc = materials.find(
        (m) =>
          m.topic.toLowerCase().includes(weakTopic.toLowerCase()) ||
          weakTopic.toLowerCase().includes(m.topic.toLowerCase())
      );

      expect(matchedDoc).toBeDefined();
      expect(matchedDoc?.id).toBe('m2');
      expect(matchedDoc?.unit).toBe('Unit 3');

      // Suggested action generation
      const recommendedAction = {
        label: `Review ${matchedDoc?.unit} Notes on ${weakTopic}`,
        action: 'ask',
        query: `Explain ${weakTopic} from ${matchedDoc?.unit} in detail`,
      };

      expect(recommendedAction.action).toBe('ask');
      expect(recommendedAction.query).toContain('Unit 3');
    });
  });
});
