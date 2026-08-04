// Cross-browser client-side file download helper for EasyDoc

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'md';

export interface DownloadOptions {
  documentId: string;
  title: string;
  format: ExportFormat;
  onStart?: () => void;
  onSuccess?: (filename: string) => void;
  onError?: (errorMessage: string) => void;
  onFinish?: () => void;
}

export async function downloadDocumentFile(options: DownloadOptions): Promise<boolean> {
  const { documentId, title, format, onStart, onSuccess, onError, onFinish } = options;

  try {
    if (onStart) onStart();

    console.log(`[Client Download] Requesting export for Document ID: ${documentId} | Format: ${format}`);

    const res = await fetch(`/api/documents/${documentId}/export?format=${format}`, {
      method: 'GET',
      headers: {
        'Accept': '*/*',
      },
    });

    if (!res.ok) {
      let errorMsg = `Download failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.error) errorMsg = errorJson.error;
      } catch (e) {
        // Fallback to text
      }
      throw new Error(errorMsg);
    }

    // Determine filename
    const disposition = res.headers.get('Content-Disposition');
    let filename = '';

    if (disposition && disposition.includes('filename=')) {
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    if (!filename) {
      const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() || 'document';
      const ext = format === 'pdf' ? 'html' : format;
      filename = `${safeTitle}.${ext}`;
    }

    // Get response blob
    const blob = await res.blob();

    if (blob.size === 0) {
      throw new Error('Downloaded file is empty (0 bytes).');
    }

    // Create Object URL and trigger browser download
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);

    console.log(`[Client Download] Download successful: ${filename} (${blob.size} bytes)`);

    if (onSuccess) onSuccess(filename);
    return true;
  } catch (err: any) {
    console.error(`[Client Download Error]:`, err);
    const message = err?.message || 'Failed to download document.';
    if (onError) onError(message);
    return false;
  } finally {
    if (onFinish) onFinish();
  }
}
