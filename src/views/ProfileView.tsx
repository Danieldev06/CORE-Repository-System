// src/views/ProfileView.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  User, Mail, BookOpen, Building2, Calendar, Shield,
  Download, Bookmark, FileText, Loader2, AlertCircle,
  CheckCircle, GraduationCap
} from 'lucide-react';
import { useApp } from '../context';
import { PageHeader, StatusBadge } from '../components/Layout';
import { api, resourceApi, extractApiError, type Resource as ApiResource } from '../services/api';

// ============================================================
// HELPERS
// ============================================================

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

// ============================================================
// COMPONENT
// ============================================================

export default function ProfileView() {
  const { user, navigate, bookmarkedIds, downloadedIds, showToast } = useApp();

  const [submissionCount, setSubmissionCount] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [taughtModules, setTaughtModules] = useState<TaughtModule[]>([]);
  const [loading, setLoading] = useState(true);

  const isStudent = user?.role === 'student';
  const isLecturer = user?.role === 'lecturer';

  // ------------------------------------------------------------
  // Fetch data
  // ------------------------------------------------------------
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('core_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Submissions (both students and lecturers have their own)
      const mySubs = await resourceApi.getMySubmissions(token);
      setSubmissionCount(mySubs.length);

      // Lecturers: fetch taught modules + count their approvals
      if (isLecturer) {
        const modules = await fetchTaughtModules(token);
        setTaughtModules(modules);

        // Count how many resources this lecturer has approved
        const allResources = await api.getResources();
        const approvals = allResources.filter(
          (r) => r.approved_by === parseInt(user?.id ?? '0', 10)
        );
        setReviewCount(approvals.length);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isLecturer, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;

  // ------------------------------------------------------------
  // Derived display values
  // ------------------------------------------------------------
  const roleBadge = {
    admin: 'bg-purple-50 text-purple-700',
    lecturer: 'bg-blue-50 text-blue-700',
    student: 'bg-navy-50 text-navy-700',
  }[user.role];

  const facultyName = user.school || user.department || '—';

  // ------------------------------------------------------------
  // Info items (no duplicates, no fake placeholders)
  // ------------------------------------------------------------
  const infoItems = [
    { icon: <Mail size={14} />, label: 'Email', value: user.email },
    { icon: <Shield size={14} />, label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
    ...(user.studentId
      ? [{ icon: <User size={14} />, label: isLecturer ? 'Staff ID' : 'Student ID', value: user.studentId }]
      : []),
    { icon: <Building2 size={14} />, label: 'Faculty / School', value: facultyName },
    ...(user.programme
      ? [{ icon: <BookOpen size={14} />, label: isLecturer ? 'Teaching Programme' : 'Programme', value: user.programme }]
      : []),
    ...(isStudent && user.yearOfStudy
      ? [{ icon: <Calendar size={14} />, label: 'Year of Study', value: `Year ${user.yearOfStudy}` }]
      : []),
    { icon: <Calendar size={14} />, label: 'Date Joined', value: user.dateJoined },
  ];

  // ------------------------------------------------------------
  // Main
  // ------------------------------------------------------------
  return (
    <div>
      <PageHeader title="My Profile" breadcrumbs={[{ label: 'Profile' }]} />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column — profile card + stats */}
          <div className="lg:col-span-1 space-y-5">
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-navy-800 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <h2 className="font-bold text-navy-900 text-lg">{user.name}</h2>
              <div className="text-navy-500 text-sm mt-0.5">{user.email}</div>

              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${roleBadge}`}>
                  {user.role}
                </span>
                <StatusBadge status={user.status} />
              </div>

              <div className="mt-5 text-[11px] text-navy-400 leading-relaxed">
                Profile information is managed by the University Registry.
                Contact <span className="text-navy-600 font-medium">itsupport@cavendish.ac.zm</span> for changes.
              </div>
            </div>

            {/* Student activity */}
            {isStudent && (
              <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
                <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
                  Activity Summary
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('my-submissions')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-50 transition group"
                  >
                    <div className="flex items-center gap-2 text-navy-600 text-sm">
                      <FileText size={14} className="text-navy-400 group-hover:text-navy-600 transition" />
                      Submissions
                    </div>
                    <span className="font-bold text-navy-800">
                      {loading ? '—' : submissionCount}
                    </span>
                  </button>

                  <button
                    onClick={() => navigate('download-history')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-50 transition group"
                  >
                    <div className="flex items-center gap-2 text-navy-600 text-sm">
                      <Download size={14} className="text-navy-400 group-hover:text-navy-600 transition" />
                      Downloads
                    </div>
                    <span className="font-bold text-navy-800">{downloadedIds.length}</span>
                  </button>

                  <button
                    onClick={() => navigate('bookmarks')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-50 transition group"
                  >
                    <div className="flex items-center gap-2 text-navy-600 text-sm">
                      <Bookmark size={14} className="text-navy-400 group-hover:text-navy-600 transition" />
                      Bookmarks
                    </div>
                    <span className="font-bold text-navy-800">{bookmarkedIds.length}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Lecturer activity */}
            {isLecturer && (
              <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
                <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
                  Teaching Overview
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('lecturer-resources')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-50 transition group"
                  >
                    <div className="flex items-center gap-2 text-navy-600 text-sm">
                      <FileText size={14} className="text-navy-400 group-hover:text-navy-600 transition" />
                      Resources Uploaded
                    </div>
                    <span className="font-bold text-navy-800">
                      {loading ? '—' : submissionCount}
                    </span>
                  </button>

                  <button
                    onClick={() => navigate('review-submissions')}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-50 transition group"
                  >
                    <div className="flex items-center gap-2 text-navy-600 text-sm">
                      <CheckCircle size={14} className="text-navy-400 group-hover:text-navy-600 transition" />
                      Submissions Approved
                    </div>
                    <span className="font-bold text-navy-800">
                      {loading ? '—' : reviewCount}
                    </span>
                  </button>

                  <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2 text-navy-600 text-sm">
                      <GraduationCap size={14} className="text-navy-400" />
                      Modules Teaching
                    </div>
                    <span className="font-bold text-navy-800">
                      {loading ? '—' : taughtModules.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column — account info + modules */}
          <div className="lg:col-span-2 space-y-5">
            {/* Account information */}
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
                Account Information
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {infoItems.map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center text-navy-500 shrink-0 mt-0.5">
                      {m.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">
                        {m.label}
                      </div>
                      <div className="text-sm text-navy-700 font-medium mt-0.5 break-words">
                        {m.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Taught modules — lecturers only */}
            {isLecturer && (
              <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide">
                    Modules I Teach
                  </h3>
                  <button
                    onClick={() =>
                      showToast({
                        message: 'Module management page coming soon',
                        type: 'info',
                      })
                    }
                    className="text-xs text-navy-600 hover:text-navy-800 font-semibold border border-navy-200 px-3 py-1.5 rounded-lg hover:bg-navy-50 transition"
                  >
                    Edit Modules
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-6 text-navy-400 text-sm">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Loading modules...
                  </div>
                ) : taughtModules.length === 0 ? (
                  <div className="text-center py-6 text-sm text-navy-400">
                    No modules assigned. Contact the Registry to be assigned modules.
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* Security */}
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">
                Security
              </h3>
              <div className="flex items-start gap-3 p-4 bg-navy-50 rounded-lg text-xs text-navy-600 leading-relaxed">
                <Shield size={16} className="text-navy-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-navy-700 mb-1">
                    Password Management
                  </div>
                  For password changes, please use the institutional Single Sign-On
                  portal or contact the IT Helpdesk at{' '}
                  <span className="text-navy-700 font-medium">itsupport@cavendish.ac.zm</span>.
                </div>
              </div>
            </div>

            {/* Institutional notice */}
            <div className="bg-navy-50 rounded-xl border border-navy-100 p-4 text-xs text-navy-500 leading-relaxed">
              <span className="font-semibold text-navy-700">Note: </span>
              Your account is managed by Cavendish University Zambia. To change your name,
              student/staff ID, programme, or school, please contact the Registry Office at{' '}
              <span className="text-navy-700 font-medium">registry@cavendish.ac.zm</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}