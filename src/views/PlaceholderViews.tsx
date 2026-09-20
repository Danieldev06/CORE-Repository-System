import { Building2, Tag, Clock, Upload, CheckCircle, Users, Archive, AlertCircle, Database, Filter } from 'lucide-react';
import { PageHeader, StatusBadge } from '../components/Layout';
import { SCHOOLS, PROGRAMMES } from '../data';

const ACTIVITY_LOG = [
  { id: 1, time: '2026-08-10 09:14', user: 'Dr. Chanda Musonda', role: 'Lecturer', action: 'Uploaded resource', detail: 'COM322 Web Design and Development — Lecture Notes (Unit 7)', type: 'upload', icon: <Upload size={13} /> },
  { id: 2, time: '2026-08-10 08:47', user: 'Namwaka Chisanga', role: 'Student', action: 'Submitted work', detail: 'Mobile Banking Security Vulnerabilities in Zambia (Research Proposal)', type: 'submission', icon: <Upload size={13} /> },
  { id: 3, time: '2026-08-09 16:33', user: 'Ms. Thandiwe Mwape', role: 'Admin', action: 'Approved resource', detail: 'Machine Learning-Based System for Predicting Retail Product Prices', type: 'approve', icon: <CheckCircle size={13} /> },
  { id: 4, time: '2026-08-09 15:20', user: 'Mwansa Kapemba', role: 'Student', action: 'Downloaded resource', detail: 'COM201 Data Structures and Algorithms — Past Paper 2024', type: 'download', icon: <Archive size={13} /> },
  { id: 5, time: '2026-08-09 14:05', user: 'Ms. Thandiwe Mwape', role: 'Admin', action: 'Added user account', detail: 'New student registered: Musonda Zulu (BSc Business Administration, Year 3)', type: 'user', icon: <Users size={13} /> },
  { id: 6, time: '2026-08-09 11:42', user: 'Dr. Mulenga Kalinda', role: 'Lecturer', action: 'Rejected submission', detail: 'Research Methods Literature Review — Mwansa Kapemba (requires revision)', type: 'reject', icon: <AlertCircle size={13} /> },
  { id: 7, time: '2026-08-08 16:18', user: 'Ms. Thandiwe Mwape', role: 'Admin', action: 'Uploaded resource', detail: 'Research Methodology for Computing Students — Academic Guide 2026', type: 'upload', icon: <Upload size={13} /> },
  { id: 8, time: '2026-08-08 14:55', user: 'Dr. Chanda Musonda', role: 'Lecturer', action: 'Uploaded resource', detail: 'IT211 Database Management Systems — Lecture Notes', type: 'upload', icon: <Upload size={13} /> },
  { id: 9, time: '2026-08-08 10:30', user: 'Chilufya Mutale', role: 'Student', action: 'Downloaded resource', detail: 'COM322 Web Design and Development Lecture Notes (Units 1–6)', type: 'download', icon: <Archive size={13} /> },
  { id: 10, time: '2026-08-07 15:10', user: 'Ms. Thandiwe Mwape', role: 'Admin', action: 'Archived resource', detail: 'IT101 Introduction to Computing — Lecture Notes (2019 Edition)', type: 'archive', icon: <Archive size={13} /> },
  { id: 11, time: '2026-08-07 11:25', user: 'Bupe Nkonde', role: 'Student', action: 'Submitted work', detail: 'Blockchain Technology for Land Title Registration in Zambia (Dissertation)', type: 'submission', icon: <Upload size={13} /> },
  { id: 12, time: '2026-08-07 09:48', user: 'Dr. Chanda Musonda', role: 'Lecturer', action: 'Approved submission', detail: 'Student Academic Performance Prediction Research Proposal — Mwansa Kapemba', type: 'approve', icon: <CheckCircle size={13} /> },
];

const TYPE_STYLES: Record<string, string> = {
  upload: 'bg-navy-100 text-navy-600',
  submission: 'bg-amber-100 text-amber-700',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-red-100 text-red-600',
  download: 'bg-blue-100 text-blue-600',
  user: 'bg-purple-100 text-purple-700',
  archive: 'bg-gray-100 text-gray-500',
};

export function AdminActivity() {
  return (
    <div>
      <PageHeader
        title="System Activity"
        subtitle="Complete audit log of all repository actions — uploads, approvals, downloads, and account management."
        breadcrumbs={[{ label: 'System Activity' }]}
        actions={
          <button className="flex items-center gap-2 px-3 py-2 border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">
            <Filter size={14} /> Filter
          </button>
        }
      />
      <div className="p-6 max-w-5xl mx-auto">
        {/* Summary tiles */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Uploads Today', value: 2, color: 'bg-navy-50 text-navy-800' },
            { label: 'Approvals Today', value: 1, color: 'bg-emerald-50 text-emerald-800' },
            { label: 'Downloads Today', value: 14, color: 'bg-blue-50 text-blue-800' },
            { label: 'Events This Week', value: ACTIVITY_LOG.length, color: 'bg-purple-50 text-purple-800' },
          ].map(t => (
            <div key={t.label} className={`rounded-xl border border-navy-100 p-4 ${t.color}`}>
              <div className="text-2xl font-bold">{t.value}</div>
              <div className="text-xs font-medium mt-0.5 opacity-70">{t.label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <div className="bg-navy-50 border-b border-navy-100 px-4 py-3 grid grid-cols-12 gap-4">
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide flex items-center gap-1"><Clock size={11} />Timestamp</div>
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide">User</div>
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden md:block">Action</div>
            <div className="col-span-6 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:block">Detail</div>
          </div>
          {ACTIVITY_LOG.map((entry, i) => (
            <div key={entry.id} className={`grid grid-cols-12 gap-4 px-4 py-3.5 items-start ${i < ACTIVITY_LOG.length - 1 ? 'border-b border-navy-50' : ''} hover:bg-navy-50 transition`}>
              <div className="col-span-2">
                <div className="text-[11px] font-medium text-navy-600">{entry.time.split(' ')[0]}</div>
                <div className="text-[10px] text-navy-400">{entry.time.split(' ')[1]}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-semibold text-navy-800 truncate">{entry.user}</div>
                <div className={`text-[10px] font-medium mt-0.5 px-1.5 py-0.5 rounded inline-block ${
                  entry.role === 'Admin' ? 'bg-purple-50 text-purple-600' :
                  entry.role === 'Lecturer' ? 'bg-blue-50 text-blue-600' :
                  'bg-navy-50 text-navy-500'
                }`}>{entry.role}</div>
              </div>
              <div className="col-span-2 hidden md:block">
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold ${TYPE_STYLES[entry.type] ?? 'bg-gray-100 text-gray-500'}`}>
                  {entry.icon}{entry.action}
                </div>
              </div>
              <div className="col-span-6 hidden sm:block">
                <div className="text-xs text-navy-600 leading-snug">{entry.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-4">
          <button className="text-sm text-navy-600 hover:text-navy-800 font-medium">Load more activity →</button>
        </div>
      </div>
    </div>
  );
}

export function AdminCollections() {
  return (
    <div>
      <PageHeader
        title="Schools & Programmes"
        subtitle="Manage academic schools, faculties, and programme listings across Cavendish University Zambia."
        breadcrumbs={[{ label: 'Schools & Programmes' }]}
      />
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {SCHOOLS.map(school => {
          const progs = PROGRAMMES[school] ?? [];
          const schoolColors: Record<string, string> = {
            'School of Computing and Information Technology': 'bg-navy-800',
            'School of Business': 'bg-blue-700',
            'School of Law': 'bg-indigo-700',
            'School of Social Sciences': 'bg-slate-700',
          };
          return (
            <div key={school} className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
              <div className={`px-5 py-4 ${schoolColors[school] ?? 'bg-navy-700'} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                    <Building2 size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{school}</div>
                    <div className="text-white/50 text-[11px]">{progs.length} programme{progs.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <button className="text-xs font-semibold text-white/70 hover:text-white border border-white/20 px-3 py-1.5 rounded-lg transition hover:bg-white/10">
                  Manage
                </button>
              </div>
              <div className="divide-y divide-navy-50">
                {progs.map(p => (
                  <div key={p} className="flex items-center justify-between px-5 py-3 hover:bg-navy-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-navy-300" />
                      <span className="text-sm font-medium text-navy-700">{p}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status="active" />
                      <button className="text-xs text-navy-400 hover:text-navy-700 font-medium transition">Edit</button>
                    </div>
                  </div>
                ))}
                <div className="px-5 py-3">
                  <button className="text-xs text-navy-600 hover:text-navy-800 font-semibold flex items-center gap-1.5 transition">
                    <span className="text-lg leading-none">+</span> Add Programme
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AdminCategories() {
  const categories = [
    { name: 'Lecture Notes', slug: 'lecture-notes', count: 48, description: 'Course lecture materials uploaded by lecturers', color: 'bg-navy-50 border-navy-200' },
    { name: 'Past Examination Papers', slug: 'past-paper', count: 62, description: 'Historical examination papers by course and year', color: 'bg-purple-50 border-purple-200' },
    { name: 'Dissertations', slug: 'dissertation', count: 37, description: 'Final-year undergraduate dissertations', color: 'bg-blue-50 border-blue-200' },
    { name: 'Theses', slug: 'thesis', count: 19, description: 'Postgraduate research theses', color: 'bg-indigo-50 border-indigo-200' },
    { name: 'Research Proposals', slug: 'research-proposal', count: 24, description: 'Student and faculty research proposals', color: 'bg-teal-50 border-teal-200' },
    { name: 'Journal Articles', slug: 'journal-article', count: 11, description: 'Peer-reviewed journal articles and publications', color: 'bg-cyan-50 border-cyan-200' },
    { name: 'Research Papers', slug: 'research-paper', count: 18, description: 'Academic research papers and reports', color: 'bg-sky-50 border-sky-200' },
    { name: 'Course Materials', slug: 'course-material', count: 31, description: 'Supplementary course resources and handouts', color: 'bg-slate-50 border-slate-200' },
    { name: 'Academic Guides', slug: 'academic-guide', count: 9, description: 'Research methodology, writing guides, and templates', color: 'bg-stone-50 border-stone-200' },
    { name: 'Other Resources', slug: 'other', count: 6, description: 'Miscellaneous approved academic resources', color: 'bg-gray-50 border-gray-200' },
  ];

  return (
    <div>
      <PageHeader
        title="Resource Categories"
        subtitle="Manage and configure resource types and classification metadata used across the CORE repository."
        breadcrumbs={[{ label: 'Categories' }]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition">
            <Tag size={14} /> Add Category
          </button>
        }
      />
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
          <div className="bg-navy-50 border-b border-navy-100 px-4 py-3 grid grid-cols-12 gap-4">
            <div className="col-span-4 text-xs font-semibold text-navy-600 uppercase tracking-wide">Category</div>
            <div className="col-span-5 text-xs font-semibold text-navy-600 uppercase tracking-wide hidden sm:block">Description</div>
            <div className="col-span-2 text-xs font-semibold text-navy-600 uppercase tracking-wide text-right">Resources</div>
            <div className="col-span-1 text-xs font-semibold text-navy-600 uppercase tracking-wide text-right">Actions</div>
          </div>
          {categories.map((c, i) => (
            <div key={c.slug} className={`grid grid-cols-12 gap-4 px-4 py-3.5 items-center hover:bg-navy-50 transition ${i < categories.length - 1 ? 'border-b border-navy-50' : ''}`}>
              <div className="col-span-4 flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${c.color}`}>
                  <Tag size={12} className="text-navy-500" />
                </div>
                <span className="font-semibold text-navy-800 text-sm">{c.name}</span>
              </div>
              <div className="col-span-5 hidden sm:block">
                <span className="text-xs text-navy-500">{c.description}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm font-bold text-navy-800">{c.count}</span>
              </div>
              <div className="col-span-1 flex justify-end">
                <button className="text-xs text-navy-400 hover:text-navy-700 font-medium transition">Edit</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminSettings() {
  return (
    <div>
      <PageHeader title="System Settings" breadcrumbs={[{ label: 'Settings' }]} />
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        {[
          {
            title: 'Repository Settings',
            fields: [
              { label: 'Repository Name', value: 'Cavendish Online Resource Exchange (CORE)' },
              { label: 'Institution Name', value: 'Cavendish University Zambia' },
              { label: 'Repository URL', value: 'https://core.cavendish.ac.zm' },
              { label: 'Support Email', value: 'library@cavendish.ac.zm' },
            ],
          },
          {
            title: 'Upload & File Settings',
            fields: [
              { label: 'Maximum File Size', value: '100 MB' },
              { label: 'Allowed File Types', value: 'PDF, DOCX, DOC, PPTX, XLSX' },
              { label: 'Auto-archive After (months)', value: '36' },
            ],
          },
          {
            title: 'Access Control',
            fields: [
              { label: 'Student Registration', value: 'Restricted to @students.cavendish.ac.zm' },
              { label: 'Lecturer Registration', value: 'Restricted to @cavendish.ac.zm' },
              { label: 'Guest Access', value: 'Disabled' },
            ],
          },
        ].map(section => (
          <div key={section.title} className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-bold text-navy-800 text-sm uppercase tracking-wide mb-4 pb-2 border-b border-navy-50">{section.title}</h3>
            <div className="space-y-3">
              {section.fields.map(f => (
                <div key={f.label} className="flex items-center justify-between gap-4">
                  <label className="text-xs font-semibold text-navy-600 shrink-0">{f.label}</label>
                  <input type="text" defaultValue={f.value}
                    className="flex-1 max-w-xs px-3 py-1.5 border border-navy-200 rounded-lg text-sm text-navy-800 text-right focus:ring-2 focus:ring-navy-200 focus:border-navy-300 transition" />
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          <button className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition">Save Settings</button>
        </div>
      </div>
    </div>
  );
}
