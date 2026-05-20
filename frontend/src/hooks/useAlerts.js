/**
 * useAlerts — Alert Data Hook
 * =============================
 *
 * Manages alerts lifecycle:
 *   - Fetching with severity and read/unread filters
 *   - Alert stats (total, unread, critical, high)
 *   - Actions: mark as read, resolve, mark all read
 *
 * Usage:
 *   const {
 *     alerts, stats, loading, error,
 *     severityFilter, setSeverityFilter,
 *     readFilter, setReadFilter,
 *     markAsRead, resolve, markAllRead,
 *     refetch,
 *   } = useAlerts();
 */

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { alertAPI } from '../services/api';
import { handleApiError } from '../utils/errorHandler';

export function useAlerts(options = {}) {
  const { autoFetch = true } = options;

  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('all'); // 'all' | 'unread' | 'read'

  // ── Fetch alerts + stats in parallel ───────────────────
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};
      if (severityFilter !== 'ALL') params.severity = severityFilter;
      if (readFilter === 'unread') params.isRead = false;
      if (readFilter === 'read') params.isRead = true;

      const [alertsRes, statsRes] = await Promise.all([
        alertAPI.getAll(params),
        alertAPI.getStats(),
      ]);

      setAlerts(alertsRes.data.alerts || alertsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      const msg = handleApiError(err, 'Failed to load alerts');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, readFilter]);

  // ── Auto-fetch on mount + filter changes ───────────────
  useEffect(() => {
    if (autoFetch) fetchAlerts();
  }, [fetchAlerts, autoFetch]);

  // ── Mark single alert as read ──────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      await alertAPI.markAsRead(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );

      // Decrement unread count in local stats
      setStats((prev) =>
        prev ? { ...prev, unread: Math.max(0, (prev.unread || 0) - 1) } : prev
      );

      toast.success('Marked as read');
    } catch (err) {
      handleApiError(err, 'Failed to mark as read');
    }
  }, []);

  // ── Resolve an alert ───────────────────────────────────
  const resolve = useCallback(async (id) => {
    try {
      await alertAPI.resolve(id);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, isRead: true, resolved: true } : a
        )
      );
      toast.success('Alert resolved');
    } catch (err) {
      handleApiError(err, 'Failed to resolve alert');
    }
  }, []);

  // ── Mark all alerts as read ────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await alertAPI.markAllAsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setStats((prev) => (prev ? { ...prev, unread: 0 } : prev));
      toast.success('All alerts marked as read');
    } catch (err) {
      handleApiError(err, 'Failed to mark all as read');
    }
  }, []);

  // ── Reset filters ──────────────────────────────────────
  const resetFilters = useCallback(() => {
    setSeverityFilter('ALL');
    setReadFilter('all');
  }, []);

  return {
    // Data
    alerts,
    stats,
    loading,
    error,

    // Filters
    severityFilter,
    setSeverityFilter,
    readFilter,
    setReadFilter,
    resetFilters,

    // Actions
    markAsRead,
    resolve,
    markAllRead,
    refetch: fetchAlerts,
  };
}
