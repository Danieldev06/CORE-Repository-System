import { Download, FileText } from 'lucide-react';
import { useApp } from '../context';
import { MOCK_RESOURCES } from '../data';
import { PageHeader, ResourceTypeBadge } from '../components/Layout';

export default function DownloadHistory() {
  const { navigate, downloadedIds, addDownload } = useApp();
  const downloaded = MOCK_RESOURCES.filter(r => downloadedIds.includes(r.id));

  return (
    <div>
      <PageHeader title="Download History" subtitle={`${downloaded.length} resource${downloaded.length !== 1 ? 's' : ''} downloaded`} breadcrumbs={[{ label: 'Download History' }]} />
      <div className="p-6 max-w-4xl mx-auto">
        {downloaded.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <Download size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">No downloads yet</div>
            <div className="text-navy-400 text-sm mt-1 mb-4">Resources you download will appear here</div>
            <button onClick={() => navigate('repository')} className="px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-semibold hover:bg-navy-700 transition">Browse Repository</button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
            <div className="bg-navy-50 border-b border-navy-100 px-4 py-3 grid grid-cols-12 gap-4">
              <div className="col-span-7 text-xs font-semibold text-navy-600 uppercase tracking-wide">Resource</div>
              <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:block">Type</div>
              <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:block">Size</div>
              <div className="col-span-1 text-xs font-semibold text-navy-600 uppercase tracking-wide">Action</div>
            </div>
            {downloaded.map((r, i) => (
              <div key={r.id} className={`grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-navy-50 transition ${i < downloaded.length - 1 ? 'border-b border-navy-50' : ''}`}>
                <div className="col-span-7 min-w-0 flex items-center gap-3">
                  <div className="w-8 h-10 bg-navy-50 border border-navy-100 rounded flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-navy-400" />
                  </div>
                  <div className="min-w-0">
                    <button onClick={() => navigate('resource-detail', { id: r.id })}
                      className="font-semibold text-navy-800 text-sm hover:text-navy-600 transition truncate block text-left">{r.title}</button>
                    <div className="text-[11px] text-navy-400 mt-0.5">{r.author} · {r.academicYear}</div>
                  </div>
                </div>
                <div className="col-span-2 hidden md:block"><ResourceTypeBadge type={r.type} /></div>
                <div className="col-span-2 text-xs text-navy-500 hidden sm:block">{r.fileType} · {r.fileSize}</div>
                <div className="col-span-1">
                  <button onClick={() => addDownload(r.id)} className="p-2 text-navy-600 hover:text-navy-800 hover:bg-navy-100 rounded-lg transition" title="Re-download">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
