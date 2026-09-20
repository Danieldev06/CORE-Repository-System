import { useState } from 'react';
import { Search, Filter, Eye, Edit2, CheckCircle, XCircle, Archive, Trash2, ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { useApp } from '../context';
import { MOCK_RESOURCES, RESOURCE_TYPE_LABELS, SCHOOLS } from '../data';
import { PageHeader, StatusBadge, ResourceTypeBadge } from '../components/Layout';

export default function AdminResources() {
  const { navigate, showToast } = useApp();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const filtered = MOCK_RESOURCES.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !search || r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q);
    const matchType = !selectedType || r.type === selectedType;
    const matchStatus = !selectedStatus || r.status === selectedStatus;
    const matchSchool = !selectedSchool || r.school === selectedSchool;
    return matchSearch && matchType && matchStatus && matchSchool;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSelect = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  };
  const toggleAll = () => {
    setSelected(s => s.length === paginated.length ? [] : paginated.map(r => r.id));
  };

  const handleBulkAction = (action: string) => {
    showToast({ message: `${action} applied to ${selected.length} resource(s)`, type: 'success' });
    setSelected([]);
  };

  return (
    <div>
      <PageHeader
        title="Resource Management"
        subtitle="Manage all academic resources in the repository."
        breadcrumbs={[{ label: 'Resources' }]}
        actions={
          <button onClick={() => navigate('upload-resource')} className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition">
            <Plus size={15} /> Upload Resource
          </button>
        }
      />
      <div className="p-6 max-w-7xl mx-auto space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search resources..."
              className="w-full pl-8 pr-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 bg-white transition" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"><X size={13} /></button>}
          </div>
          <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setPage(1); }}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition">
            <option value="">All Types</option>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition">
            <option value="">All Statuses</option>
            {['draft', 'submitted', 'under-review', 'approved', 'rejected', 'published', 'archived'].map(s => (
              <option key={s} value={s}>{s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
          <select value={selectedSchool} onChange={e => { setSelectedSchool(e.target.value); setPage(1); }}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition">
            <option value="">All Schools</option>
            {SCHOOLS.map(s => <option key={s} value={s}>{s.replace('School of ', '')}</option>)}
          </select>
          <div className="ml-auto text-xs text-navy-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</div>
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-navy-50 border border-navy-200 rounded-xl text-sm">
            <span className="font-semibold text-navy-800">{selected.length} selected</span>
            <button onClick={() => handleBulkAction('Approved')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition">
              <CheckCircle size={12} /> Approve
            </button>
            <button onClick={() => handleBulkAction('Archived')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-xs font-semibold transition">
              <Archive size={12} /> Archive
            </button>
            <button onClick={() => handleBulkAction('Deleted')} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition">
              <Trash2 size={12} /> Delete
            </button>
            <button onClick={() => setSelected([])} className="ml-auto text-navy-400 hover:text-navy-600"><X size={15} /></button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-navy-50 border-b border-navy-100">
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.length === paginated.length && paginated.length > 0} onChange={toggleAll}
                    className="w-4 h-4 rounded border-navy-300 accent-navy-700" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Resource</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden lg:table-cell">Author</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden xl:table-cell">School</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-navy-400">No resources found</td></tr>
              ) : paginated.map((r, i) => (
                <tr key={r.id} className={`hover:bg-navy-50 transition ${i < paginated.length - 1 ? 'border-b border-navy-50' : ''} ${selected.includes(r.id) ? 'bg-navy-50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)}
                      className="w-4 h-4 rounded border-navy-300 accent-navy-700" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy-800 text-sm max-w-[200px] truncate">{r.title}</div>
                    <div className="text-[11px] text-navy-400 mt-0.5">{r.courseCode ?? ''} · {r.academicYear}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="text-sm text-navy-600">{r.author}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <ResourceTypeBadge type={r.type} />
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="text-xs text-navy-500 max-w-[140px] truncate">{r.school.replace('School of ', '')}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="text-xs text-navy-500">{r.dateUploaded}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate('resource-detail', { id: r.id })}
                        title="View" className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition">
                        <Eye size={13} />
                      </button>
                      <button title="Edit" onClick={() => showToast({ message: 'Edit resource — coming soon', type: 'info' })}
                        className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition">
                        <Edit2 size={13} />
                      </button>
                      <button title="Approve" onClick={() => showToast({ message: 'Resource approved', type: 'success' })}
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition">
                        <CheckCircle size={13} />
                      </button>
                      <button title="Archive" onClick={() => showToast({ message: 'Resource archived', type: 'info' })}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
                        <Archive size={13} />
                      </button>
                      <button title="Delete" onClick={() => showToast({ message: 'Delete — requires confirmation', type: 'error' })}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
