// src/views/NotificationsView.tsx
import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useApp } from '../context';
import { PageHeader } from '../components/Layout';
import { api, resourceApi, extractApiError, type Resource as ApiResource } from '../services/api';
import type { Notification, ViewType } from '../types';

// ============================================================
// LOCAL STORAGE HELPERS FOR READ STATE
// ============================================================

const READ_KEY = 'core_read_notifications';

function getReadIds(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setReadIds(ids: string[]): void {
  localStorage.setItem(READ_KEY, JSON.stringify(ids));
}

// ============================================================
// DATE HELPERS
// ============================================================

function formatRelative(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// ============================================================
// NOTIFICATION BUILDER
// ============================================================

function buildNotifications(
  submissions: ApiResource[],
  resources: ApiResource[],
  readIds: string[],
  programmeName: string | undefined
): Notification[] {
  const list: Notification[] = [];

  // 1. From user's submissions
  submissions.forEach((s) => {
    const id = `sub-${s.id}-${s.is_approved ? 'approved' : 'pending'}`;
    const title = s.title || 'Your submission';
    const date = s.updated_date || s.upload_date;

    if (s.is_approved) {
      list.push({
        id,
        userId: 'me',
        title: 'Submission Approved 🎉',
        message: `"${title}" has been approved and is now visible in the repository.`,
        type: 'success',
        read: readIds.includes(id),
        date: formatRelative(date),
        actionView: 'my-submissions' as ViewType,
      });
    } else {
      list.push({
        id,
        userId: 'me',
        title: 'Submission Under Review',
        message: `"${title}" is waiting for approval by your lecturer.`,
        type: 'info',
        read: readIds.includes(id),
        date: formatRelative(date),
        actionView: 'my-submissions' as ViewType,
      });
    }
  });

  // 2. New resources in the user's programme (last 14 days)
  const now = Date.now();
  const fourteenDays = 14 * 24 * 60 * 60 * 1000;
  const recent = resources
    .filter((r) => now - new Date(r.upload_date).getTime() < fourteenDays)
    .slice(0, 5);

  recent.forEach((r) => {
    const id = `new-resource-${r.id}`;
    list.push({
      id,
      userId: 'me',
      title: 'New Resource Available',
      message: `"${r.title}"${r.course_code ? ` (${r.course_code})` : ''} was recently added to the repository.`,
      type: 'info',
      read: readIds.includes(id),
      date: formatRelative(r.upload_date),
      actionView: 'repository' as ViewType,
    });
  });

  // Sort: unread first, then by most recent (using our date strings as a proxy)
  return list;
}

// ============================================================
// COMPONENT
// ============================================================

export default function NotificationsView() {
  const { user, navigate, showToast } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIdsState] = useState<string[]>(getReadIds());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    const token = localStorage.getItem('core_token');
    try {
      setLoading(true);

      const resourcesData = await api.getResources();

      let subsData: ApiResource[] = [];
      if (token) {
        subsData = await resourceApi.getMySubmissions(token);
      }

      const built = buildNotifications(
        subsData,
        resourcesData,
        readIds,
        user?.programme
      );
      setNotifications(built);
      setError('');
    } catch (err: any) {
      setError(extractApiError(err) || 'Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  }, [readIds, user?.programme]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const markRead = (id: string) => {
    if (readIds.includes(id)) return;
    const next = [...readIds, id];
    setReadIdsState(next);
    setReadIds(next);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIdsState(allIds);
    setReadIds(allIds);
    showToast({ message: 'All notifications marked as read', type: 'success' });
  };

  const myNotifs = notifications;
  const unread = myNotifs.filter((n) => !readIds.includes(n.id)).length;

  const typeIcon = (type: string) => {
    if (type === 'success') return <CheckCircle size={16} className="text-emerald-500" />;
    if (type === 'warning') return <AlertTriangle size={16} className="text-amber-500" />;
    if (type === 'error') return <XCircle size={16} className="text-red-500" />;
    return <Info size={16} className="text-blue-500" />;
  };

  const typeBg = (type: string, isRead: boolean) => {
    if (isRead) return 'bg-white';
    if (type === 'success') return 'bg-emerald-50 border-l-4 border-l-emerald-400';
    if (type === 'warning') return 'bg-amber-50 border-l-4 border-l-amber-400';
    if (type === 'error') return 'bg-red-50 border-l-4 border-l-red-400';
    return 'bg-blue-50 border-l-4 border-l-blue-400';
  };

  // ------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div>
        <PageHeader
          title="Notifications"
          breadcrumbs={[{ label: 'Notifications' }]}
        />
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={36} className="text-navy-500 animate-spin mb-3" />
          <div className="text-navy-500 text-sm">Loading your notifications...</div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Error
  // ------------------------------------------------------------
  if (error) {
    return (
      <div>
        <PageHeader
          title="Notifications"
          breadcrumbs={[{ label: 'Notifications' }]}
        />
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex items-start gap-3 p-5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold mb-1">Couldn't load notifications</div>
              <div className="text-xs">{error}</div>
              <button
                onClick={fetchAll}
                className="mt-2 text-xs font-semibold underline hover:no-underline"
              >
                Try again
              </button>
            </div>
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
        title="Notifications"
        subtitle={`${unread} unread notification${unread !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          unread > 0 ? (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          ) : undefined
        }
      />
      <div className="p-6 max-w-3xl mx-auto">
        {myNotifs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-navy-100">
            <Bell size={40} className="text-navy-200 mx-auto mb-3" />
            <div className="text-navy-600 font-semibold">No notifications</div>
            <div className="text-navy-400 text-sm mt-1">
              You're all caught up.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {myNotifs.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
                <div
                  key={n.id}
                  onClick={() => {
                    markRead(n.id);
                    if (n.actionView) navigate(n.actionView);
                  }}
                  className={`rounded-xl border border-navy-100 px-5 py-4 cursor-pointer hover:shadow-sm transition-all ${typeBg(
                    n.type,
                    isRead
                  )} ${!isRead ? 'shadow-sm' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-0.5">{typeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`text-sm font-semibold ${
                            isRead ? 'text-navy-700' : 'text-navy-900'
                          }`}
                        >
                          {n.title}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-navy-400">{n.date}</span>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                        </div>
                      </div>
                      <p
                        className={`text-xs mt-1 leading-relaxed ${
                          isRead ? 'text-navy-400' : 'text-navy-600'
                        }`}
                      >
                        {n.message}
                      </p>
                      {n.actionView && (
                        <div className="mt-2 text-xs text-navy-600 font-semibold hover:text-navy-800 transition">
                          View details →
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}