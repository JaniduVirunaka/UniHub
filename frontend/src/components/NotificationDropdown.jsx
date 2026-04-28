import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { Link } from 'react-router-dom';

export default function NotificationDropdown() {
  const { notifications, loading, markRead, markAllRead, unreadCount, fetchNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-white/5"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-white p-2 shadow-lg dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center justify-between px-3 py-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            <div className="flex items-center gap-2">
              <button className="text-xs text-slate-500 hover:text-slate-700" onClick={markAllRead}>Mark all</button>
              <Link to="/notifications" onClick={() => setOpen(false)} className="text-xs text-indigo-600">Notifications</Link>
            </div>
          </div>

          <div className="max-h-64 divide-y overflow-auto">
            {loading && <div className="p-3 text-sm text-slate-500">Loading…</div>}
            {!loading && notifications.length === 0 && (
              <div className="p-3 text-sm text-slate-500">No notifications</div>
            )}
            {!loading && notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => markRead(n._id)}
                className={`cursor-pointer px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/5 ${n.read ? 'text-slate-600' : 'bg-slate-50 dark:bg-white/5 font-medium'}`}
              >
                <div className="text-sm">{n.message}</div>
                <div className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
