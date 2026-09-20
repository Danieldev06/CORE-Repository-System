import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import { Download, TrendingUp, Users, FileText, BookOpen, Eye } from 'lucide-react';
import { PageHeader } from '../components/Layout';
import {
  MONTHLY_UPLOADS, MONTHLY_DOWNLOADS, CATEGORY_STATS,
  MOCK_RESOURCES, ALL_USERS,
} from '../data';

const PROGRAMME_ACCESS = [
  { name: 'BSc Computer Science', accesses: 1240, downloads: 487 },
  { name: 'BSc Information Technology', accesses: 892, downloads: 341 },
  { name: 'BSc Business Administration', accesses: 634, downloads: 218 },
  { name: 'BSc Software Engineering', accesses: 578, downloads: 193 },
  { name: 'BSc Data Science', accesses: 421, downloads: 157 },
  { name: 'LLB Law', accesses: 312, downloads: 98 },
];

const TOP_RESOURCES = [
  { title: 'COM201 Data Structures — Past Paper 2024', type: 'Past Paper', downloads: 389, views: 1047 },
  { title: 'IT111 Introduction to IT — Past Paper 2024', type: 'Past Paper', downloads: 487, views: 1203 },
  { title: 'COM322 Web Design Lecture Notes', type: 'Lecture Notes', downloads: 312, views: 891 },
  { title: 'COM301 Software Engineering Notes', type: 'Lecture Notes', downloads: 341, views: 874 },
  { title: 'Machine Learning Price Prediction Dissertation', type: 'Dissertation', downloads: 128, views: 394 },
];

const QUARTERLY = [
  { quarter: 'Q1 2025', resources: 38, users: 142, downloads: 1187 },
  { quarter: 'Q2 2025', resources: 52, users: 168, downloads: 1543 },
  { quarter: 'Q3 2025', resources: 44, users: 193, downloads: 1398 },
  { quarter: 'Q4 2025', resources: 61, users: 221, downloads: 1872 },
  { quarter: 'Q1 2026', resources: 49, users: 248, downloads: 1621 },
  { quarter: 'Q2 2026', resources: 72, users: 276, downloads: 2034 },
];

const PIE_COLORS = ['#0f2e6b', '#1d4ed8', '#3568ae', '#5a8ac4', '#8eb0d9', '#bdd0eb'];

function StatTile({ icon, label, value, delta, color }: { icon: React.ReactNode; label: string; value: string; delta?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        {delta && (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <TrendingUp size={10} />{delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
      <div className="text-xs text-navy-500 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="font-bold text-navy-900 text-sm">{title}</h3>
        {sub && <p className="text-xs text-navy-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-900 text-white px-3 py-2.5 rounded-xl shadow-xl text-xs">
        <div className="font-semibold mb-1.5 text-white/80">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span>{p.name}: <strong>{p.value.toLocaleString()}</strong></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminAnalyticsView() {
  const totalDownloads = MONTHLY_DOWNLOADS.reduce((a, m) => a + m.downloads, 0);
  const totalUploads = MONTHLY_UPLOADS.reduce((a, m) => a + m.uploads, 0);

  return (
    <div>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Repository usage statistics, growth trends, and performance metrics — 2025/2026 Academic Year"
        breadcrumbs={[{ label: 'Analytics' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">
            <Download size={14} /> Export Report
          </button>
        }
      />
      <div className="p-6 max-w-7xl mx-auto space-y-6">

        {/* Top-level KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile icon={<FileText size={20} className="text-navy-700" />} label="Total Resources" value={MOCK_RESOURCES.length.toString()} delta="+18% this term" color="bg-navy-50" />
          <StatTile icon={<Download size={20} className="text-blue-600" />} label="Total Downloads (2026)" value={totalDownloads.toLocaleString()} delta="+23% vs 2025" color="bg-blue-50" />
          <StatTile icon={<Users size={20} className="text-emerald-600" />} label="Active Users" value={ALL_USERS.filter(u => u.status === 'active').length.toString()} delta="+9 this month" color="bg-emerald-50" />
          <StatTile icon={<Eye size={20} className="text-purple-600" />} label="Total Resource Views" value="8,412" delta="+31% this term" color="bg-purple-50" />
        </div>

        {/* Quarterly overview */}
        <ChartCard title="Quarterly Overview" sub="Resources, users, and downloads by quarter — 2025–2026">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={QUARTERLY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradResources" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f2e6b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0f2e6b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDownloads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#dde6f5" vertical={false} />
              <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Area yAxisId="right" type="monotone" dataKey="downloads" stroke="#1d4ed8" strokeWidth={2} fill="url(#gradDownloads)" name="Downloads" dot={{ r: 3, fill: '#1d4ed8', strokeWidth: 0 }} />
              <Area yAxisId="left" type="monotone" dataKey="resources" stroke="#0f2e6b" strokeWidth={2} fill="url(#gradResources)" name="Resources Added" dot={{ r: 3, fill: '#0f2e6b', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Charts grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Monthly uploads */}
          <ChartCard title="Monthly Resource Uploads" sub="New resources added per month — 2026">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MONTHLY_UPLOADS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde6f5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="uploads" fill="#0f2e6b" radius={[4, 4, 0, 0]} name="Uploads" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Monthly downloads */}
          <ChartCard title="Monthly Downloads" sub="Resource downloads by month — 2026">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={MONTHLY_DOWNLOADS} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde6f5" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="downloads" stroke="#1d4ed8" strokeWidth={2.5} dot={{ fill: '#1d4ed8', r: 3.5, strokeWidth: 0 }} name="Downloads" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Resource categories + programme access */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pie chart */}
          <ChartCard title="Resources by Category" sub="Distribution across resource types">
            <div className="flex items-center gap-6">
              <div className="shrink-0">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={CATEGORY_STATS} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="count">
                      {CATEGORY_STATS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2.5">
                {CATEGORY_STATS.map((c, i) => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                        <span className="text-navy-600 font-medium">{c.name}</span>
                      </div>
                      <span className="text-navy-400 font-semibold">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-navy-50 rounded-full">
                      <div className="h-full rounded-full" style={{ width: `${(c.count / 62) * 100}%`, backgroundColor: PIE_COLORS[i] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>

          {/* Programme access */}
          <ChartCard title="Access by Programme" sub="Resource accesses and downloads per programme">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={PROGRAMME_ACCESS} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde6f5" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={140}
                  tickFormatter={v => v.replace('BSc ', '').replace('Bachelor of ', '')} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="accesses" fill="#dde6f5" radius={[0, 3, 3, 0]} name="Accesses" />
                <Bar dataKey="downloads" fill="#0f2e6b" radius={[0, 3, 3, 0]} name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Top resources table */}
        <ChartCard title="Most Accessed Resources" sub="Top resources by downloads and views — all time">
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">#</th>
                  <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">Resource</th>
                  <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide hidden sm:table-cell">Type</th>
                  <th className="text-right py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">Downloads</th>
                  <th className="text-right py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide hidden md:table-cell">Views</th>
                </tr>
              </thead>
              <tbody>
                {TOP_RESOURCES.map((r, i) => (
                  <tr key={i} className="border-b border-navy-50 hover:bg-navy-50 transition">
                    <td className="py-3 pr-3 text-navy-400 font-bold text-sm">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-navy-800 text-sm leading-snug max-w-[260px] truncate">{r.title}</div>
                    </td>
                    <td className="py-3 hidden sm:table-cell">
                      <span className="text-xs text-navy-500 bg-navy-50 border border-navy-100 px-2 py-0.5 rounded-md font-medium">{r.type}</span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden lg:block h-1.5 w-24 bg-navy-100 rounded-full overflow-hidden">
                          <div className="h-full bg-navy-700 rounded-full" style={{ width: `${(r.downloads / 487) * 100}%` }} />
                        </div>
                        <span className="text-sm font-bold text-navy-800 w-10 text-right">{r.downloads}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm text-navy-500 hidden md:table-cell">{r.views.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>

        {/* School breakdown */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { school: 'School of Computing & IT', resources: 9, users: 7, downloads: 2347, color: 'bg-navy-800' },
            { school: 'School of Business', resources: 2, users: 4, downloads: 714, color: 'bg-blue-700' },
            { school: 'School of Law', resources: 0, users: 2, downloads: 98, color: 'bg-indigo-700' },
            { school: 'School of Social Sciences', resources: 1, users: 3, downloads: 312, color: 'bg-slate-700' },
          ].map(s => (
            <div key={s.school} className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              <div className={`h-1.5 ${s.color}`} />
              <div className="p-4">
                <div className="text-xs font-bold text-navy-700 mb-3 leading-tight">{s.school}</div>
                <div className="space-y-1.5 text-xs text-navy-500">
                  <div className="flex justify-between"><span>Resources</span><span className="font-bold text-navy-800">{s.resources}</span></div>
                  <div className="flex justify-between"><span>Users</span><span className="font-bold text-navy-800">{s.users}</span></div>
                  <div className="flex justify-between"><span>Downloads</span><span className="font-bold text-navy-800">{s.downloads.toLocaleString()}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Report export section */}
        <div className="bg-navy-900 rounded-xl p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-bold text-sm mb-1">Generate Repository Report</h3>
            <p className="text-white/50 text-xs">Export a full analytics report for the current academic year in PDF or Excel format.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button className="px-4 py-2 border border-white/20 hover:bg-white/10 text-white font-semibold rounded-xl text-sm transition">
              Export Excel
            </button>
            <button className="px-4 py-2 bg-white hover:bg-navy-50 text-navy-800 font-semibold rounded-xl text-sm transition flex items-center gap-2">
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
