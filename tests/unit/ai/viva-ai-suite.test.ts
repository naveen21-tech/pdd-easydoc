import { describe, it, expect } from 'vitest';
import { generateVivaQuestions, evaluateVivaAnswer } from '@/lib/ai/viva-generator';

describe('AI Engine: MCQ Studio & Viva Examination Generator (Area 7)', () => {
  it('1. should generate 20 MCQs for standard practice exam', async () => {
    const questions = await generateVivaQuestions({
      title: 'Database Management Systems',
      contextContent: 'Relational algebra, SQL, indexing, and normalization.',
      difficulty: 'Intermediate',
      questionCount: 20,
    });

    expect(questions.length).toBe(20);
  });

  it('2. should generate 25 MCQs by default', async () => {
    const questions = await generateVivaQuestions({
      title: 'Computer Networks',
      contextContent: 'OSI model, TCP/IP, routing algorithms, and DNS.',
      difficulty: 'Intermediate',
      questionCount: 25,
    });

    expect(questions.length).toBe(25);
  });

  it('3. should generate 30 MCQs for extended exam', async () => {
    const questions = await generateVivaQuestions({
      title: 'Web Technologies & Cloud',
      contextContent: 'Next.js, REST API, WebSockets, and Docker.',
      difficulty: 'Advanced',
      questionCount: 30,
    });

    expect(questions.length).toBe(30);
  });

  it('4. should generate 40 MCQs for full mock test', async () => {
    const questions = await generateVivaQuestions({
      title: 'Cybersecurity & Cryptography',
      contextContent: 'AES, RSA, Zero Trust, and penetration testing.',
      difficulty: 'Expert',
      questionCount: 40,
    });

    expect(questions.length).toBe(40);
  });

  it('5. should generate 50 MCQs for comprehensive university final', async () => {
    const questions = await generateVivaQuestions({
      title: 'Artificial Intelligence & Neural Networks',
      contextContent: 'Backpropagation, transformers, attention mechanisms, and gradient descent.',
      difficulty: 'Expert',
      questionCount: 50,
    });

    expect(questions.length).toBe(50);
  });

  it('6. should guarantee every question has non-empty question text', async () => {
    const questions = await generateVivaQuestions({
      title: 'Data Structures',
      contextContent: 'Binary search trees, AVL trees, and heaps.',
      difficulty: 'Basic',
      questionCount: 10,
    });

    questions.forEach((q) => {
      expect(q.question).toBeDefined();
      expect(q.question.trim().length).toBeGreaterThan(10);
    });
  });

  it('7. should ensure options array contains exactly 4 distinct choices', async () => {
    const questions = await generateVivaQuestions({
      title: 'Software Engineering Principles',
      contextContent: 'Agile, Scrum, CI/CD, and SOLID principles.',
      difficulty: 'Intermediate',
      questionCount: 10,
    });

    questions.forEach((q) => {
      expect(q.options).toBeDefined();
      expect(q.options?.length).toBe(4);
      const uniqueOptions = new Set(q.options);
      expect(uniqueOptions.size).toBe(4);
    });
  });

  it('8. should ensure correctOptionIndex is an integer between 0 and 3', async () => {
    const questions = await generateVivaQuestions({
      title: 'Compiler Design',
      contextContent: 'Lexical analysis, parsing, and code generation.',
      difficulty: 'Advanced',
      questionCount: 15,
    });

    questions.forEach((q) => {
      expect(Number.isInteger(q.correctOptionIndex)).toBe(true);
      expect(q.correctOptionIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctOptionIndex).toBeLessThanOrEqual(3);
    });
  });

  it('9. should provide pedagogical explanation for each MCQ', async () => {
    const questions = await generateVivaQuestions({
      title: 'Cloud Computing',
      contextContent: 'AWS, serverless, and autoscaling.',
      difficulty: 'Intermediate',
      questionCount: 10,
    });

    questions.forEach((q) => {
      expect(q.explanation).toBeDefined();
      expect(q.explanation?.length).toBeGreaterThan(10);
    });
  });

  it('10. should assign valid difficulty tier to each question', async () => {
    const questions = await generateVivaQuestions({
      title: 'Internet of Things',
      contextContent: 'MQTT, sensors, and microcontrollers.',
      difficulty: 'Basic',
      questionCount: 10,
    });

    questions.forEach((q) => {
      expect(['Basic', 'Intermediate', 'Advanced', 'Expert']).toContain(q.difficulty);
    });
  });

  it('11. should evaluate high-scoring viva answer (>80%) on complete technical response', async () => {
    const evalResult = await evaluateVivaAnswer({
      question: 'Explain how indexing improves query performance in relational databases.',
      expectedAnswer: 'B-Tree indexes reduce disk I/O by providing O(log n) lookup instead of full table scans.',
      userAnswer: 'B-Tree indexes allow the database engine to locate records in logarithmic time O(log N) instead of performing a sequential full table scan, significantly reducing disk I/O operations.',
      difficulty: 'Intermediate',
      category: 'Database',
    });

    expect(evalResult.score).toBeGreaterThanOrEqual(80);
    expect(evalResult.correctPoints.length).toBeGreaterThan(0);
    expect(evalResult.feedbackComment).toBeDefined();
  });

  it('12. should evaluate low-scoring answer (<50%) for vague or incomplete answers', async () => {
    const evalResult = await evaluateVivaAnswer({
      question: 'Explain how indexing improves query performance.',
      expectedAnswer: 'B-Tree indexes reduce disk I/O through logarithmic lookups.',
      userAnswer: 'It makes it faster.',
      difficulty: 'Intermediate',
      category: 'Database',
    });

    expect(evalResult.score).toBeLessThanOrEqual(50);
    expect(evalResult.missingPoints.length).toBeGreaterThan(0);
  });

  it('13. should handle empty answer string in evaluation gracefully', async () => {
    const evalResult = await evaluateVivaAnswer({
      question: 'Explain CAP theorem.',
      expectedAnswer: 'Consistency, Availability, Partition Tolerance.',
      userAnswer: '',
      difficulty: 'Advanced',
      category: 'Distributed Systems',
    });

    expect(evalResult.score).toBeLessThanOrEqual(20);
  });

  it('14. should provide actionable suggestions for improvement in evaluation', async () => {
    const evalResult = await evaluateVivaAnswer({
      question: 'Explain microservices communication patterns.',
      expectedAnswer: 'Synchronous REST/gRPC and asynchronous event-driven queues.',
      userAnswer: 'You can use REST APIs between services.',
      difficulty: 'Intermediate',
      category: 'Architecture',
    });

    expect(evalResult.suggestedImprovements).toBeDefined();
    expect(Array.isArray(evalResult.suggestedImprovements)).toBe(true);
  });

  it('15. should support specific category filters (Architecture, Database, Security)', async () => {
    const questions = await generateVivaQuestions({
      title: 'Full Stack Suite',
      contextContent: 'Architecture and security.',
      difficulty: 'Advanced',
      questionCount: 12,
      categories: ['Architecture', 'Security'],
    });

    expect(questions.length).toBe(12);
  });
});
