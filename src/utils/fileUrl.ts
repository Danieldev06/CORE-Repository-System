// src/utils/fileUrl.ts

/**
 * Base URL of the Django backend API.
 */
const API_ORIGIN = 'http://localhost:8000';

/**
 * Returns the direct download URL for a resource.
 * NOTE: this URL does NOT include auth. Use only for public resources
 *       or when you don't need authentication.
 */
export function getDownloadUrl(resourceId: string | number): string {
  return `${API_ORIGIN}/api/resources/${resourceId}/download/`;
}

/**
 * Returns an absolute URL for a file path returned by the API.
 */
export function resolveFileUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Downloads a resource with authentication.
 *
 * Fetches the file with the Authorization header, converts it to a
 * blob, and triggers a browser download. This ensures unapproved
 * submissions (visible only to the uploader, lecturer, or admin)
 * download correctly.
 *
 * @param resourceId - the resource ID
 * @param fallbackFilename - optional filename if the server doesn't set one
 */
export async function downloadResourceWithAuth(
  resourceId: string | number,
  fallbackFilename = 'resource.pdf'
): Promise<void> {
  const token = localStorage.getItem('core_token');
  const url = getDownloadUrl(resourceId);

  try {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Token ${token}`;

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(message || `Download failed (${response.status})`);
    }

    // Prefer the server-provided filename from Content-Disposition
    const disposition = response.headers.get('Content-Disposition') || '';
    let filename = fallbackFilename;
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1]);
    }

    // Get the blob and trigger a download
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Release the blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  } catch (err) {
    console.error('Download failed:', err);
    throw err;
  }
}