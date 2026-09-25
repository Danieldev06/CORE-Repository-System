// src/views/LecturerModules.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  GraduationCap, Loader2, AlertCircle, Save, Search, X,
  CheckCircle, BookOpen, RefreshCw,
} from 'lucide-react';
import { useApp } from '../context';
import { PageHeader } from '../components/Layout';
import { extractApiError } from '../services/api';

// ============================================================
// TYPES
// ============================================================

interface Course {
  id: number;
  code: string;
  name: string;
}

const API_BASE = 'http://localhost:8000/api';

async function fetchAllCourses(token: string): Promise<Course[]> {
  const res = await fetch(`${API_BASE}/courses/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load available modules.');
  return res.json();
}

async function fetchMyModules(token: string): Promise<Course[]> {
  const res = await fetch(`${API_BASE}/lecturer/modules/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!res.ok) throw new Error('Failed to load your modules.');
  return res.json();
}

async function saveMyModules(token: string, moduleIds: number[]): Promise<void> {
  const res = await fetch(`${API_BASE}/lecturer/modules/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({ module_ids: moduleIds }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(JSON.stringify(json));
  }
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function LecturerModules() {
  const { navigate, showToast } = useApp();

  const [allModules, setAllModules] = useState<Course[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  // ------------------------------------------------------------
  // Fetch
  // ------------------------------------------------------------
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('core_token');
    if (!token) {
      setError('Session expired. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [courses, myModules] = await Promise.all([
        fetchAllCourses(token),
        fetchMyModules(token),
      ]);

      const currentIds = new Set<number>(myModules.map((m) => m.id));
      setAllModules(courses);
      setSelectedIds(new Set(currentIds));
      setSavedIds(new Set(currentIds));
      setError('');
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to load modules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ------------------------------------------------------------
  // Derived
  // ------------------------------------------------------------
  const filtered = allModules.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  });

  const hasChanges =
    selectedIds.size !== savedIds.size ||
    [...selectedIds].some((id) => !savedIds.has(id));

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  // ------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------
  const toggleModule = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((m) => next.delete(m.id));
      } else {
        filtered.forEach((m) => next.add(m.id));
      }
      return next;
    });
  };

  const handleReset = () => {
    setSelectedIds(new Set(savedIds));
  };

  const handleSave = async () => {
    const token = localStorage.getItem('core_token');
    if (!token) {
      showToast({ message: 'Session expired.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await saveMyModules(token, [...selectedIds]);
      setSavedIds(new Set(selectedIds));
      showToast({ message: 'Modules updated successfully.', type: 'success' });
    } catch (err: any) {
      showToast({
        message: `Save failed: ${extractApiError(err)}`,
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 size={40} className="text-navy-600 animate-spin mb-3" />
        <div className="text-navy-500">Loading modules...</div>
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
            <div className="font-semibold mb-1">Couldn't load modules</div>
            <div className="text-xs">{error}</div>
            <button
              onClick={fetchData}
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
        title="My Modules"
        subtitle="Choose the modules you teach. These determine which submissions you can review and which courses you can upload to."
        breadcrumbs={[{ label: 'My Modules' }]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-xl text-sm transition ${
                hasChanges && !saving
                  ? 'bg-navy-800 hover:bg-navy-700 text-white'
                  : 'bg-navy-100 text-navy-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-4xl mx-auto space-y-5">
        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <GraduationCap size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <div className="font-semibold text-blue-800">
              Only modules from your programme are shown
            </div>
            <div className="text-blue-700 text-xs mt-0.5">
              If a module is missing, contact the Registry to ensure it's added to your programme.
            </div>
          </div>
        </div>

        {/* Unsaved changes banner */}
        {hasChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3 text-sm">
            <AlertCircle size={15} className="text-amber-600 shrink-0" />
            <div className="flex-1 text-amber-800 font-medium text-xs">
              You have unsaved changes.
            </div>
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 underline"
            >
              Discard
            </button>
          </div>
        )}

        {/* Summary + search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search modules..."
              className="w-full pl-8 pr-3 py-2 border border-navy-200 rounded-lg text-sm text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 bg-white transition"
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

          <button
            onClick={toggleSelectAllFiltered}
            disabled={filtered.length === 0}
            className="text-xs font-semibold text-navy-600 hover:text-navy-800 border border-navy-200 px-3 py-2 rounded-lg hover:bg-navy-50 transition disabled:opacity-40"
          >
            {allFilteredSelected ? 'Clear all' : 'Select all'}
            {search && ' (filtered)'}
          </button>

          <div className="ml-auto text-xs text-navy-500">
            <span className="font-semibold text-navy-800">{selectedIds.size}</span>{' '}
            of {allModules.length} selected
          </div>
        </div>

        {/* Modules list */}
        {allModules.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <BookOpen size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">
              No modules available
            </div>
            <div className="text-navy-400 text-sm mt-1">
              Your programme doesn't have any modules yet. Contact the Registry.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-navy-100">
            <Search size={32} className="text-navy-200 mx-auto mb-2" />
            <div className="text-navy-500 text-sm">
              No modules match "{search}"
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden shadow-sm">
            {filtered.map((m, i) => {
              const checked = selectedIds.has(m.id);
              const wasSaved = savedIds.has(m.id);
              return (
                <label
                  key={m.id}
                  className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition ${
                    i < filtered.length - 1 ? 'border-b border-navy-50' : ''
                  } ${checked ? 'bg-navy-50' : 'hover:bg-navy-50'}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleModule(m.id)}
                    className="w-4 h-4 rounded border-navy-300 accent-navy-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy-800 text-sm">
                        {m.code}
                      </span>
                      {checked && !wasSaved && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                      {!checked && wasSaved && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full">
                          Removing
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-navy-500 mt-0.5 truncate">
                      {m.name}
                    </div>
                  </div>
                  {wasSaved && checked && (
                    <CheckCircle
                      size={16}
                      className="text-emerald-500 shrink-0"
                      aria-label="Currently taught"
                    />
                  )}
                </label>
              );
            })}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => navigate('lecturer-dashboard')}
            className="text-xs font-semibold text-navy-500 hover:text-navy-700 transition"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl text-sm transition ${
              hasChanges && !saving
                ? 'bg-navy-800 hover:bg-navy-700 text-white'
                : 'bg-navy-100 text-navy-400 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}