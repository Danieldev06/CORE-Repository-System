import { FileText, ClipboardCheck, Upload, Download, Users, TrendingUp, ChevronRight, Eye, Plus, BookOpen, AlertCircle } from 'lucide-react';
import { useApp } from '../context';
import { MOCK_RESOURCES, MOCK_SUBMISSIONS } from '../data';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';

function StatsCard({ icon, label, value, sub, color, delta }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; delta?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {delta && <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">{delta}</span>}
        {!delta && sub && <span className="text-[11px] text-amber-600 font-semibold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-full">{sub}</span>}
      </div>
      <div className="text-[26px] font-bold text-navy-900 leading-none">{value}</div>
      <div className="text-xs text-navy-500 mt-1.5 font-medium">{label}</div>
    </div>
  );
}

export default function LecturerDashboard() {
  const { user, navigate } = useApp();
  const myResources = MOCK_RESOURCES.filter(r => r.authorId === user?.id);
  const pendingSubmissions = MOCK_SUBMISSIONS.filter(s =>
    (s.status === 'submitted' || s.status === 'under-review') &&
    (s.reviewerId === user?.id || !s.reviewerId)
  );
  const approvedCount = MOCK_SUBMISSIONS.filter(s =>
    s.reviewerId === user?.id && (s.status === 'approved' || s.status === 'published')
  ).length;
  const totalDownloads = myResources.reduce((acc, r) => acc + r.downloads, 0);
  const totalViews = myResources.reduce((acc, r) => acc + r.views, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name}`}
        subtitle={`${user?.department ?? 'Department'} · ${user?.school ?? ''}`}
      />
      <div className="p-6 max-w-6xl mx-auto space-y-7">

        {/* Alert banner for pending reviews */}
        {pendingSubmissions.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <div className="flex-1 text-sm">
              <span className="font-semibold text-amber-800">{pendingSubmissions.length} student submission{pendingSubmissions.length > 1 ? 's' : ''}</span>
              <span className="text-amber-700"> awaiting your review.</span>
            </div>
            <button onClick={() => navigate('review-submissions')}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition shrink-0">
              Review Now
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={<FileText size={19} className="text-navy-700" />} label="My Resources" value={myResources.length} delta="+2 this term" color="bg-navy-50" />
          <StatsCard icon={<ClipboardCheck size={19} className="text-amber-600" />} label="Pending Reviews" value={pendingSubmissions.length} sub={pendingSubmissions.length > 0 ? 'Action needed' : undefined} color="bg-amber-50" />
          <StatsCard icon={<Users size={19} className="text-emerald-600" />} label="Approved Submissions" value={approvedCount} delta={approvedCount > 0 ? 'Published' : undefined} color="bg-emerald-50" />
          <StatsCard icon={<Download size={19} className="text-blue-600" />} label="Total Downloads" value={totalDownloads.toLocaleString()} delta={`${totalViews} views`} color="bg-blue-50" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Upload Lecture Notes', icon: <Upload size={14} />, view: 'upload-resource' as const, color: 'bg-navy-800 text-white hover:bg-navy-700 shadow-sm' },
            { label: 'Upload Past Paper', icon: <FileText size={14} />, view: 'upload-resource' as const, color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50' },
            { label: 'Upload Course Material', icon: <Plus size={14} />, view: 'upload-resource' as const, color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50' },
            { label: 'Review Submissions', icon: <ClipboardCheck size={14} />, view: 'review-submissions' as const, color: pendingSubmissions.length > 0 ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm' : 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50' },
          ].map((a, i) => (
            <button key={i} onClick={() => navigate(a.view)}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition ${a.color}`}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending submissions table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                Pending Student Submissions
                {pendingSubmissions.length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{pendingSubmissions.length}</span>
                )}
              </h3>
              <button onClick={() => navigate('review-submissions')} className="text-xs text-navy-600 hover:text-navy-800 font-semibold flex items-center gap-1 transition">
                View all <ChevronRight size={13} />
              </button>
            </div>

            {pendingSubmissions.length === 0 ? (
              <div className="bg-white rounded-xl border border-navy-100 p-10 text-center shadow-sm">
                <ClipboardCheck size={32} className="text-navy-200 mx-auto mb-2" />
                <div className="text-navy-600 font-semibold text-sm">No pending submissions</div>
                <div className="text-navy-400 text-xs mt-1">All student submissions have been reviewed</div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy-50 border-b border-navy-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Submission</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSubmissions.map((s, i) => (
                      <tr key={s.id} className={`border-b border-navy-50 hover:bg-navy-50 transition ${i === pendingSubmissions.length - 1 ? 'border-none' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-navy-800 text-xs leading-snug max-w-[180px] truncate">{s.title}</div>
                          <div className="text-[11px] text-navy-400 mt-0.5">{s.studentName} · {s.submittedDate}</div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => navigate('review-submissions', { id: s.id })}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition ml-auto">
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

          {/* My resources + access stats */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base">My Uploaded Resources</h3>
              <button onClick={() => navigate('lecturer-resources')} className="text-xs text-navy-600 hover:text-navy-800 font-semibold flex items-center gap-1 transition">
                View all <ChevronRight size={13} />
              </button>
            </div>
            {myResources.length === 0 ? (
              <div className="bg-white rounded-xl border border-navy-100 p-10 text-center shadow-sm">
                <BookOpen size={32} className="text-navy-200 mx-auto mb-2" />
                <div className="text-navy-600 font-semibold text-sm">No resources uploaded yet</div>
                <button onClick={() => navigate('upload-resource')} className="mt-3 text-xs text-navy-600 hover:text-navy-800 font-semibold border border-navy-200 px-3 py-1.5 rounded-lg hover:bg-navy-50 transition">
                  Upload First Resource
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myResources.slice(0, 4).map(r => (
                  <div key={r.id} className="bg-white rounded-xl border border-navy-100 p-4 shadow-sm hover:border-navy-300 hover:shadow-md transition group">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <button onClick={() => navigate('resource-detail', { id: r.id })} className="text-left">
                        <div className="font-semibold text-navy-800 text-sm leading-snug line-clamp-1 group-hover:text-navy-600 transition">{r.title}</div>
                      </button>
                      <ResourceTypeBadge type={r.type} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-navy-400">{r.courseCode ?? r.academicYear} · {r.fileType} · {r.fileSize}</div>
                      <div className="flex items-center gap-3 text-[11px] text-navy-400">
                        <span className="flex items-center gap-1"><Download size={10} />{r.downloads}</span>
                        <span className="flex items-center gap-1"><TrendingUp size={10} />{r.views}</span>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => navigate('upload-resource')}
                  className="w-full py-2.5 border-2 border-dashed border-navy-200 rounded-xl text-sm text-navy-400 hover:text-navy-600 hover:border-navy-300 transition font-medium flex items-center justify-center gap-2">
                  <Plus size={14} /> Upload New Resource
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
