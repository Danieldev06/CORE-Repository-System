import { Plus, Download, Eye, Edit2, Trash2, TrendingUp } from 'lucide-react';
import { useApp } from '../context';
import { MOCK_RESOURCES } from '../data';
import { PageHeader, ResourceTypeBadge, StatusBadge } from '../components/Layout';

export default function LecturerResources() {
  const { user, navigate, showToast } = useApp();
  const myResources = MOCK_RESOURCES.filter(r => r.authorId === user?.id);

  return (
    <div>
      <PageHeader
        title="My Resources"
        subtitle={`${myResources.length} resource${myResources.length !== 1 ? 's' : ''} uploaded`}
        breadcrumbs={[{ label: 'My Resources' }]}
        actions={
          <button onClick={() => navigate('upload-resource')} className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition">
            <Plus size={15} /> Upload Resource
          </button>
        }
      />
      <div className="p-6 max-w-5xl mx-auto">
        {myResources.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <div className="text-navy-600 font-semibold">No resources uploaded yet</div>
            <button onClick={() => navigate('upload-resource')} className="mt-4 px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-semibold hover:bg-navy-700 transition">Upload First Resource</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50 border-b border-navy-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Resource</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden lg:table-cell">Downloads</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-navy-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myResources.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-navy-50 transition ${i < myResources.length - 1 ? 'border-b border-navy-50' : ''}`}>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-navy-800 text-sm leading-snug max-w-[220px]">{r.title}</div>
                      <div className="text-[11px] text-navy-400 mt-0.5">{r.courseCode ?? ''} · {r.academicYear} · {r.fileType} {r.fileSize}</div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell"><ResourceTypeBadge type={r.type} /></td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-xs text-navy-500">
                        <Download size={11} /> {r.downloads}
                        <TrendingUp size={11} className="ml-2" /> {r.views} views
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate('resource-detail', { id: r.id })} className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"><Eye size={13} /></button>
                        <button onClick={() => showToast({ message: 'Edit resource — coming soon', type: 'info' })} className="p-1.5 text-navy-400 hover:text-navy-700 hover:bg-navy-100 rounded-lg transition"><Edit2 size={13} /></button>
                        <button onClick={() => showToast({ message: 'Delete requires confirmation', type: 'error' })} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
