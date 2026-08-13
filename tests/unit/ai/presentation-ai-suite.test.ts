import { describe, it, expect } from 'vitest';
import { generatePresentationSlides, enhanceSlideContent } from '@/lib/ai/presentation-generator';
import { PresentationStyle } from '@/lib/types';

describe('AI Engine: Presentation Studio & Slide Deck Synthesizer (Area 7)', () => {
  it('1. should generate title slide as the first slide in deck', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Zero Trust Security Architecture',
      documentContent: 'Identity attestation, mTLS, and least privilege access.',
      slideCount: 8,
      style: 'Technical',
    });

    expect(slides[0].layout).toBe('title');
    expect(slides[0].title).toBeDefined();
  });

  it('2. should generate conclusion slide as the final slide in deck', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Autonomous Mobile Robotics',
      documentContent: 'SLAM, path planning, and sensor fusion.',
      slideCount: 8,
      style: 'Academic',
    });

    expect(slides[slides.length - 1].layout).toBe('conclusion');
  });

  it('3. should generate exact requested number of slides within bounds (4 to 15)', async () => {
    const counts = [4, 6, 8, 10, 12, 15];
    for (const count of counts) {
      const slides = await generatePresentationSlides({
        documentTitle: `Deck with ${count} slides`,
        documentContent: 'Overview of system features.',
        slideCount: count,
        style: 'Minimal',
      });
      expect(slides.length).toBe(count);
    }
  });

  it('4. should clamp slide count smaller than 4 to 4 minimum', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Short Deck',
      documentContent: 'Brief memo.',
      slideCount: 2,
      style: 'Academic',
    });
    expect(slides.length).toBe(4);
  });

  it('5. should clamp slide count greater than 15 to 15 maximum', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Huge Deck',
      documentContent: 'Very long document.',
      slideCount: 25,
      style: 'Corporate',
    });
    expect(slides.length).toBe(15);
  });

  it('6. should generate bullet points on content slides', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Distributed Systems',
      documentContent: 'Consensus protocols, Raft, Paxos.',
      slideCount: 6,
      style: 'Corporate',
    });

    const contentSlides = slides.filter((s) => s.layout === 'content' || s.layout === 'split');
    expect(contentSlides.length).toBeGreaterThan(0);
    contentSlides.forEach((s) => {
      expect(Array.isArray(s.bullets)).toBe(true);
      expect(s.bullets.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('7. should support Academic presentation style', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Academic Research Paper',
      documentContent: 'Literature review, methodology, results.',
      slideCount: 6,
      style: 'Academic',
    });
    expect(slides.length).toBe(6);
  });

  it('8. should support Corporate presentation style', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Executive Strategy',
      documentContent: 'Market analysis and quarterly projection.',
      slideCount: 6,
      style: 'Corporate',
    });
    expect(slides.length).toBe(6);
  });

  it('9. should support Technical presentation style', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Cyber Warfare Defense',
      documentContent: 'Cryptographic attestation and threat vectors.',
      slideCount: 6,
      style: 'Technical',
    });
    expect(slides.length).toBe(6);
  });

  it('10. should support Minimal presentation style', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Clean Minimalist Architecture',
      documentContent: 'Design patterns and simplicity.',
      slideCount: 6,
      style: 'Minimal',
    });
    expect(slides.length).toBe(6);
  });

  it('11. should support Project Viva presentation style', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Project Viva Defense',
      documentContent: 'Engineering project demonstration and code review.',
      slideCount: 6,
      style: 'Project Viva',
    });
    expect(slides.length).toBe(6);
  });

  it('12. should enhance slide with speaker notes and detailed bullets', async () => {
    const enhanced = await enhanceSlideContent({
      deckTitle: 'Cloud Distributed Systems',
      slideTitle: 'Event-Driven Microservices',
      style: 'Corporate',
    });

    expect(enhanced.title).toBe('Event-Driven Microservices');
    expect(enhanced.bullets.length).toBeGreaterThanOrEqual(2);
    expect(enhanced.notes.length).toBeGreaterThan(10);
  });

  it('13. should handle empty document content with title fallback in slide generation', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Blockchain Ledger',
      documentContent: '',
      slideCount: 6,
      style: 'Technical',
    });
    expect(slides.length).toBe(6);
  });

  it('14. should format slide subtitles informatively', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Healthcare Informatics',
      documentContent: 'EHR systems and HIPAA compliance.',
      slideCount: 6,
      style: 'Academic',
    });

    expect(slides[0].subtitle).toBeDefined();
  });

  it('15. should assign unique layout structures across the deck (title, content, split, stats, conclusion)', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Enterprise Architecture',
      documentContent: 'Comprehensive enterprise review with statistics.',
      slideCount: 8,
      style: 'Corporate',
    });

    const layouts = new Set(slides.map((s) => s.layout));
    expect(layouts.has('title')).toBe(true);
    expect(layouts.has('conclusion')).toBe(true);
  });
});
