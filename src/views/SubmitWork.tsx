import { useState, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context';
import { SCHOOLS, PROGRAMMES, RESOURCE_TYPE_LABELS } from '../data';
import { PageHeader } from '../components/Layout';
import { api, resourceApi, extractApiError, type Course } from '../services/api';

const SUBMITTABLE_TYPES = [
  'research-proposal', 'dissertation', 'thesis', 'research-paper', 'other'
] as const;

const ACADEMIC_YEARS = ['2025/2026', '2024/2025', '2023/2024'];

// Map frontend resource type → backend resource_type enum
function toBackendType(frontendType: string): string {
  switch (frontendType) {
    case 'dissertation':
    case 'thesis':
      return 'DISSERTATION';
    case 'research-paper':
    case 'research-proposal':
    case 'other':
    default:
      return 'ARTICLE';
  }
}

export default function SubmitWork() {
  const { navigate, showToast } = useApp();
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  // Course dropdown data from Django
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [form, setForm] = useState({
    title: '',
    type: '',
    school: '',
    programme: '',
    course: '',            // numeric course ID (as string)
    yearOfStudy: '',       // 1–6
    semester: '',          // 1–2
    academicYear: '',
    abstract: '',
    keywords: '',
    declaration: false,
  });

  const programmes = form.school ? (PROGRAMMES[form.school] ?? []) : [];

  const update = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  // Load courses from Django on mount
  useEffect(() => {
    api.getCourses()
      .then(setCourses)
      .catch(err => console.error('Failed to load courses:', err))
      .finally(() => setLoadingCourses(false));
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const canSubmit =
    form.title &&
    form.type &&
    form.course &&
    form.yearOfStudy &&
    form.semester &&
    form.abstract &&
    form.declaration &&
    file;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!canSubmit || !file) return;

    const token = localStorage.getItem('core_token');
    if (!token) {
      setError('Your session has expired. Please log in again.');
      return;
    }

    setUploading(true);

    try {
      await resourceApi.upload(
        {
          title: form.title,
          course: Number(form.course),
          year_of_study: Number(form.yearOfStudy),
          semester: Number(form.semester),
          resource_type: toBackendType(form.type),
          is_shared: false,
          file,
        },
        token
      );

      setSubmitted(true);
      showToast({ message: 'Submission received. Your work is under review.', type: 'success' });
    } catch (err: any) {
      const msg = extractApiError(err);
      setError(msg);
      showToast({ message: `Upload failed: ${msg}`, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <PageHeader title="Submit Academic Work" breadcrumbs={[{ label: 'Submit Work' }]} />
        <div className="p-6 max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-navy-100 p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-navy-900 mb-2">Submission Received</h2>
            <p className="text-navy-500 text-sm leading-relaxed mb-1">
              Your work has been submitted for review. You will receive a notification once it has been reviewed by your lecturer or the library team.
            </p>
            <div className="mt-5 px-4 py-3.5 bg-navy-50 rounded-xl border border-navy-100 text-sm text-navy-600 text-left space-y-1.5 mb-6">
              <div><span className="font-semibold">Title:</span> {form.title}</div>
              <div><span className="font-semibold">Type:</span> {RESOURCE_TYPE_LABELS[form.type as keyof typeof RESOURCE_TYPE_LABELS]}</div>
              <div><span className="font-semibold">Status:</span> <span className="text-amber-600 font-medium">Submitted — Awaiting Review</span></div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('my-submissions')} className="px-5 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition">
                Track Submission
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    title: '', type: '', school: '', programme: '', course: '',
                    yearOfStudy: '', semester: '', academicYear: '', abstract: '',
                    keywords: '', declaration: false,
                  });
                  setFile(null);
                }}
                className="px-5 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Submit Academic Work"
        subtitle="Submit your research proposals, dissertations, theses, or other academic work for review and inclusion in the repository."
        breadcrumbs={[{ label: 'Submit Work' }]}
      />
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-navy-50 border border-navy-200 rounded-xl p-4 flex items-start gap-3 mb-6 text-sm text-navy-700">
          <Info size={16} className="text-navy-500 shrink-0 mt-0.5" />
          <div>
            Submissions are reviewed by your lecturer or the library team before being published to the repository. You will be notified of the outcome.
            All submissions must be your original work and comply with the CUZ Academic Integrity Policy.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resource details */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50">Resource Details</h3>

            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Title <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={e => update('title', e.target.value)}
                placeholder="Full title of your work"
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Resource Type <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={e => update('type', e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition">
                  <option value="">Select type...</option>
                  {SUBMITTABLE_TYPES.map(t => <option key={t} value={t}>{RESOURCE_TYPE_LABELS[t]}</option>)}
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
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">School / Faculty <span className="text-red-500">*</span></label>
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
                <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Course / Module <span className="text-red-500">*</span></label>
                <select
                  value={form.course}
                  onChange={e => update('course', e.target.value)}
                  disabled={loadingCourses}
                  className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition disabled:opacity-50">
                  <option value="">
                    {loadingCourses ? 'Loading courses...' : 'Select course...'}
                  </option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Year <span className="text-red-500">*</span></label>
                  <select value={form.yearOfStudy} onChange={e => update('yearOfStudy', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition">
                    <option value="">Year...</option>
                    {[1, 2, 3, 4, 5, 6].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Semester <span className="text-red-500">*</span></label>
                  <select value={form.semester} onChange={e => update('semester', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-700 bg-white focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition">
                    <option value="">Sem...</option>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Abstract & keywords */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50">Abstract & Keywords</h3>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Abstract / Description <span className="text-red-500">*</span></label>
              <textarea value={form.abstract} onChange={e => update('abstract', e.target.value)}
                rows={5} placeholder="Provide a brief summary of your work (150–300 words recommended)..."
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition resize-none" />
              <div className="text-[11px] text-navy-400 mt-1 text-right">{form.abstract.split(' ').filter(Boolean).length} words</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-1.5 uppercase tracking-wide">Keywords (optional)</label>
              <input type="text" value={form.keywords} onChange={e => update('keywords', e.target.value)}
                placeholder="Separate keywords with commas: machine learning, Zambia, prediction..."
                className="w-full px-3.5 py-2.5 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-300 focus:border-navy-400 transition" />
            </div>
          </div>

          {/* File upload */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50 mb-4">Upload File <span className="text-red-500">*</span></h3>
            {file ? (
              <div className="flex items-center gap-3 p-4 bg-navy-50 border border-navy-200 rounded-xl">
                <div className="w-10 h-10 bg-white border border-navy-200 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-navy-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy-800 truncate">{file.name}</div>
                  <div className="text-xs text-navy-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button type="button" onClick={() => setFile(null)} className="text-navy-400 hover:text-red-500 transition"><X size={16} /></button>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragOver ? 'border-navy-400 bg-navy-50' : 'border-navy-200 hover:border-navy-300'}`}
              >
                <Upload size={28} className="text-navy-300 mx-auto mb-3" />
                <div className="text-sm font-semibold text-navy-700 mb-1">Drag and drop your file here</div>
                <div className="text-xs text-navy-400 mb-3">Supported formats: PDF, DOCX, DOC · Max file size: 50 MB</div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-lg text-sm font-semibold cursor-pointer transition">
                  <Upload size={14} /> Choose File
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileInput} />
                </label>
              </div>
            )}
          </div>

          {/* Declaration */}
          <div className="bg-white rounded-xl border border-navy-100 p-5 shadow-sm">
            <h3 className="font-semibold text-navy-800 text-sm uppercase tracking-wide pb-2 border-b border-navy-50 mb-4">Declaration & Consent</h3>
            <div className="bg-navy-50 rounded-lg p-4 text-xs text-navy-600 leading-relaxed mb-4">
              By submitting this work, I confirm that:<br /><br />
              (1) This is my original work and has not been plagiarised from any source.<br />
              (2) I grant Cavendish University Zambia the right to store, preserve, and provide access to this work in the CORE repository.<br />
              (3) I understand that false declarations may result in academic disciplinary action under the CUZ Academic Integrity Policy.
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.declaration} onChange={e => update('declaration', e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-navy-300 accent-navy-700" />
              <span className="text-sm text-navy-700 font-medium">
                I declare that this submission is my own original work and I accept the terms and conditions above. <span className="text-red-500">*</span>
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {!canSubmit && (form.title || form.type) && !error && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <AlertCircle size={14} className="shrink-0" />
              Please complete all required fields and upload a file before submitting.
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('my-submissions')}
              className="px-5 py-2.5 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">
              Cancel
            </button>
            <button type="submit" disabled={!canSubmit || uploading}
              className="px-6 py-2.5 bg-navy-800 hover:bg-navy-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 flex items-center gap-2">
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <><Upload size={15} /> Submit for Review</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}