// src/views/AdminAnalyticsView.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend,
} from 'recharts';
import {
  Download, TrendingUp, Users, FileText, Eye,
  Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { PageHeader } from '../components/Layout';
import { extractApiError } from '../services/api';

// ============================================================
// TYPES
// ============================================================

interface TopResource {
  id: number;
  title: string;
  type: string;
  downloads: number;
  views: number;
}

interface ProgrammeAccess {
  name: string;
  code: string;
  resources: number;
  downloads: number;
}

interface SchoolBreakdown {
  school: string;
  code: string;
  resources: number;
  users: number;
  downloads: number;
}

interface QuarterlyStat {
  quarter: string;
  resources: number;
  downloads: number;
}

interface Analytics {
  total_resources: number;
  approved_resources: number;
  total_downloads: number;
  total_users: number;
  active_users: number;
  top_resources: TopResource[];
  programme_access: ProgrammeAccess[];
  school_breakdown: SchoolBreakdown[];
  quarterly: QuarterlyStat[];
}

// ============================================================
// PALETTE
// ============================================================

const PIE_COLORS = ['#0f2e6b', '#1d4ed8', '#3568ae', '#5a8ac4', '#8eb0d9', '#bdd0eb'];
const SCHOOL_COLORS = [
  'bg-navy-800',
  'bg-blue-700',
  'bg-indigo-700',
  'bg-slate-700',
  'bg-teal-700',
  'bg-purple-700',
];

// ============================================================
// REUSABLE COMPONENTS
// ============================================================

function StatTile({
  icon, label, value, delta, color, loading,
}: {
  icon: React.ReactNode; label: string; value: string;
  delta?: string; color: string; loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {delta && (
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <TrendingUp size={10} />
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-navy-900">
        {loading ? (
          <span className="inline-block w-12 h-6 bg-navy-50 rounded animate-pulse" />
        ) : (
          value
        )}
      </div>
      <div className="text-xs text-navy-500 font-medium mt-0.5">{label}</div>
    </div>
  );
}

function ChartCard({
  title, sub, children,
}: {
  title: string; sub?: string; children: React.ReactNode;
}) {
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
            <span>
              {p.name}: <strong>{p.value.toLocaleString()}</strong>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminAnalyticsView() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    const token = localStorage.getItem('core_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:8000/api/admin/analytics/', {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error('You are not authorized.');
        throw new Error('Failed to load analytics.');
      }

      const data: Analytics = await res.json();
      setAnalytics(data);
      setError('');
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin mb-3" />
        <div className="text-navy-500">Loading analytics...</div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Error
  // ------------------------------------------------------------
  if (error || !analytics) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold mb-1">Couldn't load analytics</div>
            <div className="text-xs">{error}</div>
            <button
              onClick={handleRefresh}
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
  // Derived values for chart scaling
  // ------------------------------------------------------------
  const topDownloadValue = Math.max(
    1,
    ...analytics.top_resources.map((r) => r.downloads)
  );

  const maxProgrammeDownloads = Math.max(
    1,
    ...analytics.programme_access.map((p) => p.downloads)
  );

  // ------------------------------------------------------------
  // Main
  // ------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title="Analytics & Reports"
        subtitle="Repository usage statistics, growth trends, and performance metrics"
        breadcrumbs={[{ label: 'Analytics' }]}
        actions={
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top-level KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile
            icon={<FileText size={20} className="text-navy-700" />}
            label="Total Resources"
            value={analytics.total_resources.toString()}
            color="bg-navy-50"
          />
          <StatTile
            icon={<Download size={20} className="text-blue-600" />}
            label="Total Downloads"
            value={analytics.total_downloads.toLocaleString()}
            color="bg-blue-50"
          />
          <StatTile
            icon={<Users size={20} className="text-emerald-600" />}
            label="Active Users"
            value={analytics.active_users.toString()}
            color="bg-emerald-50"
          />
          <StatTile
            icon={<Eye size={20} className="text-purple-600" />}
            label="Approved Resources"
            value={analytics.approved_resources.toString()}
            color="bg-purple-50"
          />
        </div>

        {/* Quarterly overview */}
        {analytics.quarterly.length > 0 ? (
          <ChartCard
            title="Quarterly Overview"
            sub="Resources added and downloads by quarter"
          >
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart
                data={analytics.quarterly}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
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
                <XAxis
                  dataKey="quarter"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="downloads"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  fill="url(#gradDownloads)"
                  name="Downloads"
                  dot={{ r: 3, fill: '#1d4ed8', strokeWidth: 0 }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="resources"
                  stroke="#0f2e6b"
                  strokeWidth={2}
                  fill="url(#gradResources)"
                  name="Resources Added"
                  dot={{ r: 3, fill: '#0f2e6b', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : (
          <ChartCard title="Quarterly Overview">
            <div className="text-center py-12 text-navy-400 text-sm">
              Not enough data to display quarterly trends yet.
            </div>
          </ChartCard>
        )}

        {/* Programme access + Top resources */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Programme downloads */}
          {analytics.programme_access.length > 0 ? (
            <ChartCard
              title="Downloads by Programme"
              sub="Top programmes by resource downloads"
            >
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={analytics.programme_access}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dde6f5" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="code"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="downloads" fill="#0f2e6b" radius={[0, 3, 3, 0]} name="Downloads" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : (
            <ChartCard title="Downloads by Programme">
              <div className="text-center py-12 text-navy-400 text-sm">
                No downloads recorded yet.
              </div>
            </ChartCard>
          )}

          {/* Top resources */}
          {analytics.top_resources.length > 0 ? (
            <ChartCard
              title="Top Downloaded Resources"
              sub="Most downloaded resources (top 5)"
            >
              <div className="space-y-3">
                {analytics.top_resources.slice(0, 5).map((r, i) => (
                  <div key={r.id}>
                    <div className="flex items-start justify-between gap-3 text-xs mb-1.5">
                      <div className="flex items-start gap-2 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                            i === 0
                              ? 'bg-navy-800 text-white'
                              : i === 1
                              ? 'bg-navy-700 text-white'
                              : 'bg-navy-100 text-navy-600'
                          }`}
                        >
                          {i + 1}
                        </div>
                        <span className="text-navy-700 font-medium leading-snug line-clamp-2">
                          {r.title}
                        </span>
                      </div>
                      <span className="text-navy-500 font-bold shrink-0">
                        {r.downloads}
                      </span>
                    </div>
                    <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-navy-700"
                        style={{ width: `${(r.downloads / topDownloadValue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          ) : (
            <ChartCard title="Top Downloaded Resources">
              <div className="text-center py-12 text-navy-400 text-sm">
                No downloads recorded yet.
              </div>
            </ChartCard>
          )}
        </div>

        {/* School breakdown */}
        {analytics.school_breakdown.length > 0 && (
          <div>
            <h3 className="font-bold text-navy-900 text-sm mb-3">
              Breakdown by Faculty / School
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.school_breakdown.map((s, i) => (
                <div
                  key={s.school}
                  className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm"
                >
                  <div className={`h-1.5 ${SCHOOL_COLORS[i % SCHOOL_COLORS.length]}`} />
                  <div className="p-4">
                    <div className="text-xs font-bold text-navy-700 mb-3 leading-tight">
                      {s.school}
                    </div>
                    <div className="space-y-1.5 text-xs text-navy-500">
                      <div className="flex justify-between">
                        <span>Resources</span>
                        <span className="font-bold text-navy-800">{s.resources}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Users</span>
                        <span className="font-bold text-navy-800">{s.users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Downloads</span>
                        <span className="font-bold text-navy-800">
                          {s.downloads.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most accessed resources table */}
        {analytics.top_resources.length > 0 && (
          <ChartCard
            title="Most Accessed Resources"
            sub="Top resources by downloads — all time"
          >
            <div className="overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100">
                    <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                      #
                    </th>
                    <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                      Resource
                    </th>
                    <th className="text-left py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide hidden sm:table-cell">
                      Type
                    </th>
                    <th className="text-right py-2.5 text-xs font-semibold text-navy-500 uppercase tracking-wide">
                      Downloads
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.top_resources.map((r, i) => (
                    <tr
                      key={r.id}
                      className="border-b border-navy-50 hover:bg-navy-50 transition last:border-none"
                    >
                      <td className="py-3 pr-3 text-navy-400 font-bold text-sm">
                        {i + 1}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="font-medium text-navy-800 text-sm leading-snug max-w-[280px] truncate">
                          {r.title}
                        </div>
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        <span className="text-xs text-navy-500 bg-navy-50 border border-navy-100 px-2 py-0.5 rounded-md font-medium">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="hidden lg:block h-1.5 w-24 bg-navy-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-navy-700 rounded-full"
                              style={{ width: `${(r.downloads / topDownloadValue) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-navy-800 w-10 text-right">
                            {r.downloads}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}