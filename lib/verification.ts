import crypto from 'crypto';

export function computeDocumentChecksum(content: string, title: string): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${title}::${content}`);
  return hash.digest('hex');
}

export function generateVerificationId(): string {
  const year = new Date().getFullYear();
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EDOC-${year}-${randomHex}`;
}
