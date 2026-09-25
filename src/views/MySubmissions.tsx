import { useState, useEffect, useCallback } from 'react';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, MessageSquare, RefreshCw, Plus, Loader2, Download, Eye } from 'lucide-react';
import { useApp } from '../context';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';
import { resourceApi, extractApiError, type Resource as ApiResource } from '../services/api';
import { downloadResourceWithAuth } from '../utils/fileUrl';
import DocumentPreview from '../components/DocumentPreview';
import type { Submission, ResourceType, ResourceStatus } from '../types';

// ============================================================
// ADAPTER: Convert Django API response → Frontend Submission
// ============================================================

const API_TYPE_TO_FRONTEND: Record<string, ResourceType> = {
  NOTES: 'lecture-notes',
  PASTPAPER: 'past-paper',
  DISSERTATION: 'dissertation',
  ARTICLE: 'research-paper',
};

function adaptSubmission(r: ApiResource): Submission {
  const apiType = API_TYPE_TO_FRONTEND[r.resource_type] || 'other';
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
    type: apiType,
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
  };
}

// ============================================================
// COMPONENT
// ============================================================

export default function MySubmissions() {
  const { user, navigate, showToast } = useApp();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [previewSubmission, setPreviewSubmission] = useState<Submission | null>(null);  // ← NEW

  const fetchSubmissions = useCallback(async (showRefreshToast = false) => {
    const token = localStorage.getItem('core_token');
    if (!token) {
      setError('Your session has expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const data = await resourceApi.getMySubmissions(token);
      setSubmissions(data.map(adaptSubmission));
      setError('');
      if (showRefreshToast) {
        showToast({ message: 'Submissions refreshed', type: 'success' });
      }
    } catch (err: any) {
      setError(extractApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubmissions(true);
  };

  const handleDownload = async (sub: Submission) => {
    try {
      await downloadResourceWithAuth(sub.id, `${sub.title}.pdf`);
    } catch (err: any) {
      showToast({
        message: `Download failed: ${err.message || 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  const counts = {
    total: submissions.length,
    pending: submissions.filter(s => ['submitted', 'under-review'].includes(s.status)).length,
    approved: submissions.filter(s => ['approved', 'published'].includes(s.status)).length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  return (
    <div>
      <PageHeader
        title="My Submissions"
        subtitle="Track the status of your submitted academic work."
        breadcrumbs={[{ label: 'My Submissions' }]}
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
              onClick={() => navigate('submit-work')}
              className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
            >
              <Plus size={15} /> New Submission
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Submissions', value: counts.total, color: 'text-navy-800', bg: 'bg-navy-50 border-navy-100' },
            { label: 'Pending Review', value: counts.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' },
            { label: 'Approved', value: counts.approved, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Rejected', value: counts.rejected, color: 'text-red-700', bg: 'bg-red-50 border-red-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-navy-500 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-navy-100">
            <Loader2 size={36} className="text-navy-500 animate-spin mb-3" />
            <div className="text-navy-500 text-sm">Loading your submissions...</div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Couldn't load submissions</div>
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

        {/* Empty state */}
        {!loading && !error && submissions.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <FileText size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">No submissions yet</div>
            <div className="text-navy-400 text-sm mt-1 mb-4">Submit your academic work to get started</div>
            <button
              onClick={() => navigate('submit-work')}
              className="px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-semibold hover:bg-navy-700 transition"
            >
              Submit Work
            </button>
          </div>
        )}

        {/* Submissions list */}
        {!loading && !error && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-navy-800 text-sm leading-snug">{sub.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-navy-400">
                        {sub.courseCode && (
                          <>
                            <span className="font-medium text-navy-600">{sub.courseCode}</span>
                            <span>·</span>
                          </>
                        )}
                        {sub.programme && <span>{sub.programme}</span>}
                        {sub.academicYear && (
                          <>
                            <span>·</span>
                            <span>Year {sub.academicYear}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ResourceTypeBadge type={sub.type} />
                      <StatusBadge status={sub.status} />
                    </div>
                  </div>

                  {/* Progress timeline */}
                  <div className="flex items-center gap-0 mt-4 mb-4">
                    {['Draft', 'Submitted', 'Under Review', 'Decision'].map((step, i) => {
                      const stepStatuses: Record<number, string[]> = {
                        0: ['draft'],
                        1: ['submitted', 'under-review', 'approved', 'rejected', 'published'],
                        2: ['under-review', 'approved', 'rejected', 'published'],
                        3: ['approved', 'rejected', 'published'],
                      };
                      const active = stepStatuses[i].includes(sub.status);
                      const final = i === 3;
                      const approved = final && (sub.status === 'approved' || sub.status === 'published');
                      const rejected = final && sub.status === 'rejected';
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition ${
                                approved
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : rejected
                                  ? 'bg-red-500 border-red-500 text-white'
                                  : active
                                  ? 'bg-navy-800 border-navy-800 text-white'
                                  : 'bg-white border-navy-200 text-navy-300'
                              }`}
                            >
                              {approved ? '✓' : rejected ? '✕' : i + 1}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium ${active ? 'text-navy-700' : 'text-navy-300'}`}>
                              {step}
                            </span>
                          </div>
                          {i < 3 && (
                            <div
                              className={`flex-1 h-0.5 mx-1 ${
                                active && stepStatuses[i + 1].includes(sub.status)
                                  ? 'bg-navy-300'
                                  : 'bg-navy-100'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-navy-400">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        Submitted: <span className="text-navy-600 font-medium">{sub.submittedDate}</span>
                      </span>
                      {sub.fileType && (
                        <span>
                          File: <span className="text-navy-600">{sub.fileType}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewSubmission(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 text-xs font-semibold rounded-lg transition"
                        title="Preview"
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <button
                        onClick={() => handleDownload(sub)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
                        title="Download"
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Under review info */}
                {sub.status === 'under-review' && (
                  <div className="mx-5 mb-4 p-4 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                    <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      Your submission is currently being reviewed by a lecturer or the library team.
                      You will be notified once a decision is made.
                    </p>
                  </div>
                )}

                {/* Approved info */}
                {sub.status === 'approved' && (
                  <div className="mx-5 mb-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3">
                    <CheckCircle size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-700">
                      Your submission has been approved and is now visible in the academic repository.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✅ Preview Modal */}
      {previewSubmission && (
        <DocumentPreview
          resourceId={previewSubmission.id}
          title={previewSubmission.title}
          fileType={previewSubmission.fileType}
          onClose={() => setPreviewSubmission(null)}
        />
      )}
    </div>
  );
}