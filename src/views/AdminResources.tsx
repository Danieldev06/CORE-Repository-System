// src/views/AdminResources.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Eye, CheckCircle, XCircle, Trash2, ChevronLeft, ChevronRight,
  X, Plus, Loader2, AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { useApp } from '../context';
import { RESOURCE_TYPE_LABELS } from '../data';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';
import { extractApiError, type Resource as ApiResource } from '../services/api';
import DocumentPreview from '../components/DocumentPreview';
import type { ResourceType, ResourceStatus } from '../types';

// ============================================================
// ADAPTERS
// ============================================================

const API_TYPE_MAP: Record<string, ResourceType> = {
  NOTES: 'lecture-notes',
  PASTPAPER: 'past-paper',
  DISSERTATION: 'dissertation',
  ARTICLE: 'research-paper',
};

interface AdaptedResource {
  id: string;
  title: string;
  author: string;
  type: ResourceType;
  courseCode: string;
  academicYear: string;
  fileType: string;
  isApproved: boolean;
  status: ResourceStatus;
  date: string;
  resourceTypeRaw: string;
}

function adaptResource(r: ApiResource): AdaptedResource {
  const ext = (r.file_pdf || '').split('.').pop()?.toUpperCase() || 'PDF';
  return {
    id: String(r.id),
    title: r.title,
    author: r.uploaded_by_name || r.uploaded_by_username || 'Unknown',
    type: API_TYPE_MAP[r.resource_type] || 'other',
    courseCode: r.course_code || '',
    academicYear: new Date(r.upload_date).getFullYear().toString(),
    fileType: ext,
    isApproved: r.is_approved,
    status: r.is_approved ? 'approved' : 'under-review',
    date: new Date(r.upload_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    resourceTypeRaw: r.resource_type,
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminResources() {
  const { navigate, showToast } = useApp();

  const [resources, setResources] = useState<AdaptedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [previewResource, setPreviewResource] = useState<AdaptedResource | null>(null);
  const PAGE_SIZE = 8;

  // ------------------------------------------------------------
  // Fetch
  // ------------------------------------------------------------
  const fetchResources = useCallback(
    async (showRefreshToast = false) => {
      const token = localStorage.getItem('core_token');
      if (!token) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/api/admin/resources/', {
          headers: { Authorization: `Token ${token}` },
        });

        if (!res.ok) {
          if (res.status === 403) throw new Error('You are not authorized.');
          throw new Error('Failed to load resources.');
        }

        const data: ApiResource[] = await res.json();
        setResources(data.map(adaptResource));
        setError('');
        if (showRefreshToast) {
          showToast({ message: 'Resources refreshed', type: 'success' });
        }
      } catch (err: any) {
        setError(extractApiError(err) || 'Failed to load resources.');
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

  // ------------------------------------------------------------
  // Filtering
  // ------------------------------------------------------------
  const filtered = useMemo(() => {
    let list = resources;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q) ||
          r.courseCode.toLowerCase().includes(q)
      );
    }
    if (selectedType) {
      list = list.filter((r) => r.resourceTypeRaw === selectedType);
    }
    if (selectedStatus === 'approved') {
      list = list.filter((r) => r.isApproved);
    } else if (selectedStatus === 'pending') {
      list = list.filter((r) => !r.isApproved);
    }
    return list;
  }, [resources, search, selectedType, selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ------------------------------------------------------------
  // Selection
  // ------------------------------------------------------------
  const toggleSelect = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((i) => i !== id) : [...s, id]));
  };
  const toggleAll = () => {
    setSelected((s) =>
      s.length === paginated.length ? [] : paginated.map((r) => r.id)
    );
  };

  // ------------------------------------------------------------
  // Single action
  // ------------------------------------------------------------
  const handleAction = async (
    resourceId: string,
    action: 'approve' | 'reject' | 'delete'
  ) => {
    const token = localStorage.getItem('core_token');
    if (!token) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/admin/resources/${resourceId}/action/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ action }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));

      showToast({ message: json.message, type: 'success' });
      await fetchResources(false);
    } catch (err: any) {
      showToast({
        message: `Action failed: ${extractApiError(err)}`,
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Bulk action
  // ------------------------------------------------------------
  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    const token = localStorage.getItem('core_token');
    if (!token || selected.length === 0) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        'http://localhost:8000/api/admin/resources/bulk/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ ids: selected.map(Number), action }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json));

      showToast({ message: json.message, type: 'success' });
      setSelected([]);
      await fetchResources(false);
    } catch (err: any) {
      showToast({
        message: `Bulk action failed: ${extractApiError(err)}`,
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin mb-3" />
        <div className="text-navy-500">Loading resources...</div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Error
  // ------------------------------------------------------------
  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold mb-1">Couldn't load resources</div>
            <div className="text-xs">{error}</div>
            <button
              onClick={handleRefresh}
              className="mt-2 text-xs font-semibold underline hover:no-underline"
            >
              Try again
            </button>
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
        title="Resource Management"
        subtitle="Manage all academic resources in the repository."
        breadcrumbs={[{ label: 'Resources' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition disabled:opacity-50"
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
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search resources..."
              className="w-full pl-8 pr-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 bg-white transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition"
          >
            <option value="">All Types</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition"
          >
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Review</option>
          </select>
          <div className="ml-auto text-xs text-navy-500">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm">
            <span className="font-semibold text-navy-800">
              {selected.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <CheckCircle size={12} /> Approve
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <XCircle size={12} /> Unapprove
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
            >
              <Trash2 size={12} /> Delete
            </button>
            <button
              onClick={() => setSelected([])}
              className="ml-auto text-navy-400 hover:text-navy-600"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === paginated.length && paginated.length > 0
                    }
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-navy-300 accent-navy-700"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                  Resource
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden lg:table-cell">
                  Author
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:table-cell">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-navy-400">
                    No resources found
                  </td>
                </tr>
              ) : (
                paginated.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-navy-50 transition ${
                      i < paginated.length - 1 ? 'border-b border-navy-50' : ''
                    } ${selected.includes(r.id) ? 'bg-navy-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="w-4 h-4 rounded border-navy-300 accent-navy-700"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-navy-800 text-sm max-w-[220px] truncate">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-navy-400 mt-0.5">
                        {r.courseCode} · {r.academicYear} · {r.fileType}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-sm text-navy-600 max-w-[140px] truncate">
                        {r.author}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <ResourceTypeBadge type={r.type} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-xs text-navy-500">{r.date}</div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewResource(r)}
                          title="Preview"
                          className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
                        >
                          <FileText size={13} />
                        </button>
                        <button
                          onClick={() => navigate('resource-detail', { id: r.id })}
                          title="View"
                          className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
                        >
                          <Eye size={13} />
                        </button>

                        {!r.isApproved ? (
                          <button
                            onClick={() => handleAction(r.id, 'approve')}
                            disabled={actionLoading}
                            title="Approve"
                            className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                          >
                            <CheckCircle size={13} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(r.id, 'reject')}
                            disabled={actionLoading}
                            title="Unapprove"
                            className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                          >
                            <XCircle size={13} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Delete "${r.title}" permanently? This cannot be undone.`
                              )
                            ) {
                              handleAction(r.id, 'delete');
                            }
                          }}
                          disabled={actionLoading}
                          title="Delete"
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-navy-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                    p === page
                      ? 'bg-navy-800 text-white'
                      : 'border border-navy-200 text-navy-600 hover:bg-navy-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
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