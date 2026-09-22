import { useState, useEffect, useCallback } from 'react';
import { Eye, CheckCircle, XCircle, RefreshCw, MessageSquare, FileText, ChevronLeft, AlertCircle, Loader2, Download } from 'lucide-react';
import { useApp } from '../context';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';
import { extractApiError, type Resource as ApiResource } from '../services/api';
import { downloadResourceWithAuth } from '../utils/fileUrl';
import type { Submission, ResourceType, ResourceStatus } from '../types';

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
// API Helpers (Lecturer)
// ============================================================

const API_BASE = 'http://localhost:8000/api';

async function fetchPendingSubmissions(token: string): Promise<ApiResource[]> {
  const res = await fetch(`${API_BASE}/lecturer/pending-submissions/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch pending submissions');
  return res.json();
}

async function decideSubmission(
  token: string,
  resourceId: string,
  action: 'approve' | 'reject'
): Promise<void> {
  const res = await fetch(`${API_BASE}/lecturer/decide/${resourceId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ action }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
}

// ============================================================
// REVIEW DETAIL PANEL
// ============================================================

function ReviewDetail({
  submission,
  onBack,
  onDecisionMade,
}: {
  submission: Submission;
  onBack: () => void;
  onDecisionMade: () => void;
}) {
  const { showToast } = useApp();
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    try {
      await downloadResourceWithAuth(submission.id, `${submission.title}.pdf`);
    } catch (err: any) {
      showToast({
        message: `Download failed: ${err.message || 'Unknown error'}`,
        type: 'error',
      });
    }
  };

  const handleSubmit = async () => {
    if (!decision) return;
    if (decision === 'reject' && !comments.trim()) return;

    const token = localStorage.getItem('core_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await decideSubmission(token, submission.id, decision);
      setDone(true);
      showToast({
        message:
          decision === 'approve'
            ? 'Submission approved and published.'
            : 'Submission rejected and removed.',
        type: decision === 'approve' ? 'success' : 'info',
      });
      onDecisionMade();
    } catch (err: any) {
      const msg = extractApiError(err);
      setError(msg);
      showToast({ message: `Action failed: ${msg}`, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-navy-100 p-10 text-center shadow-sm">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              decision === 'approve'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {decision === 'approve' ? (
              <CheckCircle size={32} className="text-emerald-600" />
            ) : (
              <XCircle size={32} className="text-red-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-navy-900 mb-2">
            {decision === 'approve' ? 'Submission Approved' : 'Submission Rejected'}
          </h2>
          <p className="text-navy-500 text-sm mb-6">
            {decision === 'approve'
              ? 'This resource is now published in the repository.'
              : 'The submission has been removed.'}
          </p>
          <button
            onClick={onBack}
            className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition"
          >
            Back to Submissions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy-800 font-medium mb-5 transition"
      >
        <ChevronLeft size={16} /> Back to submissions
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Document preview */}
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-navy-100 bg-navy-50 flex items-center justify-between">
              <div className="font-semibold text-navy-800 text-sm flex items-center gap-2">
                <FileText size={15} /> Submitted Document
              </div>
              <span className="text-xs text-navy-400">{submission.fileType}</span>
            </div>
            <div className="h-80 bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-24 bg-white border-2 border-navy-200 rounded-lg mx-auto mb-3 flex items-center justify-center shadow-sm">
                  <FileText size={32} className="text-navy-300" />
                </div>
                <div className="text-navy-500 text-sm font-medium max-w-xs mx-auto">
                  {submission.title}
                </div>
                <div className="text-navy-400 text-xs mt-1">{submission.fileType}</div>
                <button
                  onClick={handleDownload}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-navy-700 font-semibold underline hover:text-navy-900 transition"
                >
                  <Download size={11} /> Download to review
                </button>
              </div>
            </div>
          </div>

          {/* Decision panel */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
              Review Decision
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setDecision('approve')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl text-sm font-semibold transition ${
                  decision === 'approve'
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-700'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:opacity-90'
                }`}
              >
                <CheckCircle size={20} /> Approve
              </button>
              <button
                onClick={() => setDecision('reject')}
                className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl text-sm font-semibold transition ${
                  decision === 'reject'
                    ? 'border-red-500 bg-red-100 text-red-700'
                    : 'border-red-200 bg-red-50 text-red-600 hover:opacity-90'
                }`}
              >
                <XCircle size={20} /> Reject
              </button>
            </div>

            {decision === 'reject' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  placeholder="Provide clear reasons for rejection..."
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition resize-none"
                />
              </div>
            )}

            {decision === 'approve' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">
                  Comments (optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Add optional comments for the student..."
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition resize-none"
                />
              </div>
            )}

            {!decision && (
              <div className="flex items-center gap-2 text-xs text-navy-500 bg-navy-50 rounded-lg px-3 py-2 mb-4">
                <AlertCircle size={13} /> Select a decision above before submitting your review.
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !decision ||
                  submitting ||
                  (decision === 'reject' && !comments.trim())
                }
                className={`px-5 py-2 font-semibold rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-50 ${
                  decision === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <MessageSquare size={14} /> Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Metadata sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
              Submission Details
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">Title</div>
                <div className="text-navy-700 font-medium leading-snug">{submission.title}</div>
              </div>
              <div>
                <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">Submitted By</div>
                <div className="text-navy-700 font-medium leading-snug">
                  {submission.studentName}
                </div>
                <div className="text-navy-400 leading-snug mt-0.5">
                  {submission.studentEmail}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">Module</div>
                <div className="text-navy-700 font-medium leading-snug">
                  {submission.courseCode} — {submission.course}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">Resource Type</div>
                <ResourceTypeBadge type={submission.type} />
              </div>
              <div>
                <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">Submitted On</div>
                <div className="text-navy-700 font-medium leading-snug">{submission.submittedDate}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-3">
              Current Status
            </h3>
            <StatusBadge status={submission.status} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function ReviewSubmissions() {
  const { params, navigate, showToast } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(params.id ?? null);
  const [pending, setPending] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchPending = useCallback(
    async (showRefreshToast = false) => {
      const token = localStorage.getItem('core_token');
      if (!token) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchPendingSubmissions(token);
        setPending(data.map(adaptSubmission));
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
    },
    [showToast]
  );

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPending(true);
  };

  const selected = selectedId ? pending.find((s) => s.id === selectedId) : null;

  if (selectedId && selected) {
    return (
      <div>
        <PageHeader
          title="Review Submission"
          breadcrumbs={[
            { label: 'Review Submissions', view: 'review-submissions' },
            { label: 'Review' },
          ]}
        />
        <ReviewDetail
          submission={selected}
          onBack={() => setSelectedId(null)}
          onDecisionMade={() => fetchPending(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Review Submissions"
        subtitle="Review and provide decisions on student-submitted academic work in your modules."
        breadcrumbs={[{ label: 'Review Submissions' }]}
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {!loading && pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 text-sm text-amber-700">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              <strong>
                {pending.length} submission{pending.length > 1 ? 's' : ''}
              </strong>{' '}
              awaiting your review.
            </span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-navy-100">
            <Loader2 size={36} className="text-navy-500 animate-spin mb-3" />
            <div className="text-navy-500 text-sm">Loading submissions...</div>
          </div>
        )}

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

        {!loading && !error && pending.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <CheckCircle size={40} className="text-emerald-300 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">All caught up! 🎉</div>
            <div className="text-navy-400 text-sm mt-1">
              There are no pending submissions in your modules.
            </div>
          </div>
        )}

        {!loading && !error && pending.length > 0 && (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
            <div className="bg-navy-50 border-b border-navy-100 px-4 py-3 grid grid-cols-12 gap-4">
              <div className="col-span-5 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                Submission
              </div>
              <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:block">
                Type
              </div>
              <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:block">
                Date
              </div>
              <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                Status
              </div>
              <div className="col-span-1 text-xs font-semibold text-navy-600 uppercase tracking-wide text-right">
                Action
              </div>
            </div>
            {pending.map((s, i) => (
              <div
                key={s.id}
                className={`grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-navy-50 transition ${
                  i < pending.length - 1 ? 'border-b border-navy-50' : ''
                }`}
              >
                <div className="col-span-5 min-w-0">
                  <div className="font-semibold text-navy-800 text-sm truncate">{s.title}</div>
                  <div className="text-[11px] text-navy-400 mt-0.5">
                    {s.studentName} · {s.courseCode}
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  <ResourceTypeBadge type={s.type} />
                </div>
                <div className="col-span-2 text-xs text-navy-500 hidden sm:block">
                  {s.submittedDate}
                </div>
                <div className="col-span-2">
                  <StatusBadge status={s.status} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => setSelectedId(s.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition"
                  >
                    <Eye size={11} /> Review
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