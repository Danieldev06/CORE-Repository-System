import { useState } from 'react';
import { Search, Eye, Edit2, UserCheck, UserX, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { useApp } from '../context';
import { ALL_USERS } from '../data';
import { PageHeader, StatusBadge } from '../components/Layout';
import type { User } from '../types';

function UserRow({ user, onAction }: { user: User; onAction: (msg: string) => void }) {
  return (
    <tr className="border-b border-navy-50 hover:bg-navy-50 transition">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-navy-800 text-sm">{user.name}</div>
            <div className="text-[11px] text-navy-400">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="text-sm text-navy-600">{user.programme ?? user.department ?? '—'}</div>
        <div className="text-[11px] text-navy-400">{user.school?.replace('School of ', '') ?? ''}</div>
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide capitalize ${
          user.role === 'admin' ? 'bg-purple-50 text-purple-700' :
          user.role === 'lecturer' ? 'bg-blue-50 text-blue-700' :
          'bg-navy-50 text-navy-600'
        }`}>{user.role}</span>
      </td>
      <td className="px-4 py-3.5"><StatusBadge status={user.status} /></td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <div className="text-xs text-navy-500">{user.dateJoined}</div>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button onClick={() => onAction('Viewing user profile')} title="View" className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"><Eye size={13} /></button>
          <button onClick={() => onAction('Editing user account')} title="Edit" className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"><Edit2 size={13} /></button>
          {user.status === 'active'
            ? <button onClick={() => onAction('Account deactivated')} title="Deactivate" className="p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"><UserX size={13} /></button>
            : <button onClick={() => onAction('Account activated')} title="Activate" className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"><UserCheck size={13} /></button>
          }
        </div>
      </td>
    </tr>
  );
}

export default function AdminUsers() {
  const { showToast } = useApp();
  const [tab, setTab] = useState<'students' | 'lecturers' | 'administrators'>('students');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const roleMap: Record<typeof tab, string> = {
    students: 'student',
    lecturers: 'lecturer',
    administrators: 'admin',
  };

  const filtered = ALL_USERS.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = u.role === roleMap[tab];
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabCounts = {
    students: ALL_USERS.filter(u => u.role === 'student').length,
    lecturers: ALL_USERS.filter(u => u.role === 'lecturer').length,
    administrators: ALL_USERS.filter(u => u.role === 'admin').length,
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Manage student, lecturer, and administrator accounts."
        breadcrumbs={[{ label: 'Users' }]}
        actions={
          <button onClick={() => showToast({ message: 'Create user — feature coming soon', type: 'info' })}
            className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition">
            <Plus size={15} /> Add User
          </button>
        }
      />
      <div className="p-6 max-w-6xl mx-auto space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          {(['students', 'lecturers', 'administrators'] as const).map(t => (
            <div key={t} className={`rounded-xl border p-4 cursor-pointer transition ${tab === t ? 'bg-navy-800 border-navy-800 text-white' : 'bg-white border-navy-100 hover:border-navy-300'}`}
              onClick={() => { setTab(t); setPage(1); }}>
              <div className={`text-2xl font-bold ${tab === t ? 'text-white' : 'text-navy-900'}`}>{tabCounts[t]}</div>
              <div className={`text-xs font-medium mt-0.5 capitalize ${tab === t ? 'text-white/70' : 'text-navy-500'}`}>{t}</div>
            </div>
          ))}
        </div>

        {/* Search + tabs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex border-b border-navy-200">
            {(['students', 'lecturers', 'administrators'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition capitalize ${tab === t ? 'border-navy-800 text-navy-800' : 'border-transparent text-navy-400 hover:text-navy-700'}`}>
                {t} <span className="ml-1 text-xs bg-navy-100 text-navy-500 px-1.5 py-0.5 rounded-full">{tabCounts[t]}</span>
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search users..."
              className="pl-8 pr-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 bg-white transition w-52" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"><X size={13} /></button>}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:table-cell">Programme / Department</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden lg:table-cell">Date Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-navy-400">No users found</td></tr>
              ) : (
                paginated.map(u => (
                  <UserRow key={u.id} user={u} onAction={msg => showToast({ message: msg, type: 'info' })} />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-navy-400">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</div>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition ${p === page ? 'bg-navy-800 text-white' : 'border border-navy-200 text-navy-600 hover:bg-navy-50'}`}>
                  {p}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg border border-navy-200 text-navy-600 hover:bg-navy-50 disabled:opacity-40 transition">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
