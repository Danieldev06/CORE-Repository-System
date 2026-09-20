import { FileText, Users, ClipboardCheck, BookOpen, Bookmark, Archive, TrendingUp, Activity, ChevronRight, Clock, CheckCircle, Upload } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../context';
import { MOCK_RESOURCES, MOCK_SUBMISSIONS, ALL_USERS, MONTHLY_UPLOADS, MONTHLY_DOWNLOADS, CATEGORY_STATS } from '../data';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';

function StatCard({ icon, label, value, sub, color, onClick }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-white rounded-xl border border-navy-100 p-5 shadow-sm ${onClick ? 'cursor-pointer hover:border-navy-300 hover:shadow-md transition-all' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {sub && <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">{sub}</span>}
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-xs text-navy-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

const ACTIVITY_FEED = [
  { time: '2 min ago', icon: <Upload size={13} />, text: 'Dr. Chanda Musonda uploaded COM322 Lecture Notes (Unit 7)', color: 'bg-navy-100 text-navy-600' },
  { time: '1 hr ago', icon: <ClipboardCheck size={13} />, text: 'Namwaka Chisanga submitted a research proposal for review', color: 'bg-amber-100 text-amber-600' },
  { time: '3 hrs ago', icon: <CheckCircle size={13} />, text: 'Library approved: Machine Learning-Based Price Prediction Dissertation', color: 'bg-emerald-100 text-emerald-600' },
  { time: '5 hrs ago', icon: <Users size={13} />, text: 'New student account registered: Musonda Zulu (BSc Business Administration)', color: 'bg-blue-100 text-blue-600' },
  { time: 'Yesterday', icon: <Archive size={13} />, text: 'IT101 Lecture Notes (2019) archived by administrator', color: 'bg-gray-100 text-gray-500' },
  { time: 'Yesterday', icon: <ClipboardCheck size={13} />, text: 'Dr. Mulenga Kalinda approved: Cybersecurity Awareness Research Paper', color: 'bg-emerald-100 text-emerald-600' },
  { time: '2 days ago', icon: <Upload size={13} />, text: 'Librarian uploaded: Research Methodology Academic Guide 2026', color: 'bg-navy-100 text-navy-600' },
];

export default function AdminDashboard() {
  const { navigate } = useApp();
  const totalResources = MOCK_RESOURCES.length;
  const totalUsers = ALL_USERS.length;
  const pendingApprovals = MOCK_SUBMISSIONS.filter(s => s.status === 'submitted' || s.status === 'under-review').length;
  const dissertations = MOCK_RESOURCES.filter(r => r.type === 'dissertation').length;
  const pastPapers = MOCK_RESOURCES.filter(r => r.type === 'past-paper').length;
  const lectureNotes = MOCK_RESOURCES.filter(r => r.type === 'lecture-notes').length;

  return (
    <div>
      <PageHeader
        title="Administrator Dashboard"
        subtitle="Cavendish Online Resource Exchange — System Overview"
      />
      <div className="p-6 max-w-7xl mx-auto space-y-7">
        {/* Main stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<FileText size={20} className="text-navy-700" />} label="Total Resources" value={totalResources} sub="+8 this month" color="bg-navy-50" onClick={() => navigate('admin-resources')} />
          <StatCard icon={<Users size={20} className="text-blue-600" />} label="Registered Users" value={totalUsers} sub="+3 this week" color="bg-blue-50" onClick={() => navigate('admin-users')} />
          <StatCard icon={<ClipboardCheck size={20} className="text-amber-600" />} label="Pending Approvals" value={pendingApprovals} sub={pendingApprovals > 0 ? 'Action needed' : undefined} color="bg-amber-50" onClick={() => navigate('review-submissions')} />
          <StatCard icon={<TrendingUp size={20} className="text-emerald-600" />} label="Downloads This Month" value="834" sub="+23% vs last month" color="bg-emerald-50" onClick={() => navigate('admin-analytics')} />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: 'Dissertations', value: dissertations, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
            { label: 'Past Papers', value: pastPapers, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100' },
            { label: 'Lecture Notes', value: lectureNotes, color: 'text-navy-700', bg: 'bg-navy-50 border-navy-100' },
            { label: 'Research Papers', value: MOCK_RESOURCES.filter(r => r.type === 'research-paper').length, color: 'text-teal-700', bg: 'bg-teal-50 border-teal-100' },
            { label: 'Proposals', value: MOCK_RESOURCES.filter(r => r.type === 'research-proposal').length, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-100' },
            { label: 'Guides', value: MOCK_RESOURCES.filter(r => r.type === 'academic-guide').length, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[11px] text-navy-500 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Uploads chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-navy-900 text-sm">Repository Growth</h3>
                <p className="text-xs text-navy-400 mt-0.5">Monthly resource uploads — 2026</p>
              </div>
              <button onClick={() => navigate('admin-analytics')} className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1">
                Full analytics <ChevronRight size={13} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_UPLOADS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde6f5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#0d2454', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }}
                  cursor={{ fill: '#f0f4fb' }}
                />
                <Bar dataKey="uploads" fill="#0f2e6b" radius={[4, 4, 0, 0]} name="Uploads" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-bold text-navy-900 text-sm mb-4">Resources by Category</h3>
            <div className="space-y-2.5">
              {CATEGORY_STATS.map(c => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-navy-600 font-medium">{c.name}</span>
                    <span className="text-navy-400 font-semibold">{c.count}</span>
                  </div>
                  <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(c.count / 62) * 100}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Downloads chart */}
        <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-navy-900 text-sm">Download Activity</h3>
              <p className="text-xs text-navy-400 mt-0.5">Total resource downloads per month — 2026</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={MONTHLY_DOWNLOADS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde6f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d2454', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
              <Line type="monotone" dataKey="downloads" stroke="#1d4ed8" strokeWidth={2.5} dot={{ fill: '#1d4ed8', r: 3, strokeWidth: 0 }} name="Downloads" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending approvals */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                Pending Approvals
                {pendingApprovals > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{pendingApprovals}</span>}
              </h3>
              <button onClick={() => navigate('review-submissions')} className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1">
                Review all <ChevronRight size={13} />
              </button>
            </div>
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              {MOCK_SUBMISSIONS.filter(s => s.status === 'submitted' || s.status === 'under-review').slice(0, 4).map((s, i, arr) => (
                <div key={s.id} className={`flex items-center gap-4 px-4 py-3.5 hover:bg-navy-50 transition ${i < arr.length - 1 ? 'border-b border-navy-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-navy-800 text-sm truncate">{s.title}</div>
                    <div className="text-[11px] text-navy-400 mt-0.5">{s.studentName} · {s.programme}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ResourceTypeBadge type={s.type} />
                    <StatusBadge status={s.status} />
                    <button onClick={() => navigate('review-submissions', { id: s.id })}
                      className="px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition">
                      Review
                    </button>
                  </div>
                </div>
              ))}
              {pendingApprovals === 0 && (
                <div className="text-center py-8 text-navy-400 text-sm">No pending approvals</div>
              )}
            </div>
          </div>

          {/* Activity feed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                <Activity size={16} className="text-navy-600" /> Recent Activity
              </h3>
              <button onClick={() => navigate('admin-activity')} className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1">
                View all <ChevronRight size={13} />
              </button>
            </div>
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              {ACTIVITY_FEED.map((a, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i < ACTIVITY_FEED.length - 1 ? 'border-b border-navy-50' : ''}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${a.color}`}>
                    {a.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-navy-700 leading-snug">{a.text}</div>
                    <div className="text-[10px] text-navy-400 mt-0.5 flex items-center gap-1"><Clock size={9} />{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
