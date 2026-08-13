import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadDocumentFile, DownloadOptions } from '@/lib/download';

describe('Client-Side File Download Helper (lib/download.ts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost:3000/123');
    window.URL.revokeObjectURL = vi.fn();
  });

  it('should trigger browser download on successful export API response', async () => {
    const mockBlob = new Blob(['mock binary content'], { type: 'text/markdown' });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      headers: new Headers({
        'Content-Disposition': 'attachment; filename="Research_Paper.md"',
      }),
      blob: vi.fn().mockResolvedValue(mockBlob),
    });

    const onStart = vi.fn();
    const onSuccess = vi.fn();
    const onFinish = vi.fn();

    const options: DownloadOptions = {
      documentId: 'doc-123',
      title: 'Research Paper',
      format: 'md',
      onStart,
      onSuccess,
      onFinish,
    };

    const result = await downloadDocumentFile(options);

    expect(result).toBe(true);
    expect(onStart).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith('Research_Paper.md');
    expect(onFinish).toHaveBeenCalled();
    expect(window.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should handle API errors and trigger onError callback', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      json: vi.fn().mockResolvedValue({ error: 'Document not found' }),
    });

    const onError = vi.fn();

    const result = await downloadDocumentFile({
      documentId: 'invalid-id',
      title: 'Invalid',
      format: 'pdf',
      onError,
    });

    expect(result).toBe(false);
    expect(onError).toHaveBeenCalledWith('Document not found');
  });
});
