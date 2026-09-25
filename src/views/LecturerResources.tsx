import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Eye, Edit2, Trash2, TrendingUp, FileText, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../context';
import { PageHeader, ResourceTypeBadge, StatusBadge } from '../components/Layout';
import { resourceApi, extractApiError, type Resource as ApiResource } from '../services/api';
import DocumentPreview from '../components/DocumentPreview';
import type { Resource as FrontendResource, ResourceType, ResourceStatus } from '../types';

// ============================================================
// ADAPTER: API Resource → Frontend Resource
// ============================================================

const API_TYPE_MAP: Record<string, ResourceType> = {
  NOTES: 'lecture-notes',
  PASTPAPER: 'past-paper',
  DISSERTATION: 'dissertation',
  ARTICLE: 'research-paper',
};

function adaptResource(r: ApiResource): FrontendResource {
  const type = API_TYPE_MAP[r.resource_type] || 'other';
  const status: ResourceStatus = r.is_approved ? 'published' : 'under-review';
  const ext = (r.file_pdf || '').split('.').pop()?.toUpperCase() || 'PDF';

  return {
    id: String(r.id),
    title: r.title,
    type,
    author: r.uploaded_by_name || r.uploaded_by_username || 'Unknown',
    authorId: String(r.uploaded_by ?? ''),
    school: '',
    programme: r.course_name || '',
    course: r.course_name || '',
    courseCode: r.course_code || '',
    academicYear: new Date(r.upload_date).getFullYear().toString(),
    dateUploaded: r.upload_date,
    fileType: ext,
    fileSize: '',
    description: r.title,
    keywords: [],
    status,
    downloads: r.download_count,
    views: r.download_count,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function LecturerResources() {
  const { user, navigate, showToast } = useApp();
  const [resources, setResources] = useState<FrontendResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [previewResource, setPreviewResource] = useState<FrontendResource | null>(null);

  const fetchResources = useCallback(
    async (showRefreshToast = false) => {
      const token = localStorage.getItem('core_token');
      if (!token) {
        setError('Your session has expired. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const data = await resourceApi.getMySubmissions(token);
        setResources(data.map(adaptResource));
        setError('');
        if (showRefreshToast) {
          showToast({ message: 'Resources refreshed', type: 'success' });
        }
      } catch (err: any) {
        setError(extractApiError(err));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchResources(true);
  };

  return (
    <div>
      <PageHeader
        title="My Resources"
        subtitle={`${resources.length} resource${resources.length !== 1 ? 's' : ''} uploaded`}
        breadcrumbs={[{ label: 'My Resources' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => navigate('upload-resource')}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
            >
              <Plus size={15} /> Upload Resource
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-5xl mx-auto">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-navy-100">
            <Loader2 size={36} className="text-navy-500 animate-spin mb-3" />
            <div className="text-navy-500 text-sm">Loading your resources...</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Couldn't load your resources</div>
              <div className="text-xs">{error}</div>
              <button
                onClick={handleRefresh}
                className="mt-2 text-xs font-semibold underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && resources.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <FileText size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">No resources uploaded yet</div>
            <div className="text-navy-400 text-sm mt-1 mb-4">
              Start contributing to the repository by uploading your first resource.
            </div>
            <button
              onClick={() => navigate('upload-resource')}
              className="px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-semibold hover:bg-navy-700 transition"
            >
              Upload First Resource
            </button>
          </div>
        )}

        {/* Resources table */}
        {!loading && !error && resources.length > 0 && (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50 border-b border-navy-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                    Resource
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:table-cell">
                    Type
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden lg:table-cell">
                    Downloads
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-navy-50 transition ${
                      i < resources.length - 1 ? 'border-b border-navy-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-navy-800 text-sm leading-snug max-w-[220px]">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-navy-400 mt-0.5">
                        {r.courseCode ?? ''}
                        {r.courseCode && ' · '}
                        {r.academicYear} · {r.fileType}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <ResourceTypeBadge type={r.type} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-xs text-navy-500">
                        <Download size={11} /> {r.downloads}
                        <TrendingUp size={11} className="ml-2" /> {r.views} views
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewResource(r)}
                          className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
                          title="Preview"
                        >
                          <FileText size={13} />
                        </button>
                        <button
                          onClick={() => navigate('resource-detail', { id: r.id })}
                          className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
                          title="View"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() =>
                            showToast({ message: 'Edit resource — coming soon', type: 'info' })
                          }
                          className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() =>
                            showToast({
                              message: 'Delete requires confirmation',
                              type: 'error',
                            })
                          }
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewResource && (
        <DocumentPreview
          resourceId={previewResource.id}
          title={previewResource.title}
          fileType={previewResource.fileType}
          onClose={() => setPreviewResource(null)}
        />
      )}
    </div>
  );
}