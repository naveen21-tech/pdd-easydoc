import { describe, it, expect } from 'vitest';
import { generatePresentationSlides, enhanceSlideContent } from '@/lib/ai/presentation-generator';
import { PresentationStyle } from '@/lib/types';

describe('Presentation Generator Service (lib/ai/presentation-generator.ts)', () => {
  it('should generate structured slide deck within 4 to 15 slides', async () => {
    const slides = await generatePresentationSlides({
      documentTitle: 'Next.js Scalable Architecture',
      documentContent: 'Next.js App Router, SSR, Server Components, and Edge Runtime caching strategies.',
      slideCount: 8,
      style: 'Technical',
    });

    expect(Array.isArray(slides)).toBe(true);
    expect(slides.length).toBe(8);
    expect(slides[0].layout).toBe('title');
    expect(slides[0].title).toBeDefined();
    expect(Array.isArray(slides[0].bullets)).toBe(true);
  });

  it('should support various presentation styles (Academic, Corporate, Minimal, Technical, Project Viva)', async () => {
    const styles: PresentationStyle[] = ['Academic', 'Corporate', 'Minimal', 'Technical', 'Project Viva'];

    for (const style of styles) {
      const slides = await generatePresentationSlides({
        documentTitle: `Testing ${style} Style`,
        documentContent: `Comprehensive overview of project features for ${style} presentation.`,
        slideCount: 6,
        style,
      });

      expect(slides.length).toBe(6);
      expect(slides[slides.length - 1].layout).toBe('conclusion');
    }
  });

  it('should enhance individual slide content with high-impact bullets and speaker notes', async () => {
    const enhanced = await enhanceSlideContent({
      deckTitle: 'Zero-Trust Cybersecurity Architecture',
      slideTitle: 'Identity Verification & Cryptographic Attestation',
      style: 'Technical',
    });

    expect(enhanced).toBeDefined();
    expect(enhanced.title).toBe('Identity Verification & Cryptographic Attestation');
    expect(enhanced.subtitle).toBeDefined();
    expect(Array.isArray(enhanced.bullets)).toBe(true);
    expect(enhanced.bullets.length).toBeGreaterThan(0);
    expect(typeof enhanced.notes).toBe('string');
  });
});
