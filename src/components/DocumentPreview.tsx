// src/components/DocumentPreview.tsx
import { useEffect, useState } from 'react';
import {
  X, Download, FileText, Loader2, AlertCircle, ExternalLink,
} from 'lucide-react';
import {
  getPreviewUrl,
  downloadResourceWithAuth,
} from '../utils/fileUrl';

interface DocumentPreviewProps {
  resourceId: string | number;
  title: string;
  fileType?: string;
  onClose: () => void;
  onDownloadSuccess?: () => void;
}

export default function DocumentPreview({
  resourceId,
  title,
  fileType,
  onClose,
  onDownloadSuccess,
}: DocumentPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Fetch the preview with auth and convert to blob URL
  useEffect(() => {
    let revokeMe: string | null = null;

    const fetchPreview = async () => {
      const token = localStorage.getItem('core_token');
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Token ${token}`;

        const response = await fetch(getPreviewUrl(resourceId), { headers });

        if (!response.ok) {
          if (response.status === 403)
            throw new Error('You are not authorized to view this file.');
          if (response.status === 404) throw new Error('File not found.');
          if (response.status === 502)
            throw new Error('The file is currently unavailable.');
          throw new Error('Failed to load preview.');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        revokeMe = url;
        setBlobUrl(url);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to load preview.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      if (revokeMe) URL.revokeObjectURL(revokeMe);
    };
  }, [resourceId]);

  // Close on ESC + lock body scroll
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadResourceWithAuth(resourceId, `${title}.pdf`);
      onDownloadSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-navy-100 bg-navy-50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center shrink-0">
              <FileText size={15} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-navy-900 truncate">
                {title}
              </div>
              <div className="text-[11px] text-navy-400">
                {fileType || 'Document'} · Preview mode
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download size={12} /> Download
                </>
              )}
            </button>

            <button
              onClick={() => window.open(getPreviewUrl(resourceId), '_blank')}
              className="p-1.5 text-navy-500 hover:text-navy-800 hover:bg-navy-100 rounded-lg transition"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-navy-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 bg-navy-50 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 size={40} className="text-navy-500 animate-spin mb-3" />
              <div className="text-navy-500 text-sm">Loading document...</div>
            </div>
          )}

          {!loading && error && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm max-w-md">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold mb-1">
                    Couldn't preview file
                  </div>
                  <div className="text-xs">{error}</div>
                  <button
                    onClick={handleDownload}
                    className="mt-3 text-xs font-semibold underline hover:no-underline"
                  >
                    Try downloading instead
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <iframe
              src={blobUrl}
              title={`Preview of ${title}`}
              className="w-full h-full border-none"
            />
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2 border-t border-navy-100 bg-white text-center text-[11px] text-navy-400">
          Tip: Use your browser's PDF controls to zoom, print, or save
        </div>
      </div>
    </div>
  );
}