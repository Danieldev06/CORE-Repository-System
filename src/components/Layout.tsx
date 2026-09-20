import { useState } from 'react';
import { useApp } from '../context';
import type { ViewType } from '../types';
import {
  LayoutDashboard, BookOpen, Upload, FileText, Bookmark, Download,
  Bell, User, ClipboardCheck, Users, FolderOpen, Tag, BarChart2,
  Activity, Settings, GraduationCap, Building2, ChevronRight, Menu, X,
  LogOut, Search, ChevronDown,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  view: ViewType;
  dividerBefore?: boolean;
}

function getNavItems(role: string): NavItem[] {
  if (role === 'student') return [
    { label: 'Dashboard', icon: <LayoutDashboard size={16} />, view: 'student-dashboard' },
    { label: 'Repository', icon: <BookOpen size={16} />, view: 'repository' },
    { label: 'Submit Work', icon: <Upload size={16} />, view: 'submit-work', dividerBefore: true },
    { label: 'My Submissions', icon: <FileText size={16} />, view: 'my-submissions' },
    { label: 'Bookmarks', icon: <Bookmark size={16} />, view: 'bookmarks', dividerBefore: true },
    { label: 'Download History', icon: <Download size={16} />, view: 'download-history' },
    { label: 'Notifications', icon: <Bell size={16} />, view: 'notifications', dividerBefore: true },
    { label: 'Profile', icon: <User size={16} />, view: 'profile' },
  ];
  if (role === 'lecturer') return [
    { label: 'Dashboard', icon: <LayoutDashboard size={16} />, view: 'lecturer-dashboard' },
    { label: 'Repository', icon: <BookOpen size={16} />, view: 'repository' },
    { label: 'My Resources', icon: <FileText size={16} />, view: 'lecturer-resources', dividerBefore: true },
    { label: 'Upload Resource', icon: <Upload size={16} />, view: 'upload-resource' },
    { label: 'Review Submissions', icon: <ClipboardCheck size={16} />, view: 'review-submissions' },
    { label: 'Notifications', icon: <Bell size={16} />, view: 'notifications', dividerBefore: true },
    { label: 'Profile', icon: <User size={16} />, view: 'profile' },
  ];
  return [
    { label: 'Dashboard', icon: <LayoutDashboard size={16} />, view: 'admin-dashboard' },
    { label: 'Repository', icon: <BookOpen size={16} />, view: 'repository' },
    { label: 'Resources', icon: <FileText size={16} />, view: 'admin-resources', dividerBefore: true },
    { label: 'Submissions', icon: <ClipboardCheck size={16} />, view: 'review-submissions' },
    { label: 'Research', icon: <GraduationCap size={16} />, view: 'research-repository' },
    { label: 'Users', icon: <Users size={16} />, view: 'admin-users', dividerBefore: true },
    { label: 'Schools & Programmes', icon: <Building2 size={16} />, view: 'admin-collections' },
    { label: 'Categories', icon: <Tag size={16} />, view: 'admin-categories' },
    { label: 'Analytics', icon: <BarChart2 size={16} />, view: 'admin-analytics', dividerBefore: true },
    { label: 'System Activity', icon: <Activity size={16} />, view: 'admin-activity' },
    { label: 'Notifications', icon: <Bell size={16} />, view: 'notifications' },
    { label: 'Settings', icon: <Settings size={16} />, view: 'admin-settings' },
  ];
}

export function CoreLogo({ size = 'default' }: { size?: 'default' | 'small' }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 border border-white/10">
        <svg viewBox="0 0 36 36" fill="none" width="22" height="22">
          <rect x="3" y="10" width="12" height="18" rx="1.5" fill="white" opacity="0.85" />
          <rect x="21" y="10" width="12" height="18" rx="1.5" fill="white" opacity="0.55" />
          <rect x="15" y="8" width="6" height="22" rx="1" fill="white" />
          <circle cx="9" cy="5" r="2" fill="#60a5fa" />
          <circle cx="18" cy="2.5" r="2" fill="#60a5fa" />
          <circle cx="27" cy="5" r="2" fill="#60a5fa" />
          <line x1="9" y1="5" x2="18" y2="2.5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="2.5" x2="27" y2="5" stroke="#60a5fa" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div className="text-white font-bold text-[17px] leading-none tracking-wide">CORE</div>
        <div className="text-white/40 text-[9px] leading-tight mt-0.5 font-medium tracking-widest uppercase">CUZ Repository</div>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, currentView, navigate, logout, notifications } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const navItems = getNavItems(user.role);
  const unreadCount = notifications.filter(n => !n.read && n.userId === user.id).length;

  const roleLabel = user.role === 'admin' ? 'Librarian / Admin' : user.role === 'lecturer' ? 'Lecturer' : 'Student';
  const roleColor = user.role === 'admin' ? 'bg-purple-500/20 text-purple-200' : user.role === 'lecturer' ? 'bg-blue-500/20 text-blue-200' : 'bg-white/10 text-white/60';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5">
        <CoreLogo />
      </div>

      {/* User mini-card */}
      <div className="mx-3 mb-4 px-3 py-3 rounded-xl bg-white/5 border border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-white text-xs font-semibold truncate">{user.name}</div>
            <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md inline-flex mt-0.5 ${roleColor}`}>{roleLabel}</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scrollbar px-3 pb-2 space-y-0.5">
        {navItems.map((item, idx) => {
          const active = currentView === item.view;
          return (
            <div key={item.view}>
              {item.dividerBefore && idx > 0 && <div className="my-2 border-t border-white/8" />}
              <button
                onClick={() => { navigate(item.view); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 text-left relative ${
                  active
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-white/65 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className={active ? 'text-navy-700' : 'text-white/50'}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.view === 'notifications' && unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount}
                  </span>
                )}
                {item.view === 'review-submissions' && user.role !== 'student' && (
                  <span className="bg-amber-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">2</span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Sidebar footer */}
      <div className="px-3 pb-4 pt-3 border-t border-white/8 space-y-0.5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-white/50 hover:bg-white/8 hover:text-white/80 transition-all"
        >
          <LogOut size={15} />
          Sign Out
        </button>
        <div className="px-3 pt-2 text-[10px] text-white/20 leading-relaxed">
          CORE v1.0 — Cavendish University Zambia<br />© 2026 All rights reserved.
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-navy-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] shrink-0 bg-navy-900">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-navy-900 z-10 shadow-2xl">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topnav */}
        <header className="h-14 bg-white border-b border-navy-100 flex items-center px-5 gap-4 shrink-0 shadow-sm">
          <button className="lg:hidden text-navy-500 hover:text-navy-800" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          <div className="flex-1 max-w-sm hidden sm:flex">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-navy-50 border border-navy-100 rounded-lg text-navy-800 placeholder-navy-300 focus:ring-2 focus:ring-navy-200 focus:border-navy-300 transition"
                onKeyDown={e => { if (e.key === 'Enter') navigate('repository'); }}
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              onClick={() => navigate('notifications')}
              className="relative p-2 text-navy-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(o => !o)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-navy-50 transition border border-transparent hover:border-navy-100"
              >
                <div className="w-7 h-7 rounded-full bg-navy-800 flex items-center justify-center text-white text-[11px] font-bold">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-navy-800 leading-tight">{user.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-navy-400 capitalize leading-tight">{user.role}</div>
                </div>
                <ChevronDown size={12} className="text-navy-400 hidden sm:block" />
              </button>

              {profileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setProfileMenuOpen(false)} />
                  <div className="absolute right-0 top-11 z-30 w-52 bg-white border border-navy-100 rounded-2xl shadow-xl py-1.5 overflow-hidden">
                    <div className="px-4 py-3 border-b border-navy-50">
                      <div className="text-xs font-bold text-navy-800">{user.name}</div>
                      <div className="text-[11px] text-navy-400 mt-0.5">{user.email}</div>
                      <div className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1.5 capitalize ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-700' :
                        user.role === 'lecturer' ? 'bg-blue-50 text-blue-700' :
                        'bg-navy-50 text-navy-600'
                      }`}>{roleLabel}</div>
                    </div>
                    <div className="py-1">
                      <button onClick={() => { navigate('profile'); setProfileMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition flex items-center gap-2.5">
                        <User size={14} className="text-navy-400" /> My Profile
                      </button>
                      <button onClick={() => { navigate('notifications'); setProfileMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-navy-700 hover:bg-navy-50 transition flex items-center gap-2.5">
                        <Bell size={14} className="text-navy-400" /> Notifications
                        {unreadCount > 0 && <span className="ml-auto bg-blue-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>}
                      </button>
                    </div>
                    <div className="border-t border-navy-50 py-1">
                      <button onClick={() => { logout(); setProfileMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2.5">
                        <LogOut size={14} /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title, subtitle, breadcrumbs, actions
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; view?: ViewType }[];
  actions?: React.ReactNode;
}) {
  const { navigate } = useApp();
  return (
    <div className="bg-white border-b border-navy-100 px-6 py-5">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-[11px] text-navy-400 mb-2">
          <span className="text-navy-300">CORE</span>
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              <ChevronRight size={11} />
              {b.view ? (
                <button onClick={() => navigate(b.view!)} className="hover:text-navy-700 transition font-medium">
                  {b.label}
                </button>
              ) : (
                <span className="text-navy-600 font-semibold">{b.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[19px] font-bold text-navy-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-navy-500 mt-0.5 leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0 mt-0.5">{actions}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'draft': 'bg-gray-100 text-gray-600 border-gray-200',
    'submitted': 'bg-blue-50 text-blue-700 border-blue-100',
    'under-review': 'bg-amber-50 text-amber-700 border-amber-100',
    'approved': 'bg-green-50 text-green-700 border-green-100',
    'rejected': 'bg-red-50 text-red-700 border-red-100',
    'published': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'archived': 'bg-gray-50 text-gray-500 border-gray-100',
    'active': 'bg-green-50 text-green-700 border-green-100',
    'inactive': 'bg-gray-100 text-gray-500 border-gray-200',
  };
  const labels: Record<string, string> = {
    'draft': 'Draft', 'submitted': 'Submitted', 'under-review': 'Under Review',
    'approved': 'Approved', 'rejected': 'Rejected', 'published': 'Published',
    'archived': 'Archived', 'active': 'Active', 'inactive': 'Inactive',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border ${styles[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[status] ?? status}
    </span>
  );
}

export function ResourceTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    'lecture-notes': 'Lecture Notes',
    'past-paper': 'Past Paper',
    'dissertation': 'Dissertation',
    'thesis': 'Thesis',
    'research-proposal': 'Research Proposal',
    'journal-article': 'Journal Article',
    'research-paper': 'Research Paper',
    'course-material': 'Course Material',
    'academic-guide': 'Academic Guide',
    'other': 'Other',
  };
  const colors: Record<string, string> = {
    'lecture-notes': 'bg-navy-50 text-navy-700 border-navy-100',
    'past-paper': 'bg-purple-50 text-purple-700 border-purple-100',
    'dissertation': 'bg-blue-50 text-blue-700 border-blue-100',
    'thesis': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'research-proposal': 'bg-teal-50 text-teal-700 border-teal-100',
    'journal-article': 'bg-cyan-50 text-cyan-700 border-cyan-100',
    'research-paper': 'bg-sky-50 text-sky-700 border-sky-100',
    'course-material': 'bg-slate-50 text-slate-600 border-slate-100',
    'academic-guide': 'bg-stone-50 text-stone-600 border-stone-100',
    'other': 'bg-gray-50 text-gray-600 border-gray-100',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${colors[type] ?? 'bg-gray-50 text-gray-600 border-gray-100'}`}>
      {labels[type] ?? type}
    </span>
  );
}

export function Toast() {
  const { toast, dismissToast } = useApp();
  if (!toast) return null;
  const styles = {
    success: 'bg-emerald-800 text-white border-emerald-700',
    error: 'bg-red-700 text-white border-red-600',
    info: 'bg-navy-900 text-white border-navy-800',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-sm font-medium border max-w-xs ${styles[toast.type]}`}>
      <span className="leading-snug">{toast.message}</span>
      <button onClick={dismissToast} className="ml-2 opacity-60 hover:opacity-100 transition shrink-0">
        <X size={14} />
      </button>
    </div>
  );
}
