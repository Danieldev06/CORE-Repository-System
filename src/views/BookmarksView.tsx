import { Bookmark, BookmarkCheck, Download } from 'lucide-react';
import { useApp } from '../context';
import { MOCK_RESOURCES } from '../data';
import { PageHeader, ResourceTypeBadge } from '../components/Layout';

export default function BookmarksView() {
  const { navigate, bookmarkedIds, toggleBookmark, addDownload } = useApp();
  const bookmarked = MOCK_RESOURCES.filter(r => bookmarkedIds.includes(r.id));

  return (
    <div>
      <PageHeader title="Bookmarks" subtitle={`${bookmarked.length} saved resource${bookmarked.length !== 1 ? 's' : ''}`} breadcrumbs={[{ label: 'Bookmarks' }]} />
      <div className="p-6 max-w-4xl mx-auto">
        {bookmarked.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <Bookmark size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">No bookmarks yet</div>
            <div className="text-navy-400 text-sm mt-1 mb-4">Save resources to access them quickly</div>
            <button onClick={() => navigate('repository')} className="px-4 py-2 bg-navy-800 text-white rounded-xl text-sm font-semibold hover:bg-navy-700 transition">Browse Repository</button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarked.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-navy-100 p-4 flex items-center gap-4 hover:border-navy-300 hover:shadow-sm transition group">
                <div className="flex-1 min-w-0">
                  <button onClick={() => navigate('resource-detail', { id: r.id })} className="text-left">
                    <div className="font-semibold text-navy-800 text-sm group-hover:text-navy-600 transition leading-snug">{r.title}</div>
                    <div className="text-[11px] text-navy-400 mt-0.5">{r.author} · {r.courseCode ?? r.school.replace('School of ', '')} · {r.academicYear}</div>
                  </button>
                </div>
                <ResourceTypeBadge type={r.type} />
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleBookmark(r.id)} className="p-1.5 text-navy-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition" title="Remove bookmark">
                    <BookmarkCheck size={15} />
                  </button>
                  <button onClick={() => addDownload(r.id)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition">
                    <Download size={11} /> Download
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
