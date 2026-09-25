// src/views/LecturerDashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  FileText, ClipboardCheck, Upload, Download, Users, TrendingUp,
  ChevronRight, Eye, Plus, BookOpen, AlertCircle, Loader2, GraduationCap
} from 'lucide-react';
import { useApp } from '../context';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';
import { api, resourceApi, extractApiError, type Resource as ApiResource } from '../services/api';
import DocumentPreview from '../components/DocumentPreview';
import type { Submission, ResourceType, ResourceStatus } from '../types';

// ============================================================
// ADAPTERS
// ============================================================

const API_TYPE_MAP: Record<string, ResourceType> = {
  NOTES: 'lecture-notes',
  PASTPAPER: 'past-paper',
  DISSERTATION: 'dissertation',
  ARTICLE: 'research-paper',
};

interface AdaptedSubmission {
  id: string;
  title: string;
  studentName: string;
  submittedDate: string;
  status: ResourceStatus;
  courseCode: string;
  type: ResourceType;
}

function adaptSubmission(r: ApiResource): AdaptedSubmission {
  const status: ResourceStatus = r.is_approved ? 'approved' : 'under-review';
  return {
    id: String(r.id),
    title: r.title,
    studentName: r.uploaded_by_name || r.uploaded_by_username || 'Unknown',
    submittedDate: new Date(r.upload_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
    status,
    courseCode: r.course_code || '',
    type: API_TYPE_MAP[r.resource_type] || 'other',
  };
}

interface AdaptedResource {
  id: string;
  title: string;
  type: ResourceType;
  courseCode: string;
  academicYear: string;
  fileType: string;
  downloads: number;
  isApproved: boolean;
}

function adaptResource(r: ApiResource): AdaptedResource {
  const ext = (r.file_pdf || '').split('.').pop()?.toUpperCase() || 'PDF';
  return {
    id: String(r.id),
    title: r.title,
    type: API_TYPE_MAP[r.resource_type] || 'other',
    courseCode: r.course_code || '',
    academicYear: new Date(r.upload_date).getFullYear().toString(),
    fileType: ext,
    downloads: r.download_count || 0,
    isApproved: r.is_approved,
  };
}

interface TaughtModule {
  id: number;
  code: string;
  name: string;
}

async function fetchTaughtModules(token: string): Promise<TaughtModule[]> {
  const res = await fetch('http://localhost:8000/api/lecturer/modules/', {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function fetchPendingSubmissions(token: string): Promise<ApiResource[]> {
  const res = await fetch('http://localhost:8000/api/lecturer/pending-submissions/', {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load pending submissions');
  return res.json();
}

// ============================================================
// STATS CARD
// ============================================================

function StatsCard({
  icon, label, value, sub, color, delta, loading,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  color: string; delta?: string; loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {delta && (
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
            {delta}
          </span>
        )}
        {!delta && sub && (
          <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">
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
// MAIN COMPONENT
// ============================================================

export default function LecturerDashboard() {
  const { user, navigate } = useApp();

  const [pendingSubmissions, setPendingSubmissions] = useState<AdaptedSubmission[]>([]);
  const [myResources, setMyResources] = useState<AdaptedResource[]>([]);
  const [taughtModules, setTaughtModules] = useState<TaughtModule[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewResource, setPreviewResource] = useState<AdaptedResource | null>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('core_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch everything in parallel
      const [pending, subs, modules, allResources] = await Promise.all([
        fetchPendingSubmissions(token).catch(() => [] as ApiResource[]),
        resourceApi.getMySubmissions(token).catch(() => [] as ApiResource[]),
        fetchTaughtModules(token).catch(() => [] as TaughtModule[]),
        api.getResources().catch(() => [] as ApiResource[]),
      ]);

      setPendingSubmissions(pending.map(adaptSubmission));
      setMyResources(subs.map(adaptResource));
      setTaughtModules(modules);

      // Count approvals done by this lecturer
      const myUserId = parseInt(user?.id ?? '0', 10);
      const approvals = allResources.filter((r) => r.approved_by === myUserId);
      setApprovedCount(approvals.length);

      setError('');
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalDownloads = myResources.reduce((acc, r) => acc + r.downloads, 0);

  // ------------------------------------------------------------
  // Loading
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
  // Error
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
    <div>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={
          user?.school
            ? `${user.school} · ${user.programme ?? ''}`
            : user?.department
            ? `${user.department} · ${user.programme ?? ''}`
            : 'Lecturer Dashboard'
        }
      />
      <div className="p-6 max-w-6xl mx-auto space-y-7">

        {/* No modules warning */}
        {taughtModules.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold text-amber-800">No modules assigned yet</div>
              <div className="text-amber-700 text-xs mt-0.5">
                You need modules assigned before you can upload resources or review submissions.
                Contact the Registry to have your modules added.
              </div>
            </div>
          </div>
        )}

        {/* Pending reviews alert */}
        {pendingSubmissions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-amber-800">
                {pendingSubmissions.length} student submission{pendingSubmissions.length > 1 ? 's' : ''}
              </span>
              <span className="text-amber-700"> awaiting your review.</span>
            </div>
            <button
              onClick={() => navigate('review-submissions')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition shrink-0"
            >
              Review Now
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            icon={<GraduationCap size={19} className="text-navy-700" />}
            label="Modules Teaching"
            value={taughtModules.length}
            color="bg-navy-50"
          />
          <StatsCard
            icon={<ClipboardCheck size={19} className="text-amber-600" />}
            label="Pending Reviews"
            value={pendingSubmissions.length}
            sub={pendingSubmissions.length > 0 ? 'Action needed' : undefined}
            color="bg-amber-50"
          />
          <StatsCard
            icon={<Users size={19} className="text-emerald-600" />}
            label="Submissions Approved"
            value={approvedCount}
            color="bg-emerald-50"
          />
          <StatsCard
            icon={<Download size={19} className="text-blue-600" />}
            label="Downloads on My Uploads"
            value={totalDownloads.toLocaleString()}
            color="bg-blue-50"
          />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Upload Resource',
              icon: <Upload size={14} />,
              view: 'upload-resource' as const,
              color: 'bg-navy-800 text-white hover:bg-navy-700 shadow-sm',
            },
            {
              label: 'Review Submissions',
              icon: <ClipboardCheck size={14} />,
              view: 'review-submissions' as const,
              color:
                pendingSubmissions.length > 0
                  ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                  : 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
            },
            {
              label: 'My Resources',
              icon: <FileText size={14} />,
              view: 'lecturer-resources' as const,
              color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
            },
            {
              label: 'My Profile',
              icon: <Users size={14} />,
              view: 'profile' as const,
              color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
            },
          ].map((a, i) => (
            <button
              key={i}
              onClick={() => navigate(a.view)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition ${a.color}`}
            >
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending submissions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                Pending Student Submissions
                {pendingSubmissions.length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {pendingSubmissions.length}
                  </span>
                )}
              </h3>
              <button
                onClick={() => navigate('review-submissions')}
                className="text-xs text-navy-600 hover:text-navy-800 font-semibold flex items-center gap-1 transition"
              >
                View all <ChevronRight size={13} />
              </button>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="bg-white rounded-xl border border-navy-100 p-10 text-center shadow-sm">
                <ClipboardCheck size={32} className="text-navy-200 mx-auto mb-2" />
                <div className="text-navy-600 font-semibold text-sm">
                  No pending submissions
                </div>
                <div className="text-navy-400 text-xs mt-1">
                  {taughtModules.length === 0
                    ? 'You need modules assigned to receive submissions'
                    : 'All student submissions have been reviewed'}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy-50 border-b border-navy-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                        Submission
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">
                        Status
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSubmissions.slice(0, 5).map((s, i) => (
                      <tr
                        key={s.id}
                        className={`hover:bg-navy-50 transition ${
                          i < Math.min(pendingSubmissions.length, 5) - 1 ? 'border-b border-navy-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-navy-800 text-xs leading-snug max-w-[180px] truncate">
                            {s.title}
                          </div>
                          <div className="text-[11px] text-navy-400 mt-0.5">
                            {s.studentName}
                            {s.courseCode ? ` · ${s.courseCode}` : ''} · {s.submittedDate}
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => navigate('review-submissions', { id: s.id })}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition ml-auto"
                          >
                            <Eye size={11} /> Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* My Resources */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base">My Uploaded Resources</h3>
              <button
                onClick={() => navigate('lecturer-resources')}
                className="text-xs text-navy-600 hover:text-navy-800 font-semibold flex items-center gap-1 transition"
              >
                View all <ChevronRight size={13} />
              </button>
            </div>
            {myResources.length === 0 ? (
              <div className="bg-white rounded-xl border border-navy-100 p-10 text-center shadow-sm">
                <BookOpen size={32} className="text-navy-200 mx-auto mb-2" />
                <div className="text-navy-600 font-semibold text-sm">
                  No resources uploaded yet
                </div>
                <button
                  onClick={() => navigate('upload-resource')}
                  className="mt-3 text-xs text-navy-600 hover:text-navy-800 font-semibold border border-navy-200 px-3 py-1.5 rounded-lg hover:bg-navy-50 transition"
                >
                  Upload First Resource
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myResources.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-navy-100 p-4 shadow-sm hover:border-navy-300 hover:shadow-md transition group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <button
                        onClick={() => navigate('resource-detail', { id: r.id })}
                        className="text-left flex-1 min-w-0"
                      >
                        <div className="font-semibold text-navy-800 text-sm leading-snug line-clamp-1 group-hover:text-navy-600 transition">
                          {r.title}
                        </div>
                      </button>
                      <ResourceTypeBadge type={r.type} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-navy-400">
                        {r.courseCode || r.academicYear} · {r.fileType}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-navy-400">
                        <span className="flex items-center gap-1">
                          <Download size={10} />
                          {r.downloads}
                        </span>
                        <button
                          onClick={() => setPreviewResource(r)}
                          className="p-1 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-md transition"
                          title="Preview"
                        >
                          <FileText size={12} />
                        </button>
                        <StatusBadge status={r.isApproved ? 'approved' : 'under-review'} />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => navigate('upload-resource')}
                  className="w-full py-2.5 border-2 border-dashed border-navy-200 rounded-xl text-sm text-navy-400 hover:text-navy-600 hover:border-navy-300 transition font-medium flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Upload New Resource
                </button>
              </div>
            )}
          </div>
        </div>

        {/* My Modules chips */}
        {taughtModules.length > 0 && (
          <div>
            <h3 className="font-bold text-navy-900 text-base mb-3">Modules I Teach</h3>
            <div className="bg-white rounded-xl border border-navy-100 p-4 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {taughtModules.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-navy-50 border border-navy-100 rounded-lg text-xs font-medium text-navy-700"
                  >
                    <span className="font-bold">{m.code}</span>
                    <span className="text-navy-500">{m.name}</span>
                  </span>
                ))}
              </div>
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