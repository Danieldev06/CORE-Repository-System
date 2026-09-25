import { useState, useEffect, useCallback } from 'react';
import { BookOpen, FileText, Clock, Bookmark, Download, TrendingUp, Upload, ChevronRight, AlertCircle, CheckCircle, GraduationCap, Loader2 } from 'lucide-react';
import { useApp } from '../context';
import { StatusBadge, ResourceTypeBadge } from '../components/Layout';
import { api, resourceApi, extractApiError, type Resource as ApiResource } from '../services/api';
import { adaptResources } from '../utils/adapters';
import { downloadResourceWithAuth } from '../utils/fileUrl';
import DocumentPreview from '../components/DocumentPreview';
import type { Resource, Submission, ResourceType, ResourceStatus } from '../types';

// ============================================================
// ADAPTER: API Resource → Frontend Submission
// ============================================================

const API_TYPE_MAP: Record<string, ResourceType> = {
  NOTES: 'lecture-notes',
  PASTPAPER: 'past-paper',
  DISSERTATION: 'dissertation',
  ARTICLE: 'research-paper',
};

function adaptSubmission(r: ApiResource): Submission {
  const type = API_TYPE_MAP[r.resource_type] || 'other';
  const status: ResourceStatus = r.is_approved ? 'approved' : 'under-review';
  const ext = (r.file_pdf || '').split('.').pop()?.toUpperCase() || 'PDF';

  return {
    id: String(r.id),
    title: r.title,
    studentId: String(r.uploaded_by ?? ''),
    studentName: r.uploaded_by_name || r.uploaded_by_username || 'Unknown',
    studentEmail: r.uploaded_by_username || '',
    programme: r.course_name || '',
    school: '',
    type,
    submittedDate: new Date(r.upload_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    status,
    academicYear: new Date(r.upload_date).getFullYear().toString(),
    course: r.course_name || '',
    courseCode: r.course_code || '',
    fileType: ext,
    fileSize: '',
    abstract: '',
    resourceId: String(r.id),
  };
}

// ============================================================
// STATS CARD
// ============================================================

function StatsCard({
  icon, label, value, sub, color, onClick, loading,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  color: string; onClick?: () => void; loading?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-navy-100 p-5 shadow-sm ${onClick ? 'cursor-pointer hover:border-navy-300 hover:shadow-md transition-all' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {sub && (
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
            {sub}
          </span>
        )}
      </div>
      <div className="text-[26px] font-bold text-navy-900 leading-none">
        {loading ? <span className="inline-block w-8 h-6 bg-navy-50 rounded animate-pulse" /> : value}
      </div>
      <div className="text-xs text-navy-500 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

// ============================================================
// RESOURCE CARD
// ============================================================

function ResourceCard({ resource, onDownload }: { resource: Resource; onDownload: (r: Resource) => void }) {
  const { navigate, bookmarkedIds, toggleBookmark } = useApp();
  const bookmarked = bookmarkedIds.includes(resource.id);
  const [showPreview, setShowPreview] = useState(false);

  const typeColors: Record<string, string> = {
    'lecture-notes': 'from-navy-700 to-navy-900',
    'past-paper': 'from-purple-700 to-purple-900',
    'dissertation': 'from-blue-700 to-blue-900',
    'research-proposal': 'from-teal-700 to-teal-900',
    'research-paper': 'from-sky-700 to-sky-900',
    'academic-guide': 'from-slate-600 to-slate-800',
  };
  const gradient = typeColors[resource.type] ?? 'from-navy-700 to-navy-900';

  return (
    <div className="bg-white rounded-xl border border-navy-100 overflow-hidden hover:border-navy-300 hover:shadow-md transition-all group">
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <ResourceTypeBadge type={resource.type} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(resource.id);
            }}
            className={`p-1 rounded-lg transition ${bookmarked ? 'text-navy-700' : 'text-navy-200 hover:text-navy-500'}`}
          >
            <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
        <button onClick={() => navigate('resource-detail', { id: resource.id })} className="text-left w-full">
          <h3 className="font-semibold text-navy-800 text-sm leading-snug mb-2 group-hover:text-navy-600 transition line-clamp-2">
            {resource.title}
          </h3>
        </button>
        <div className="text-[11px] text-navy-400 space-y-0.5 mb-3">
          <div className="font-medium text-navy-600 truncate">{resource.author}</div>
          <div className="flex items-center gap-2">
            {resource.courseCode && <span>{resource.courseCode}</span>}
            <span>·</span>
            <span>{resource.academicYear}</span>
            <span>·</span>
            <span>{resource.fileType}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-navy-50">
          <div className="flex items-center gap-1 text-[11px] text-navy-400">
            <Download size={10} className="shrink-0" />
            {resource.downloads}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPreview(true)}
              className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
              title="Preview"
            >
              <FileText size={13} />
            </button>
            <button
              onClick={() => onDownload(resource)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
            >
              <Download size={11} /> Download
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <DocumentPreview
          resourceId={resource.id}
          title={resource.title}
          fileType={resource.fileType}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function StudentDashboard() {
  const { user, navigate, bookmarkedIds, showToast } = useApp();

  const [resources, setResources] = useState<Resource[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('core_token');
    try {
      setLoading(true);

      // Fetch resources (public + scoped)
      const resourcesData = await api.getResources();
      const adaptedResources = adaptResources(resourcesData);
      setResources(adaptedResources);

      // Fetch user's submissions (authenticated)
      if (token) {
        const subsData = await resourceApi.getMySubmissions(token);
        setSubmissions(subsData.map(adaptSubmission));
      }

      setError('');
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // ------------------------------------------------------------
  // Derived data
  // ------------------------------------------------------------
  const pendingCount = submissions.filter((s) =>
    ['submitted', 'under-review'].includes(s.status)
  ).length;
  const approvedCount = submissions.filter((s) =>
    ['approved', 'published'].includes(s.status)
  ).length;
  const hasRejected = submissions.some((s) => s.status === 'rejected');

  const recent = resources.slice(0, 4);
  const popular = [...resources].sort((a, b) => b.downloads - a.downloads).slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // ------------------------------------------------------------
  // Loading screen
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin mb-3" />
        <div className="text-navy-500">Loading your dashboard...</div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Error screen
  // ------------------------------------------------------------
  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold mb-1">Couldn't load dashboard</div>
            <div className="text-xs">{error}</div>
            <button
              onClick={fetchData}
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
    <div className="p-6 max-w-6xl mx-auto space-y-7">
      {/* Welcome hero */}
      <div className="relative bg-navy-900 rounded-2xl p-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-navy-800 opacity-60" />
          <div className="absolute right-8 -bottom-8 w-48 h-48 rounded-full bg-navy-800 opacity-40" />
          <div className="absolute left-1/2 top-0 w-px h-full bg-white/5" />
        </div>
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <div className="text-white/50 text-sm font-medium flex items-center gap-2 mb-1">
              <GraduationCap size={14} /> {greeting}
            </div>
            <h2 className="text-white text-[22px] font-bold leading-tight">{user?.name}</h2>
            <p className="text-white/45 text-sm mt-1.5 max-w-md leading-relaxed">
              Explore academic resources and research materials from Cavendish University Zambia. Your repository is ready.
            </p>
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => navigate('repository')}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-navy-50 text-navy-900 font-semibold rounded-xl text-sm transition"
              >
                <BookOpen size={14} /> Browse Repository
              </button>
              <button
                onClick={() => navigate('submit-work')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-sm transition border border-white/15"
              >
                <Upload size={14} /> Submit Work
              </button>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0 text-right">
            <div className="text-white/25 text-[11px] font-semibold uppercase tracking-wide">Enrolled</div>
            <div className="text-white/70 text-sm font-medium">{user?.programme}</div>
            <div className="text-white/35 text-xs">{user?.school?.replace('School of ', 'Sch. of ')}</div>
            <div className="text-white/35 text-xs mt-1">Year {user?.yearOfStudy}</div>
            <div className="mt-2 px-2 py-0.5 bg-white/10 rounded-md text-[10px] text-white/50 font-medium">
              {user?.studentId}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={<BookOpen size={19} className="text-navy-700" />}
          label="Available Resources"
          value={resources.length}
          color="bg-navy-50"
          onClick={() => navigate('repository')}
        />
        <StatsCard
          icon={<Upload size={19} className="text-purple-600" />}
          label="My Submissions"
          value={submissions.length}
          color="bg-purple-50"
          onClick={() => navigate('my-submissions')}
        />
        <StatsCard
          icon={<Clock size={19} className="text-amber-600" />}
          label="Pending Reviews"
          value={pendingCount}
          sub={pendingCount > 0 ? 'Awaiting' : undefined}
          color="bg-amber-50"
          onClick={() => navigate('my-submissions')}
        />
        <StatsCard
          icon={<Bookmark size={19} className="text-blue-600" />}
          label="Bookmarked"
          value={bookmarkedIds.length}
          color="bg-blue-50"
          onClick={() => navigate('bookmarks')}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Browse Repository', icon: <BookOpen size={15} />, view: 'repository' as const, color: 'bg-navy-800 text-white hover:bg-navy-700 shadow-sm' },
          { label: 'Submit Work', icon: <Upload size={15} />, view: 'submit-work' as const, color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50' },
          { label: 'My Submissions', icon: <FileText size={15} />, view: 'my-submissions' as const, color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50' },
          { label: 'Download History', icon: <Download size={15} />, view: 'download-history' as const, color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50' },
        ].map((a) => (
          <button
            key={a.view}
            onClick={() => navigate(a.view)}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition ${a.color}`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>

      {/* Rejected submission alert */}
      {hasRejected && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-semibold text-red-800">
              A submission requires your attention
            </div>
            <div className="text-xs text-red-600 mt-0.5">
              One of your submissions was rejected. Please review and resubmit.
            </div>
          </div>
          <button
            onClick={() => navigate('my-submissions')}
            className="text-xs font-semibold text-red-700 hover:text-red-900 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition shrink-0"
          >
            View
          </button>
        </div>
      )}

      {/* Main content grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recently Added */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-navy-900 text-base">Recently Added</h3>
            <button
              onClick={() => navigate('repository')}
              className="text-xs text-navy-600 hover:text-navy-800 font-semibold flex items-center gap-1 transition"
            >
              View all <ChevronRight size={13} />
            </button>
          </div>
          {recent.length === 0 ? (
            <div className="bg-white rounded-xl border border-navy-100 p-8 text-center">
              <BookOpen size={32} className="text-navy-200 mx-auto mb-2" />
              <div className="text-sm text-navy-500">No resources available yet.</div>
            </div>
          ) : (
            <div className="grid gap-3">
              {recent.map((r) => (
                <ResourceCard key={r.id} resource={r} onDownload={handleDownload} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Popular Resources */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base">Most Downloaded</h3>
              <button
                onClick={() => navigate('repository')}
                className="text-xs text-navy-600 hover:text-navy-800 font-semibold flex items-center gap-1 transition"
              >
                View all <ChevronRight size={13} />
              </button>
            </div>
            {popular.length === 0 ? (
              <div className="bg-white rounded-xl border border-navy-100 p-8 text-center">
                <TrendingUp size={32} className="text-navy-200 mx-auto mb-2" />
                <div className="text-sm text-navy-500">No downloads yet.</div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
                {popular.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => navigate('resource-detail', { id: r.id })}
                    className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-navy-50 last:border-none hover:bg-navy-50 transition group text-left"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        i === 0
                          ? 'bg-navy-800 text-white'
                          : i === 1
                          ? 'bg-navy-700 text-white'
                          : 'bg-navy-100 text-navy-600'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy-800 text-xs leading-snug group-hover:text-navy-600 transition line-clamp-1">
                        {r.title}
                      </div>
                      <div className="text-[10px] text-navy-400 mt-0.5">
                        {r.author} · {r.courseCode ?? r.academicYear}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-1 text-[10px] text-navy-400">
                      <TrendingUp size={10} />
                      {r.downloads}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* My Submissions summary */}
          {submissions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-navy-900 text-base">My Submissions</h3>
                <button
                  onClick={() => navigate('my-submissions')}
                  className="text-xs text-navy-600 hover:text-navy-800 font-semibold flex items-center gap-1 transition"
                >
                  View all <ChevronRight size={13} />
                </button>
              </div>
              <div className="space-y-2">
                {submissions.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => navigate('my-submissions')}
                    className="w-full bg-white rounded-xl border border-navy-100 p-3.5 text-left hover:border-navy-300 hover:shadow-sm transition flex items-center gap-3 group"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        s.status === 'approved' || s.status === 'published'
                          ? 'bg-emerald-50 border border-emerald-200'
                          : s.status === 'rejected'
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-amber-50 border border-amber-200'
                      }`}
                    >
                      {s.status === 'approved' || s.status === 'published' ? (
                        <CheckCircle size={15} className="text-emerald-500" />
                      ) : s.status === 'rejected' ? (
                        <AlertCircle size={15} className="text-red-500" />
                      ) : (
                        <Clock size={15} className="text-amber-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-navy-800 text-xs truncate group-hover:text-navy-600 transition">
                        {s.title}
                      </div>
                      <div className="text-[10px] text-navy-400 mt-0.5">{s.submittedDate}</div>
                    </div>
                    <StatusBadge status={s.status} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}