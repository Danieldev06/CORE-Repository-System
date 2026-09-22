// src/views/RepositoryView.tsx
import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Grid, List, Download, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, X, Loader2, Info } from 'lucide-react';
import { useApp } from '../context';
import { RESOURCE_TYPE_LABELS } from '../data';
import { PageHeader, ResourceTypeBadge } from '../components/Layout';
import { api } from '../services/api';
import { adaptResources } from '../utils/adapters';
import { downloadResourceWithAuth } from '../utils/fileUrl';
import type { Resource } from '../types';

// Years the API returns (upload year)
const UPLOAD_YEARS = ['2026', '2025', '2024', '2023'];

function ResourceGridCard({ resource }: { resource: Resource }) {
  const { navigate, bookmarkedIds, toggleBookmark, addDownload, showToast } = useApp();
  const bookmarked = bookmarkedIds.includes(resource.id);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await downloadResourceWithAuth(resource.id, `${resource.title}.pdf`);
      addDownload(resource.id);
    } catch (err: any) {
      showToast({
        message: `Download failed: ${err.message || 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 hover:border-navy-300 hover:shadow-md transition-all duration-150 flex flex-col group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <ResourceTypeBadge type={resource.type} />
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(resource.id);
          }}
          className={`p-1 rounded-lg transition ${bookmarked ? 'text-navy-700' : 'text-navy-300 hover:text-navy-600'}`}
        >
          {bookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
        </button>
      </div>
      <button onClick={() => navigate('resource-detail', { id: resource.id })} className="text-left flex-1">
        <h3 className="font-semibold text-navy-800 text-sm leading-snug mb-2 group-hover:text-navy-600 transition line-clamp-2">
          {resource.title}
        </h3>
        <p className="text-navy-400 text-xs leading-relaxed line-clamp-2 mb-3">
          {resource.description}
        </p>
      </button>
      <div className="border-t border-navy-50 pt-3 mt-auto space-y-2">
        <div className="flex items-center justify-between text-[11px] text-navy-400">
          <span className="font-medium text-navy-600 truncate">{resource.author}</span>
          <span>{resource.academicYear}</span>
        </div>
        {resource.courseCode && (
          <div className="text-[11px] text-navy-400">
            {resource.courseCode} · {resource.fileType}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-navy-400 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Download size={10} /> {resource.downloads}
            </span>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
          >
            <Download size={11} /> Download
          </button>
        </div>
      </div>
    </div>
  );
}

function ResourceListRow({ resource }: { resource: Resource }) {
  const { navigate, bookmarkedIds, toggleBookmark, addDownload, showToast } = useApp();
  const bookmarked = bookmarkedIds.includes(resource.id);

  const handleDownload = async () => {
    try {
      await downloadResourceWithAuth(resource.id, `${resource.title}.pdf`);
      addDownload(resource.id);
    } catch (err: any) {
      showToast({
        message: `Download failed: ${err.message || 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-navy-50 hover:bg-navy-50 transition group">
      <div className="flex-1 min-w-0">
        <button onClick={() => navigate('resource-detail', { id: resource.id })} className="text-left">
          <div className="font-semibold text-navy-800 text-sm group-hover:text-navy-600 transition truncate">
            {resource.title}
          </div>
          <div className="text-[11px] text-navy-400 mt-0.5">
            {resource.author} · {resource.courseCode ?? ''} · {resource.academicYear} · {resource.fileType}
          </div>
        </button>
      </div>
      <div className="hidden md:block shrink-0">
        <ResourceTypeBadge type={resource.type} />
      </div>
      <div className="hidden lg:flex items-center gap-1 text-[11px] text-navy-400 shrink-0">
        <Download size={11} />
        {resource.downloads}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => toggleBookmark(resource.id)}
          className={`p-1.5 rounded-lg transition ${bookmarked ? 'text-navy-700' : 'text-navy-300 hover:text-navy-600'}`}
        >
          {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
        >
          <Download size={11} /> Download
        </button>
      </div>
    </div>
  );
}

export default function RepositoryView() {
  const { user } = useApp();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedType, setSelectedType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // Fetch resources from API (backend auto-scopes by user's programme)
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const data = await api.getResources();
        const adapted = adaptResources(data);
        setResources(adapted);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch resources:', err);
        setError('Failed to load resources. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  // Filter resources
  const filtered = useMemo(() => {
    let res = resources;

    if (search) {
      const q = search.toLowerCase();
      res = res.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.author.toLowerCase().includes(q) ||
          (r.courseCode ?? '').toLowerCase().includes(q) ||
          (r.description ?? '').toLowerCase().includes(q)
      );
    }
    if (selectedType) res = res.filter((r) => r.type === selectedType);
    if (selectedYear) res = res.filter((r) => r.academicYear === selectedYear);
    return res;
  }, [resources, search, selectedType, selectedYear]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSelectedType('');
    setSelectedYear('');
    setSearch('');
    setPage(1);
  };
  const hasFilters = search || selectedType || selectedYear;

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin" />
        <span className="ml-3 text-navy-600 text-lg">Loading resources...</span>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-red-500 text-lg mb-2">⚠️ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-navy-600 hover:text-navy-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  // Main
  return (
    <div>
      <PageHeader
        title="Academic Repository"
        subtitle="Discover learning resources, research, dissertations, theses, and other academic materials."
        breadcrumbs={[{ label: 'Repository' }]}
      />

      <div className="p-6">
        {/* Scope banner */}
        {user?.programme && (
          <div className="bg-navy-50 border border-navy-200 rounded-xl p-3.5 flex items-start gap-3 mb-5 text-xs text-navy-700">
            <Info size={14} className="text-navy-500 shrink-0 mt-0.5" />
            <div>
              Showing resources from your programme{' '}
              <strong className="text-navy-800">{user.programme}</strong>
              {' '}plus resources shared across all faculties.
            </div>
          </div>
        )}

        {/* Search bar */}
        <div className="relative mb-5">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search resources, courses, or authors..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-navy-200 rounded-xl text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters + controls */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-1 text-xs text-navy-500 font-medium">
            <Filter size={13} /> Filters:
          </div>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 focus:border-navy-300 transition"
          >
            <option value="">All Resource Types</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setPage(1);
            }}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-1.5 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 focus:border-navy-300 transition"
          >
            <option value="">All Years</option>
            {UPLOAD_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X size={12} /> Clear filters
            </button>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-navy-500">
              {filtered.length} resource{filtered.length !== 1 ? 's' : ''}
            </span>
            <div className="flex border border-navy-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition ${viewMode === 'grid' ? 'bg-navy-800 text-white' : 'text-navy-400 hover:bg-navy-50'}`}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition ${viewMode === 'list' ? 'bg-navy-800 text-white' : 'text-navy-400 hover:bg-navy-50'}`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {paginated.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <BookmarkCheck size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">No resources found</div>
            <div className="text-navy-400 text-sm mt-1">
              {hasFilters
                ? 'Try adjusting your search or filters'
                : 'No resources have been published yet'}
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-navy-600 hover:text-navy-800 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map((r) => (
              <ResourceGridCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <div className="bg-navy-50 border-b border-navy-100 px-4 py-2.5 flex items-center gap-4">
              <span className="flex-1 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                Resource
              </span>
              <span className="hidden md:block w-32 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                Type
              </span>
              <span className="hidden lg:block w-16 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                Downloads
              </span>
              <span className="w-24 text-xs font-semibold text-navy-600 uppercase tracking-wide text-right">
                Actions
              </span>
            </div>
            {paginated.map((r) => (
              <ResourceListRow key={r.id} resource={r} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition ${
                  p === page ? 'bg-navy-800 text-white' : 'border border-navy-200 text-navy-600 hover:bg-navy-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}