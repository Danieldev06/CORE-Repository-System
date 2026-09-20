import { User, Mail, BookOpen, Building2, Calendar, Shield, Upload, Download, Bookmark, FileText } from 'lucide-react';
import { useApp } from '../context';
import { MOCK_RESOURCES, MOCK_SUBMISSIONS } from '../data';
import { PageHeader, StatusBadge } from '../components/Layout';

export default function ProfileView() {
  const { user, navigate, bookmarkedIds, downloadedIds } = useApp();
  if (!user) return null;

  const mySubmissions = MOCK_SUBMISSIONS.filter(s => s.studentId === user.id);
  const myResources = MOCK_RESOURCES.filter(r => r.authorId === user.id);

  const infoItems = [
    { icon: <Mail size={14} />, label: 'Email', value: user.email },
    { icon: <Shield size={14} />, label: 'Role', value: user.role.charAt(0).toUpperCase() + user.role.slice(1) },
    ...(user.studentId ? [{ icon: <User size={14} />, label: 'Student ID', value: user.studentId }] : []),
    ...(user.staffId ? [{ icon: <User size={14} />, label: 'Staff ID', value: user.staffId }] : []),
    ...(user.programme ? [{ icon: <BookOpen size={14} />, label: 'Programme', value: user.programme }] : []),
    ...(user.department ? [{ icon: <Building2 size={14} />, label: 'Department', value: user.department }] : []),
    { icon: <Building2 size={14} />, label: 'School', value: user.school ?? '—' },
    ...(user.yearOfStudy ? [{ icon: <Calendar size={14} />, label: 'Year of Study', value: `Year ${user.yearOfStudy}` }] : []),
    { icon: <Calendar size={14} />, label: 'Account Status', value: '' },
    { icon: <Calendar size={14} />, label: 'Date Joined', value: user.dateJoined },
  ];

  return (
    <div>
      <PageHeader title="My Profile" breadcrumbs={[{ label: 'Profile' }]} />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="lg:col-span-1 space-y-5">
            <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-navy-800 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <h2 className="font-bold text-navy-900 text-lg">{user.name}</h2>
              <div className="text-navy-500 text-sm mt-0.5">{user.email}</div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                  user.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                  user.role === 'lecturer' ? 'bg-blue-50 text-blue-700' :
                  'bg-navy-50 text-navy-700'
                }`}>{user.role}</span>
                <StatusBadge status={user.status} />
              </div>

              <button className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2 border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">
                <Upload size={14} /> Update Photo
              </button>
            </div>

            {/* Stats */}
            {user.role === 'student' && (
              <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
                <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">Activity Summary</h3>
                <div className="space-y-3">
                  {[
                    { icon: <FileText size={14} />, label: 'Submissions', value: mySubmissions.length, view: 'my-submissions' as const },
                    { icon: <Download size={14} />, label: 'Downloads', value: downloadedIds.length, view: 'download-history' as const },
                    { icon: <Bookmark size={14} />, label: 'Bookmarks', value: bookmarkedIds.length, view: 'bookmarks' as const },
                  ].map(s => (
                    <button key={s.label} onClick={() => navigate(s.view)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-50 transition group">
                      <div className="flex items-center gap-2 text-navy-600 text-sm">
                        <span className="text-navy-400 group-hover:text-navy-600 transition">{s.icon}</span>
                        {s.label}
                      </div>
                      <span className="font-bold text-navy-800">{s.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {user.role === 'lecturer' && (
              <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
                <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">Activity Summary</h3>
                <div className="space-y-3">
                  {[
                    { icon: <Upload size={14} />, label: 'Resources Uploaded', value: myResources.length, view: 'lecturer-resources' as const },
                    { icon: <FileText size={14} />, label: 'Reviews Completed', value: 3, view: 'review-submissions' as const },
                  ].map(s => (
                    <button key={s.label} onClick={() => navigate(s.view)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-navy-50 transition group">
                      <div className="flex items-center gap-2 text-navy-600 text-sm">
                        <span className="text-navy-400 group-hover:text-navy-600 transition">{s.icon}</span>
                        {s.label}
                      </div>
                      <span className="font-bold text-navy-800">{s.value}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Account information */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide">Account Information</h3>
                <button className="text-xs text-navy-600 hover:text-navy-800 font-semibold border border-navy-200 px-3 py-1.5 rounded-lg hover:bg-navy-50 transition">Edit</button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {infoItems.filter(m => m.label !== 'Account Status').map((m, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-navy-50 flex items-center justify-center text-navy-500 shrink-0 mt-0.5">
                      {m.icon}
                    </div>
                    <div>
                      <div className="text-[10px] text-navy-400 font-semibold uppercase tracking-wide">{m.label}</div>
                      <div className="text-sm text-navy-700 font-medium mt-0.5">{m.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Change password */}
            <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide mb-4">Security</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1.5">Current Password</label>
                  <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1.5">New Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-navy-700 mb-1.5">Confirm Password</label>
                    <input type="password" placeholder="••••••••" className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
                  </div>
                </div>
                <button className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition">Update Password</button>
              </div>
            </div>

            {/* Institutional notice */}
            <div className="bg-navy-50 rounded-xl border border-navy-100 p-4 text-xs text-navy-500 leading-relaxed">
              <span className="font-semibold text-navy-700">Note: </span>
              Your account is managed by Cavendish University Zambia. To change your name, student/staff ID, programme, or school, please contact the Registry Office or IT Helpdesk at <span className="text-navy-700 font-medium">itsupport@cavendish.ac.zm</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
