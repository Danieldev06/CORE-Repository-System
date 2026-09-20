import { useState, useMemo } from 'react';
import { Search, Download, Eye, BookOpen, X } from 'lucide-react';
import { useApp } from '../context';
import { MOCK_RESOURCES, SCHOOLS } from '../data';
import { PageHeader, ResourceTypeBadge } from '../components/Layout';

const RESEARCH_TYPES = ['dissertation', 'thesis', 'research-proposal', 'journal-article', 'research-paper'];
const ACADEMIC_YEARS = ['2025/2026', '2024/2025', '2023/2024', '2022/2023'];

const CATEGORY_LABELS: Record<string, string> = {
  'dissertation': 'Dissertations',
  'thesis': 'Theses',
  'research-proposal': 'Research Proposals',
  'journal-article': 'Journal Articles',
  'research-paper': 'Research Papers',
};

export default function ResearchRepository() {
  const { navigate, addDownload } = useApp();
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const researchResources = useMemo(() => {
    let res = MOCK_RESOURCES.filter(r => RESEARCH_TYPES.includes(r.type) && (r.status === 'published' || r.status === 'approved'));
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(r => r.title.toLowerCase().includes(q) || r.author.toLowerCase().includes(q) || r.keywords.some(k => k.toLowerCase().includes(q)));
    }
    if (selectedType) res = res.filter(r => r.type === selectedType);
    if (selectedSchool) res = res.filter(r => r.school === selectedSchool);
    if (selectedYear) res = res.filter(r => r.academicYear === selectedYear);
    return res;
  }, [search, selectedType, selectedSchool, selectedYear]);

  const hasFilters = search || selectedType || selectedSchool || selectedYear;

  return (
    <div>
      <PageHeader
        title="Research Repository"
        subtitle="Browse dissertations, theses, research proposals, and academic publications from Cavendish University Zambia."
        breadcrumbs={[{ label: 'Research Repository' }]}
      />
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Category cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {RESEARCH_TYPES.map(t => {
            const count = MOCK_RESOURCES.filter(r => r.type === t && (r.status === 'published' || r.status === 'approved')).length;
            return (
              <button key={t} onClick={() => setSelectedType(selectedType === t ? '' : t)}
                className={`rounded-xl border p-4 text-center transition ${selectedType === t ? 'bg-navy-800 border-navy-800 text-white' : 'bg-white border-navy-100 hover:border-navy-300'}`}>
                <div className={`text-2xl font-bold ${selectedType === t ? 'text-white' : 'text-navy-900'}`}>{count}</div>
                <div className={`text-xs font-medium mt-0.5 ${selectedType === t ? 'text-white/70' : 'text-navy-500'}`}>{CATEGORY_LABELS[t]}</div>
              </button>
            );
          })}
        </div>

        {/* Search + filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search research, authors, topics..."
              className="w-full pl-9 pr-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 bg-white transition" />
          </div>
          <select value={selectedSchool} onChange={e => setSelectedSchool(e.target.value)}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition">
            <option value="">All Schools</option>
            {SCHOOLS.map(s => <option key={s} value={s}>{s.replace('School of ', '')}</option>)}
          </select>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
            className="text-xs border border-navy-200 rounded-lg px-2.5 py-2 text-navy-700 bg-white focus:ring-2 focus:ring-navy-200 transition">
            <option value="">All Years</option>
            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setSelectedType(''); setSelectedSchool(''); setSelectedYear(''); }}
              className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1">
              <X size={12} /> Clear
            </button>
          )}
          <span className="ml-auto text-xs text-navy-500">{researchResources.length} result{researchResources.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Results */}
        {researchResources.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <BookOpen size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">No research found</div>
            <div className="text-navy-400 text-sm mt-1">Try adjusting your search or filters</div>
          </div>
        ) : (
          <div className="space-y-4">
            {researchResources.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-navy-100 p-5 hover:border-navy-300 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <ResourceTypeBadge type={r.type} />
                      <span className="text-[11px] text-navy-400">{r.academicYear} · {r.fileType} · {r.fileSize}</span>
                    </div>
                    <button onClick={() => navigate('resource-detail', { id: r.id })} className="text-left">
                      <h3 className="font-bold text-navy-800 text-base leading-snug mb-2 group-hover:text-navy-600 transition">{r.title}</h3>
                    </button>
                    {r.abstract && <p className="text-sm text-navy-500 leading-relaxed line-clamp-2 mb-3">{r.abstract}</p>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-400">
                      <span className="font-medium text-navy-600">{r.author}</span>
                      <span>{r.programme}</span>
                      <span>{r.school.replace('School of ', 'School of ')}</span>
                    </div>
                    {r.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {r.keywords.map(k => (
                          <span key={k} className="px-2 py-0.5 text-[10px] bg-navy-50 border border-navy-100 text-navy-500 rounded">{k}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="text-xs text-navy-400 flex items-center gap-1 justify-end"><Download size={10} />{r.downloads} downloads</div>
                      <div className="text-xs text-navy-400 flex items-center gap-1 justify-end"><Eye size={10} />{r.views} views</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate('resource-detail', { id: r.id })}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-navy-200 hover:bg-navy-50 text-navy-700 text-xs font-semibold rounded-lg transition">
                        <Eye size={12} /> View
                      </button>
                      <button onClick={() => addDownload(r.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold rounded-lg transition">
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
