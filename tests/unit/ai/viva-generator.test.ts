import { describe, it, expect } from 'vitest';
import { generateVivaQuestions, evaluateVivaAnswer } from '@/lib/ai/viva-generator';

describe('MCQ & Viva Generator Service (lib/ai/viva-generator.ts)', () => {
  it('should generate requested number of MCQs within 5 to 50 bounds', async () => {
    const questions = await generateVivaQuestions({
      title: 'Distributed Systems & Cloud Computing',
      contextContent: 'Cloud distributed systems, raft consensus, and high availability clusters.',
      difficulty: 'Advanced',
      questionCount: 25,
      categories: ['Architecture', 'Database', 'Security'],
    });

    expect(questions).toBeDefined();
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(25);
  });

  it('should guarantee 4 distinct options (A, B, C, D) and valid correctOptionIndex on all MCQs', async () => {
    const questions = await generateVivaQuestions({
      title: 'Full Stack Engineering',
      contextContent: 'Next.js App Router, React Server Components, and PostgreSQL.',
      difficulty: 'Intermediate',
      questionCount: 10,
    });

    expect(questions.length).toBe(10);
    questions.forEach((q) => {
      expect(q.id).toBeDefined();
      expect(q.question.length).toBeGreaterThan(5);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options?.length).toBe(4);
      expect(typeof q.correctOptionIndex).toBe('number');
      expect(q.correctOptionIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctOptionIndex).toBeLessThanOrEqual(3);
      expect(q.answer).toBeDefined();
      expect(q.explanation).toBeDefined();
    });
  });

  it('should correctly clamp question count to minimum 5 and maximum 50', async () => {
    const lowResult = await generateVivaQuestions({
      title: 'Algorithms',
      contextContent: 'Sorting and graph algorithms.',
      difficulty: 'Basic',
      questionCount: 2,
    });
    expect(lowResult.length).toBe(5);

    const highResult = await generateVivaQuestions({
      title: 'Security',
      contextContent: 'Cryptographic hashing and certificates.',
      difficulty: 'Expert',
      questionCount: 100,
    });
    expect(highResult.length).toBe(50);
  });

  it('should evaluate user answers and calculate accurate scores with feedback points', async () => {
    const evaluation = await evaluateVivaAnswer({
      question: 'Explain ACID properties in relational databases.',
      expectedAnswer: 'Atomicity, Consistency, Isolation, Durability guarantee valid transactions even in events of power loss or errors.',
      userAnswer: 'ACID stands for Atomicity, Consistency, Isolation, and Durability to ensure reliable transactions.',
      difficulty: 'Intermediate',
      category: 'Database',
    });

    expect(evaluation).toBeDefined();
    expect(typeof evaluation.score).toBe('number');
    expect(evaluation.score).toBeGreaterThanOrEqual(0);
    expect(evaluation.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(evaluation.correctPoints)).toBe(true);
    expect(Array.isArray(evaluation.missingPoints)).toBe(true);
    expect(typeof evaluation.feedbackComment).toBe('string');
  });

  it('should handle edge cases with empty user answers', async () => {
    const evaluation = await evaluateVivaAnswer({
      question: 'What is database sharding?',
      expectedAnswer: 'Database sharding is horizontal partitioning of database tables.',
      userAnswer: '',
      difficulty: 'Basic',
      category: 'Database',
    });

    expect(evaluation.score).toBeLessThanOrEqual(50);
    expect(evaluation.missingPoints.length).toBeGreaterThan(0);
  });
});
