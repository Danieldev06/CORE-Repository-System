import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useApp } from '../context';
import { PageHeader } from '../components/Layout';

export default function NotificationsView() {
  const { user, notifications, markNotificationRead, markAllRead, navigate } = useApp();
  const myNotifs = notifications.filter(n => n.userId === user?.id || n.userId === 'all');
  const unread = myNotifs.filter(n => !n.read).length;

  const typeIcon = (type: string) => {
    if (type === 'success') return <CheckCircle size={16} className="text-emerald-500" />;
    if (type === 'warning') return <AlertTriangle size={16} className="text-amber-500" />;
    if (type === 'error') return <XCircle size={16} className="text-red-500" />;
    return <Info size={16} className="text-blue-500" />;
  };

  const typeBg = (type: string, read: boolean) => {
    if (read) return 'bg-white';
    if (type === 'success') return 'bg-emerald-50 border-l-4 border-l-emerald-400';
    if (type === 'warning') return 'bg-amber-50 border-l-4 border-l-amber-400';
    if (type === 'error') return 'bg-red-50 border-l-4 border-l-red-400';
    return 'bg-blue-50 border-l-4 border-l-blue-400';
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread notification${unread !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Notifications' }]}
        actions={
          unread > 0 ? (
            <button onClick={markAllRead} className="flex items-center gap-2 px-3 py-2 border border-navy-200 hover:bg-navy-50 text-navy-700 font-semibold rounded-xl text-sm transition">
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
            <div className="text-navy-400 text-sm mt-1">You are up to date</div>
          </div>
        ) : (
          <div className="space-y-2">
            {myNotifs.map(n => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id);
                  if (n.actionView) navigate(n.actionView);
                }}
                className={`rounded-xl border border-navy-100 px-5 py-4 cursor-pointer hover:shadow-sm transition-all ${typeBg(n.type, n.read)} ${!n.read ? 'shadow-sm' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-0.5">{typeIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`text-sm font-semibold ${n.read ? 'text-navy-700' : 'text-navy-900'}`}>{n.title}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-navy-400">{n.date}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                      </div>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${n.read ? 'text-navy-400' : 'text-navy-600'}`}>{n.message}</p>
                    {n.actionView && (
                      <div className="mt-2 text-xs text-navy-600 font-semibold hover:text-navy-800 transition">View details →</div>
                    )}
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
