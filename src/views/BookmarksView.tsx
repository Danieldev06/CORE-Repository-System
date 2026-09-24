// src/views/BookmarksView.tsx
import { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCheck, Download, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context';
import { PageHeader, ResourceTypeBadge } from '../components/Layout';
import { api, extractApiError } from '../services/api';
import { adaptResources } from '../utils/adapters';
import { downloadResourceWithAuth } from '../utils/fileUrl';
import type { Resource } from '../types';

export default function BookmarksView() {
  const { navigate, bookmarkedIds, toggleBookmark, showToast } = useApp();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getResources();
      setResources(adaptResources(data));
      setError('');
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to load bookmarks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleDownload = async (resource: Resource) => {
    try {
      await downloadResourceWithAuth(resource.id, `${resource.title}.pdf`);
    } catch (err: any) {
      showToast({
        message: `Download failed: ${err.message || 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  // Filter resources to only bookmarked ones
  const bookmarked = resources.filter((r) => bookmarkedIds.includes(r.id));

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div>
        <PageHeader
          title="Bookmarks"
          breadcrumbs={[{ label: 'Bookmarks' }]}
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-navy-500 animate-spin mb-3" />
          <div className="text-navy-500 text-sm">Loading your bookmarks...</div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Error
  // ------------------------------------------------------------
  if (error) {
    return (
      <div>
        <PageHeader
          title="Bookmarks"
          breadcrumbs={[{ label: 'Bookmarks' }]}
        />
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Couldn't load bookmarks</div>
              <div className="text-xs">{error}</div>
              <button
                onClick={fetchResources}
                className="mt-2 text-xs font-semibold underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Main
  // ------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title="Bookmarks"
        subtitle={`${bookmarked.length} saved resource${bookmarked.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Bookmarks' }]}
      />
      <div className="p-6 max-w-4xl mx-auto">
        {bookmarked.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <Bookmark size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">No bookmarks yet</div>
            <div className="text-navy-400 text-sm mt-1 mb-4">
              Save resources to access them quickly
            </div>
            <button
              onClick={() => navigate('repository')}
              className="px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-semibold hover:bg-navy-700 transition"
            >
              Browse Repository
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarked.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-navy-100 p-4 flex items-center gap-4 hover:border-navy-300 hover:shadow-sm transition group"
              >
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate('resource-detail', { id: r.id })}
                    className="text-left"
                  >
                    <div className="font-semibold text-navy-800 text-sm group-hover:text-navy-600 transition leading-snug">
                      {r.title}
                    </div>
                    <div className="text-[11px] text-navy-400 mt-0.5">
                      {r.author}
                      {r.courseCode ? ` · ${r.courseCode}` : ''}
                      {r.academicYear ? ` · ${r.academicYear}` : ''}
                    </div>
                  </button>
                </div>
                <ResourceTypeBadge type={r.type} />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleBookmark(r.id)}
                    className="p-1.5 text-navy-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove bookmark"
                  >
                    <BookmarkCheck size={15} />
                  </button>
                  <button
                    onClick={() => handleDownload(r)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <Download size={11} /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}