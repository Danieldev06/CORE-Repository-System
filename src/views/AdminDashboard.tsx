// src/views/AdminDashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Users, ClipboardCheck, BookOpen, Bookmark, Archive,
  TrendingUp, Activity, ChevronRight, Clock, CheckCircle, Upload,
  Loader2, AlertCircle, GraduationCap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { useApp } from '../context';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';
import { extractApiError } from '../services/api';

// ============================================================
// TYPES
// ============================================================

interface AdminStats {
  total_resources: number;
  approved_resources: number;
  pending_resources: number;
  total_downloads: number;
  total_users: number;
  student_count: number;
  lecturer_count: number;
  admin_count: number;
  by_type: { type: string; count: number }[];
  monthly_uploads: { month: string; uploads: number }[];
  recent_activity: {
    id: number;
    title: string;
    user: string;
    date: string;
    is_approved: boolean;
    resource_type: string;
  }[];
}

// ============================================================
// CONSTANTS
// ============================================================

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  NOTES: { label: 'Lecture Notes', color: '#0f2e6b' },
  PASTPAPER: { label: 'Past Papers', color: '#8b5cf6' },
  DISSERTATION: { label: 'Dissertations', color: '#2563eb' },
  ARTICLE: { label: 'Research Articles', color: '#14b8a6' },
};

const TYPE_TO_FRONTEND: Record<string, any> = {
  NOTES: 'lecture-notes',
  PASTPAPER: 'past-paper',
  DISSERTATION: 'dissertation',
  ARTICLE: 'research-paper',
};

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon, label, value, sub, color, onClick, loading,
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; color: string; onClick?: () => void; loading?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-navy-100 p-5 shadow-sm ${
        onClick ? 'cursor-pointer hover:border-navy-300 hover:shadow-md transition-all' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {sub && (
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
            {sub}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-navy-900">
        {loading ? <span className="inline-block w-8 h-6 bg-navy-50 rounded animate-pulse" /> : value}
      </div>
      <div className="text-xs text-navy-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

// ============================================================
// ACTIVITY ICON HELPER
// ============================================================

function activityIcon(type: string, isApproved: boolean) {
  if (isApproved) {
    return { icon: <CheckCircle size={13} />, color: 'bg-emerald-100 text-emerald-600' };
  }
  if (type === 'DISSERTATION') {
    return { icon: <ClipboardCheck size={13} />, color: 'bg-amber-100 text-amber-600' };
  }
  return { icon: <Upload size={13} />, color: 'bg-navy-100 text-navy-600' };
}

function formatRelative(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return then.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function AdminDashboard() {
  const { navigate } = useApp();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('core_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://localhost:8000/api/admin/stats/', {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error('You are not authorized to view this page.');
        throw new Error('Failed to load admin statistics.');
      }

      const data: AdminStats = await res.json();
      setStats(data);
      setError('');
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin mb-3" />
        <div className="text-navy-500">Loading admin dashboard...</div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Error
  // ------------------------------------------------------------
  if (error || !stats) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold mb-1">Couldn't load admin dashboard</div>
            <div className="text-xs">{error}</div>
            <button
              onClick={fetchStats}
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
  // Derived display data
  // ------------------------------------------------------------
  const maxCount = Math.max(1, ...stats.by_type.map((t) => t.count));

  const typeLabel = (apiType: string) =>
    TYPE_LABELS[apiType]?.label || apiType;

  const typeColor = (apiType: string) =>
    TYPE_LABELS[apiType]?.color || '#64748b';

  // ------------------------------------------------------------
  // Main
  // ------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title="Administrator Dashboard"
        subtitle="Cavendish Online Resource Exchange — System Overview"
      />
      <div className="p-6 max-w-7xl mx-auto space-y-7">
        {/* Main stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FileText size={20} className="text-navy-700" />}
            label="Total Resources"
            value={stats.total_resources}
            sub={`${stats.approved_resources} approved`}
            color="bg-navy-50"
            onClick={() => navigate('admin-resources')}
          />
          <StatCard
            icon={<Users size={20} className="text-blue-600" />}
            label="Registered Users"
            value={stats.total_users}
            sub={`${stats.student_count} students`}
            color="bg-blue-50"
            onClick={() => navigate('admin-users')}
          />
          <StatCard
            icon={<ClipboardCheck size={20} className="text-amber-600" />}
            label="Pending Approvals"
            value={stats.pending_resources}
            sub={stats.pending_resources > 0 ? 'Action needed' : undefined}
            color="bg-amber-50"
            onClick={() => navigate('admin-resources')}
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-emerald-600" />}
            label="Total Downloads"
            value={stats.total_downloads.toLocaleString()}
            color="bg-emerald-50"
            onClick={() => navigate('admin-analytics')}
          />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Students', value: stats.student_count, color: 'text-navy-700', bg: 'bg-navy-50 border-navy-100' },
            { label: 'Lecturers', value: stats.lecturer_count, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
            { label: 'Admins', value: stats.admin_count, color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100' },
            { label: 'Approved', value: stats.approved_resources, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
          ].map((s) => (
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
                <p className="text-xs text-navy-400 mt-0.5">
                  Monthly resource uploads
                </p>
              </div>
              <button
                onClick={() => navigate('admin-analytics')}
                className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
              >
                Full analytics <ChevronRight size={13} />
              </button>
            </div>
            {stats.monthly_uploads.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-navy-400 text-sm">
                No upload data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={stats.monthly_uploads}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#dde6f5" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0d2454',
                      border: 'none',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 12,
                    }}
                    cursor={{ fill: '#f0f4fb' }}
                  />
                  <Bar
                    dataKey="uploads"
                    fill="#0f2e6b"
                    radius={[4, 4, 0, 0]}
                    name="Uploads"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Category breakdown */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-bold text-navy-900 text-sm mb-4">
              Resources by Category
            </h3>
            {stats.by_type.length === 0 ? (
              <div className="text-center py-8 text-navy-400 text-sm">
                No resources yet
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.by_type.map((c) => (
                  <div key={c.type}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-navy-600 font-medium">
                        {typeLabel(c.type)}
                      </span>
                      <span className="text-navy-400 font-semibold">{c.count}</span>
                    </div>
                    <div className="h-1.5 bg-navy-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(c.count / maxCount) * 100}%`,
                          backgroundColor: typeColor(c.type),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent uploads */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                Recent Activity
                {stats.pending_resources > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                    {stats.pending_resources} pending
                  </span>
                )}
              </h3>
              <button
                onClick={() => navigate('admin-resources')}
                className="text-xs text-navy-600 hover:text-navy-800 font-medium flex items-center gap-1"
              >
                View all <ChevronRight size={13} />
              </button>
            </div>
            <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              {stats.recent_activity.length === 0 ? (
                <div className="text-center py-8 text-navy-400 text-sm">
                  No activity yet
                </div>
              ) : (
                stats.recent_activity.slice(0, 5).map((a, i, arr) => {
                  const { icon, color } = activityIcon(a.resource_type, a.is_approved);
                  return (
                    <div
                      key={a.id}
                      className={`flex items-start gap-3 px-4 py-3 ${
                        i < arr.length - 1 ? 'border-b border-navy-50' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${color}`}
                      >
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-navy-700 leading-snug line-clamp-1">
                          <strong>{a.user}</strong> uploaded{' '}
                          <em>{a.title}</em>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-navy-400 flex items-center gap-1">
                            <Clock size={9} />
                            {formatRelative(a.date)}
                          </span>
                          <StatusBadge
                            status={a.is_approved ? 'approved' : 'under-review'}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-bold text-navy-900 text-base mb-4 flex items-center gap-2">
              <Activity size={16} className="text-navy-600" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: 'Manage Resources',
                  icon: <FileText size={16} />,
                  view: 'admin-resources' as const,
                  color: 'bg-navy-800 text-white hover:bg-navy-700 shadow-sm',
                },
                {
                  label: 'Manage Users',
                  icon: <Users size={16} />,
                  view: 'admin-users' as const,
                  color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
                },
                {
                  label: 'Analytics',
                  icon: <TrendingUp size={16} />,
                  view: 'admin-analytics' as const,
                  color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
                },
                {
                  label: 'Upload Resource',
                  icon: <Upload size={16} />,
                  view: 'upload-resource' as const,
                  color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
                },
                {
                  label: 'Library Settings',
                  icon: <Archive size={16} />,
                  view: 'admin-settings' as const,
                  color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
                },
                {
                  label: 'My Profile',
                  icon: <GraduationCap size={16} />,
                  view: 'profile' as const,
                  color: 'bg-white border border-navy-200 text-navy-700 hover:bg-navy-50',
                },
              ].map((a, i) => (
                <button
                  key={i}
                  onClick={() => navigate(a.view)}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-sm font-semibold transition ${a.color}`}
                >
                  {a.icon} {a.label}
                </button>
              ))}
            </div>

            {/* User breakdown */}
            <div className="mt-5 bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
              <h4 className="font-semibold text-navy-800 text-xs uppercase tracking-wide mb-3">
                User Breakdown
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-navy-600">Students</span>
                  <span className="font-bold text-navy-900">{stats.student_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy-600">Lecturers</span>
                  <span className="font-bold text-navy-900">{stats.lecturer_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-navy-600">Administrators</span>
                  <span className="font-bold text-navy-900">{stats.admin_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}