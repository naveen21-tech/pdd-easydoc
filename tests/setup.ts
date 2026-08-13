import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Set mock environment variables for unit tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock-supabase.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.GROQ_API_KEY = 'mock-key';
process.env.OPENAI_API_KEY = 'mock-key';
process.env.ANTHROPIC_API_KEY = 'mock-key';
process.env.GEMINI_API_KEY = 'mock-key';
process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';

// Global fetch mock to prevent real network calls
const originalFetch = global.fetch;
global.fetch = vi.fn(async (url: any, options: any) => {
  const urlStr = typeof url === 'string' ? url : url?.toString() || '';
  if (urlStr.includes('api.groq.com') || urlStr.includes('googleapis.com') || urlStr.includes('api.openai.com') || urlStr.includes('api.anthropic.com')) {
    return {
      ok: false,
      status: 401,
      json: async () => ({ error: 'Mocked API error for unit testing' }),
      text: async () => 'Mocked API error',
    } as any;
  }
  if (originalFetch) {
    return originalFetch(url, options);
  }
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  } as any;
});

// Mock SpeechSynthesis and SpeechRecognition in JSDOM
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'speechSynthesis', {
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    },
    writable: true,
  });

  (window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
    text,
    rate: 1,
    pitch: 1,
  }));
}
