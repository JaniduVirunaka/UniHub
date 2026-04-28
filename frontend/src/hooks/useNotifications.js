import { useEffect, useState, useCallback } from 'react';
import { notificationService } from '../services/services';

export default function useNotifications(pollInterval = 15000) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data || []);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, pollInterval);
    return () => clearInterval(id);
  }, [fetchNotifications, pollInterval]);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((n) => n.map((x) => (x._id === id ? { ...x, read: true } : x)));
    } catch (err) {
      console.error('markRead error', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    } catch (err) {
      console.error('markAllRead error', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, error, fetchNotifications, markRead, markAllRead, unreadCount };
}
