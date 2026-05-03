import PageWrapper from '../components/PageWrapper';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import useNotifications from '../hooks/useNotifications';

export default function Notifications() {
  const { notifications, loading, markRead, markAllRead, fetchNotifications } = useNotifications(15000);

  return (
    <PageWrapper title="Notifications">
      <Card padding="md">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Inbox</h3>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => { markAllRead(); }}>Mark all read</Button>
            <Button onClick={() => fetchNotifications()}>Refresh</Button>
          </div>
        </div>

        <div className="space-y-2">
          {loading && <div className="text-sm text-slate-500">Loading…</div>}
          {!loading && notifications.length === 0 && (
            <div className="text-sm text-slate-500">No notifications</div>
          )}
          {!loading && notifications.map((n) => (
            <div key={n._id} className={`rounded-md border p-3 ${n.read ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-white/5'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">{n.message}</div>
                  <div className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.read && (
                  <div className="ml-4">
                    <Button size="sm" variant="secondary" onClick={() => markRead(n._id)}>Mark read</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </PageWrapper>
  );
}
