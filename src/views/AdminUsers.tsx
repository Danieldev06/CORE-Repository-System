// src/views/AdminUsers.tsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Eye, UserCheck, UserX, ChevronLeft, ChevronRight, X,
  Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { useApp } from '../context';
import { PageHeader } from '../components/Layout';
import { extractApiError } from '../services/api';

// ============================================================
// TYPES
// ============================================================

interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  role: 'student' | 'lecturer' | 'admin';
  student_id: string;
  faculty: string;
  programme: string;
  year: number | null;
}

type Tab = 'students' | 'lecturers' | 'administrators';

const TAB_TO_ROLE: Record<Tab, 'student' | 'lecturer' | 'admin'> = {
  students: 'student',
  lecturers: 'lecturer',
  administrators: 'admin',
};

// ============================================================
// API HELPERS
// ============================================================

async function fetchUsers(token: string): Promise<AdminUser[]> {
  const res = await fetch('http://localhost:8000/api/admin/users/', {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load users.');
  return res.json();
}

async function toggleUser(token: string, userId: number) {
  const res = await fetch(
    `http://localhost:8000/api/admin/users/${userId}/toggle/`,
    {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
    }
  );
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json;
}

// ============================================================
// COMPONENT
// ============================================================

export default function AdminUsers() {
  const { showToast } = useApp();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [tab, setTab] = useState<Tab>('students');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // ------------------------------------------------------------
  // Fetch
  // ------------------------------------------------------------
  const fetchData = useCallback(
    async (showRefreshToast = false) => {
      const token = localStorage.getItem('core_token');
      if (!token) {
        setError('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const data = await fetchUsers(token);
        setUsers(data);
        setError('');
        if (showRefreshToast) {
          showToast({ message: 'Users refreshed', type: 'success' });
        }
      } catch (err: any) {
        setError(extractApiError(err) || 'Failed to load users.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // ------------------------------------------------------------
  // Filtering
  // ------------------------------------------------------------
  const filtered = useMemo(() => {
    const role = TAB_TO_ROLE[tab];
    let list = users.filter((u) => u.role === role);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) => {
        const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
        return (
          fullName.includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.student_id.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [users, tab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [tab, search]);

  const tabCounts = useMemo(
    () => ({
      students: users.filter((u) => u.role === 'student').length,
      lecturers: users.filter((u) => u.role === 'lecturer').length,
      administrators: users.filter((u) => u.role === 'admin').length,
    }),
    [users]
  );

  // ------------------------------------------------------------
  // Toggle active
  // ------------------------------------------------------------
  const handleToggle = async (userId: number, currentlyActive: boolean) => {
    const token = localStorage.getItem('core_token');
    if (!token) return;

    const label = currentlyActive ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${label} this user?`)) return;

    setActionLoading(true);
    try {
      const result = await toggleUser(token, userId);
      showToast({ message: result.message, type: 'success' });

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: result.is_active } : u
        )
      );
    } catch (err: any) {
      showToast({
        message: `Action failed: ${extractApiError(err)}`,
        type: 'error',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------
  const getInitials = (u: AdminUser) => {
    const f = u.first_name?.[0] ?? '';
    const l = u.last_name?.[0] ?? '';
    return (f + l).toUpperCase() || u.username.slice(0, 2).toUpperCase();
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin mb-3" />
        <div className="text-navy-500">Loading users...</div>
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
            <div className="font-semibold mb-1">Couldn't load users</div>
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
  // Main
  // ------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage student, lecturer, and administrator accounts."
        breadcrumbs={[{ label: 'Users' }]}
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
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {(['students', 'lecturers', 'administrators'] as const).map((t) => (
            <div
              key={t}
              className={`rounded-xl border p-4 cursor-pointer transition ${
                tab === t
                  ? 'bg-navy-800 border-navy-800 text-white'
                  : 'bg-white border-navy-100 hover:border-navy-300'
              }`}
              onClick={() => setTab(t)}
            >
              <div
                className={`text-2xl font-bold ${
                  tab === t ? 'text-white' : 'text-navy-900'
                }`}
              >
                {tabCounts[t]}
              </div>
              <div
                className={`text-xs font-medium mt-0.5 capitalize ${
                  tab === t ? 'text-white/70' : 'text-navy-500'
                }`}
              >
                {t}
              </div>
            </div>
          ))}
        </div>

        {/* Search + tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border-b border-navy-200">
            {(['students', 'lecturers', 'administrators'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition capitalize ${
                  tab === t
                    ? 'border-navy-800 text-navy-800'
                    : 'border-transparent text-navy-400 hover:text-navy-700'
                }`}
              >
                {t}{' '}
                <span className="ml-1 text-xs bg-navy-100 text-navy-500 px-1.5 py-0.5 rounded-full">
                  {tabCounts[t]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="pl-8 pr-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 bg-white transition w-52"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:table-cell">
                  Programme / Faculty
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">
                  Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden lg:table-cell">
                  Date Joined
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-navy-400">
                    No users found
                  </td>
                </tr>
              ) : (
                paginated.map((u) => {
                  const fullName =
                    `${u.first_name} ${u.last_name}`.trim() || u.username;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-navy-50 hover:bg-navy-50 transition last:border-none"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {getInitials(u)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-navy-800 text-sm truncate">
                              {fullName}
                            </div>
                            <div className="text-[11px] text-navy-400 truncate">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <div className="text-sm text-navy-600 truncate max-w-[220px]">
                          {u.programme || u.faculty || '—'}
                        </div>
                        <div className="text-[11px] text-navy-400 truncate max-w-[220px]">
                          {u.faculty || ''}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide capitalize ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700'
                              : u.role === 'lecturer'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-navy-50 text-navy-600'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="text-xs text-navy-500">
                          {formatDate(u.date_joined)}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            title="View profile"
                            onClick={() =>
                              showToast({
                                message: `Viewing ${fullName}'s profile — coming soon`,
                                type: 'info',
                              })
                            }
                            className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"
                          >
                            <Eye size={13} />
                          </button>

                          {u.is_active ? (
                            <button
                              title="Deactivate"
                              disabled={actionLoading}
                              onClick={() => handleToggle(u.id, true)}
                              className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                            >
                              <UserX size={13} />
                            </button>
                          ) : (
                            <button
                              title="Activate"
                              disabled={actionLoading}
                              onClick={() => handleToggle(u.id, false)}
                              className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                            >
                              <UserCheck size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-navy-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${
                    p === page
                      ? 'bg-navy-800 text-white'
                      : 'border border-navy-200 text-navy-600 hover:bg-navy-50'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}