import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AppContextType, User, ViewType, Notification, ToastMessage } from './types';
import { MOCK_NOTIFICATIONS } from './data';
import { authApi } from './services/api';

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [params, setParams] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ============================================================
  // 🔄 ON APP LOAD: Restore user from token
  // ============================================================
  useEffect(() => {
    const restoreAuth = async () => {
      const token = localStorage.getItem('core_token');
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const profile = await authApi.me(token);
        // Map Django user to frontend User shape
        const restoredUser: User = {
          id: String(profile.id),
          name: `${profile.first_name} ${profile.last_name}`.trim() || profile.email,
          email: profile.email,
          role: profile.role,
          studentId: profile.student_id,
          programme: profile.program,
          department: profile.faculty,
          yearOfStudy: profile.year,
          status: 'active',
          dateJoined: new Date().toISOString(),
        };
        setUser(restoredUser);
        // Route to correct dashboard
        if (restoredUser.role === 'student') setCurrentView('student-dashboard');
        else if (restoredUser.role === 'lecturer') setCurrentView('lecturer-dashboard');
        else setCurrentView('admin-dashboard');
      } catch (err) {
        // Token invalid — clear it
        localStorage.removeItem('core_token');
      } finally {
        setAuthLoading(false);
      }
    };
    restoreAuth();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const navigate = (view: ViewType, p?: Record<string, string>) => {
    setCurrentView(view);
    setParams(p ?? {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = (u: User, token?: string) => {
    setUser(u);
    if (token) localStorage.setItem('core_token', token);
    if (u.role === 'student') navigate('student-dashboard');
    else if (u.role === 'lecturer') navigate('lecturer-dashboard');
    else navigate('admin-dashboard');
  };

  const logout = async () => {
    const token = localStorage.getItem('core_token');
    if (token) {
      try { await authApi.logout(token); } catch {}
    }
    localStorage.removeItem('core_token');
    setUser(null);
    navigate('login');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(ids => {
      const next = ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id];
      showToast({ message: ids.includes(id) ? 'Bookmark removed' : 'Resource bookmarked', type: 'success' });
      return next;
    });
  };

  const addDownload = (id: string) => {
    setDownloadedIds(ids => ids.includes(id) ? ids : [...ids, id]);
    showToast({ message: 'Download started', type: 'success' });
  };

  const showToast = (msg: ToastMessage) => setToast(msg);
  const dismissToast = () => setToast(null);

  // Show loading screen while restoring auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <div className="text-white/60 text-sm">Loading CORE...</div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{
      user, currentView, params, navigate,
      login, logout,
      notifications, markNotificationRead, markAllRead,
      bookmarkedIds, toggleBookmark,
      downloadedIds, addDownload,
      toast, showToast, dismissToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}