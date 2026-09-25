// src/views/ResourceDetail.tsx
import { useState, useEffect } from 'react';
import {
  Download, Bookmark, BookmarkCheck, FileText, Calendar, User,
  Building2, BookOpen, Tag, Eye, ExternalLink, Share2, AlertCircle, Loader2
} from 'lucide-react';
import { useApp } from '../context';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';
import { api, extractApiError, type Resource as ApiResource } from '../services/api';
import { adaptResources } from '../utils/adapters';
import { downloadResourceWithAuth } from '../utils/fileUrl';
import DocumentPreview from '../components/DocumentPreview';
import type { Resource } from '../types';

export default function ResourceDetail() {
  const { params, navigate, bookmarkedIds, toggleBookmark, addDownload, showToast } = useApp();
  const [resource, setResource] = useState<Resource | null>(null);
  const [related, setRelated] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);   // ← NEW

  // Fetch the resource detail
  useEffect(() => {
    const fetchResource = async () => {
      if (!params.id) {
        setError('No resource ID provided.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('core_token');
        const url = `http://localhost:8000/api/resources/${params.id}/`;
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Token ${token}`;

        const res = await fetch(url, { headers });
        if (!res.ok) {
          if (res.status === 403) throw new Error('You are not authorized to view this resource.');
          if (res.status === 404) throw new Error('Resource not found.');
          throw new Error('Failed to load resource.');
        }

        const data: ApiResource = await res.json();
        const [adapted] = adaptResources([data]);
        setResource(adapted);

        // Fetch related resources from the same programme
        const allResources = await api.getResources();
        const allAdapted = adaptResources(allResources);
        const relatedList = allAdapted
          .filter((r) => r.id !== adapted.id && (r.courseCode === adapted.courseCode || r.type === adapted.type))
          .slice(0, 3);
        setRelated(relatedList);
        setError('');
      } catch (err: any) {
        setError(extractApiError(err) || 'Failed to load resource.');
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [params.id]);

  const handleDownload = async () => {
    if (!resource) return;
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

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin mb-3" />
        <div className="text-navy-500">Loading resource...</div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Error
  // ------------------------------------------------------------
  if (error || !resource) {
    return (
      <div>
        <PageHeader
          title="Resource Not Available"
          breadcrumbs={[{ label: 'Repository', view: 'repository' }, { label: 'Resource' }]}
        />
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Couldn't load resource</div>
              <div className="text-xs">{error}</div>
              <button
                onClick={() => navigate('repository')}
                className="mt-2 text-xs font-semibold underline hover:no-underline"
              >
                Back to Repository
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bookmarked = bookmarkedIds.includes(resource.id);

  const metaItems = [
    { icon: <User size={14} />, label: 'Author / Uploader', value: resource.author },
    ...(resource.courseCode ? [{ icon: <FileText size={14} />, label: 'Course / Module', value: `${resource.courseCode}${resource.course ? ' — ' + resource.course : ''}` }] : []),
    { icon: <Calendar size={14} />, label: 'Academic Year', value: resource.academicYear },
    { icon: <Calendar size={14} />, label: 'Date Uploaded', value: resource.dateUploaded },
    { icon: <FileText size={14} />, label: 'File Type', value: resource.fileType },
  ];

  return (
    <div>
      <PageHeader
        title={resource.title}
        breadcrumbs={[
          { label: 'Repository', view: 'repository' },
          { label: resource.title.length > 40 ? resource.title.slice(0, 40) + '…' : resource.title },
        ]}
      />

      <div className="p-6 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <ResourceTypeBadge type={resource.type} />
                <StatusBadge status={resource.status} />
                <span className="text-[11px] text-navy-400 ml-auto">{resource.fileType}</span>
              </div>
              <h1 className="text-xl font-bold text-navy-900 leading-snug mb-3">{resource.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-500 mb-4">
                <span className="flex items-center gap-1.5 font-medium text-navy-700">
                  <User size={13} />
                  {resource.author}
                </span>
                {resource.courseCode && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={13} />
                    {resource.courseCode}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {resource.academicYear}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-navy-50">
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
                >
                  <Download size={16} /> Download
                </button>
                <button
                  onClick={() => toggleBookmark(resource.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition ${
                    bookmarked
                      ? 'bg-navy-50 border-navy-300 text-navy-800'
                      : 'bg-white border-navy-200 hover:bg-navy-50 text-navy-700'
                  }`}
                >
                  {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                  {bookmarked ? 'Bookmarked' : 'Bookmark'}
                </button>
                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(window.location.href);
                      showToast({ message: 'Link copied to clipboard', type: 'success' });
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
                >
                  <Share2 size={16} /> Share
                </button>
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-navy-400">
                <span className="flex items-center gap-1">
                  <Download size={11} />
                  {resource.downloads} downloads
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={11} />
                  {resource.views} views
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 mb-3 text-sm uppercase tracking-wide">
                Description
              </h3>
              <p className="text-sm text-navy-600 leading-relaxed">{resource.description}</p>
            </div>

            {/* Document Preview Card */}
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100 bg-navy-50">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-700">
                  <FileText size={15} /> Document Preview
                </div>
                <button
                  onClick={() => setPreviewOpen(true)}
                  className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open full preview
                </button>
              </div>
              <div className="bg-gray-50 h-72 flex items-center justify-center border-b border-navy-100">
                <div className="text-center">
                  <div className="w-16 h-20 bg-white border-2 border-navy-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <FileText size={28} className="text-navy-300" />
                  </div>
                  <div className="text-navy-500 text-sm font-medium">
                    {resource.fileType} Document
                  </div>
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="mt-3 text-xs text-navy-700 hover:text-navy-900 font-semibold underline"
                  >
                    Open preview
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Metadata */}
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 mb-4 text-sm uppercase tracking-wide">
                Resource Information
              </h3>
              <div className="space-y-3.5">
                {metaItems.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-navy-50 flex items-center justify-center text-navy-500 shrink-0 mt-0.5">
                      {m.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">
                        {m.label}
                      </div>
                      <div className="text-xs text-navy-700 font-medium mt-0.5">{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related resources */}
            {related.length > 0 && (
              <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
                <h3 className="font-semibold text-navy-800 mb-3 text-sm uppercase tracking-wide">
                  Related Resources
                </h3>
                <div className="space-y-3">
                  {related.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => navigate('resource-detail', { id: r.id })}
                      className="w-full text-left group flex items-start gap-2.5"
                    >
                      <div className="w-8 h-10 rounded bg-navy-50 border border-navy-100 flex items-center justify-center shrink-0">
                        <FileText size={14} className="text-navy-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-navy-700 group-hover:text-navy-500 transition line-clamp-2 leading-snug">
                          {r.title}
                        </div>
                        <div className="text-[10px] text-navy-400 mt-0.5">{r.author}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cite this */}
            <div className="bg-navy-50 rounded-xl border border-navy-100 p-4">
              <div className="text-xs font-semibold text-navy-700 mb-2 uppercase tracking-wide">
                Cite This Resource
              </div>
              <p className="text-[11px] text-navy-500 leading-relaxed">
                {resource.author} ({resource.academicYear}). <em>{resource.title}</em>. Cavendish University Zambia Repository.
              </p>
              <button
                onClick={() => {
                  const citation = `${resource.author} (${resource.academicYear}). ${resource.title}. Cavendish University Zambia Repository.`;
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(citation);
                    showToast({ message: 'Citation copied', type: 'success' });
                  }
                }}
                className="mt-2 text-[11px] text-navy-600 hover:text-navy-800 font-semibold"
              >
                Copy citation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Preview Modal */}
      {previewOpen && (
        <DocumentPreview
          resourceId={resource.id}
          title={resource.title}
          fileType={resource.fileType}
          onClose={() => setPreviewOpen(false)}
          onDownloadSuccess={() => addDownload(resource.id)}
        />
      )}
    </div>
  );
}