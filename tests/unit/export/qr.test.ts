import { describe, it, expect } from 'vitest';
import { generateQrDataUrl, generateVerificationCode } from '@/lib/export/qr';

describe('QR Code & Document Verification Service (lib/export/qr.ts)', () => {
  it('should generate base64 data URL for QR code', async () => {
    const dataUrl = await generateQrDataUrl('https://studentdoc.saveetha.com/verify/123');

    expect(dataUrl).toBeDefined();
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('should generate formatted unique verification code', () => {
    const code = generateVerificationCode();
    const currentYear = new Date().getFullYear();

    expect(code).toBeDefined();
    expect(code.startsWith(`EDOC-${currentYear}-`)).toBe(true);
    expect(code.length).toBeGreaterThan(10);
  });
});
