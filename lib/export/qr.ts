import QRCode from 'qrcode';

export async function generateQrDataUrl(
  text: string,
  options?: { darkColor?: string; lightColor?: string; width?: number }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      margin: 1,
      width: options?.width || 180,
      color: {
        dark: options?.darkColor || '#4C1D95',
        light: options?.lightColor || '#FFFFFF',
      },
    });
    return dataUrl;
  } catch (err) {
    console.error('QR code generation error:', err);
    return '';
  }
}

export function generateVerificationCode(): string {
  const year = new Date().getFullYear();
  const hex = Math.random().toString(16).substring(2, 10).toUpperCase();
  return `EDOC-${year}-${hex}`;
}
