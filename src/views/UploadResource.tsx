import { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context';
import { SCHOOLS, PROGRAMMES, RESOURCE_TYPE_LABELS } from '../data';
import { PageHeader } from '../components/Layout';

const LECTURER_TYPES = ['lecture-notes', 'past-paper', 'course-material', 'academic-guide', 'other'];
const ADMIN_TYPES = Object.keys(RESOURCE_TYPE_LABELS);
const ACADEMIC_YEARS = ['2025/2026', '2024/2025', '2023/2024'];

export default function UploadResource() {
  const { user, navigate, showToast } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({
    title: '', type: '', school: user?.school ?? '', programme: '',
    course: '', courseCode: '', academicYear: '', description: '', keywords: '',
  });

  const allowedTypes = user?.role === 'admin' ? ADMIN_TYPES : LECTURER_TYPES;
  const programmes = form.school ? (PROGRAMMES[form.school] ?? []) : [];
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.title && form.type && form.school && form.programme && form.academicYear && form.description && file;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      setSubmitted(true);
      showToast({ message: 'Resource uploaded successfully!', type: 'success' });
    }, 1500);
  };

  if (submitted) {
    return (
      <div>
        <PageHeader title="Upload Resource" breadcrumbs={[{ label: 'Upload Resource' }]} />
        <div className="p-6 max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-navy-100 p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-navy-900 mb-2">Resource Uploaded</h2>
            <p className="text-navy-500 text-sm mb-6">Your resource has been uploaded and {user?.role === 'admin' ? 'published to' : 'submitted to'} the repository.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate(user?.role === 'lecturer' ? 'lecturer-resources' : 'admin-resources')}
                className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition">View Resources</button>
              <button onClick={() => { setSubmitted(false); setFile(null); setForm({ title: '', type: '', school: user?.school ?? '', programme: '', course: '', courseCode: '', academicYear: '', description: '', keywords: '' }); }}
                className="px-5 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">Upload Another</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Upload Resource" subtitle="Upload academic resources to the repository." breadcrumbs={[{ label: 'Upload Resource' }]} />
      <div className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50">Resource Details</h3>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => update('title', e.target.value)} placeholder="Full title of the resource"
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Resource Type <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={e => update('type', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition">
                  <option value="">Select type...</option>
                  {allowedTypes.map(t => <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t as keyof typeof RESOURCE_TYPE_LABELS]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Academic Year <span className="text-red-500">*</span></label>
                <select value={form.academicYear} onChange={e => update('academicYear', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition">
                  <option value="">Select year...</option>
                  {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">School <span className="text-red-500">*</span></label>
                <select value={form.school} onChange={e => { update('school', e.target.value); update('programme', ''); }}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition">
                  <option value="">Select school...</option>
                  {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Programme <span className="text-red-500">*</span></label>
                <select value={form.programme} onChange={e => update('programme', e.target.value)} disabled={!form.school}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition disabled:opacity-50">
                  <option value="">Select programme...</option>
                  {programmes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Course Code</label>
                <input type="text" value={form.courseCode} onChange={e => update('courseCode', e.target.value)} placeholder="e.g. COM322"
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Course / Module Name</label>
                <input type="text" value={form.course} onChange={e => update('course', e.target.value)} placeholder="e.g. Web Design and Development"
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50">Description & Keywords</h3>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Description <span className="text-red-500">*</span></label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} placeholder="Describe the content, scope, and relevance of this resource..."
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Keywords</label>
              <input type="text" value={form.keywords} onChange={e => update('keywords', e.target.value)} placeholder="Separate with commas: database, SQL, normalization..."
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50 mb-4">Upload File <span className="text-red-500">*</span></h3>
            {file ? (
              <div className="flex items-center gap-3 p-4 bg-navy-50 border border-navy-200 rounded-xl">
                <FileText size={20} className="text-navy-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy-800 truncate">{file.name}</div>
                  <div className="text-xs text-navy-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button type="button" onClick={() => setFile(null)} className="text-navy-400 hover:text-red-500 transition"><X size={16} /></button>
              </div>
            ) : (
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragOver ? 'border-navy-400 bg-navy-50' : 'border-navy-200 hover:border-navy-300'}`}>
                <Upload size={28} className="text-navy-300 mx-auto mb-3" />
                <div className="text-sm font-semibold text-navy-700 mb-1">Drag and drop your file here</div>
                <div className="text-xs text-navy-400 mb-3">PDF, DOCX, DOC, PPTX — Max 100 MB</div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition">
                  <Upload size={14} /> Choose File
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.pptx" onChange={e => e.target.files?.[0] && setFile(e.target.files[0])} />
                </label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate(user?.role === 'lecturer' ? 'lecturer-dashboard' : 'admin-dashboard')}
              className="px-5 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">Cancel</button>
            <button type="submit" disabled={!canSubmit || uploading}
              className="px-6 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center gap-2">
              {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Uploading...</> : <><Upload size={15} /> Upload Resource</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
