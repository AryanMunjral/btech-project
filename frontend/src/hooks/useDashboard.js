/**
 * useDashboard — Dashboard Data Hook
 * =====================================
 *
 * Fetches all dashboard data in parallel:
 *   - Dashboard stats (KPIs, charts, breakdowns)
 *   - Recent transactions (last 5)
 *   - Recent alerts (last 5)
 *
 * Provides refresh + fallback demo data on error.
 *
 * Usage:
 *   const {
 *     stats, recentTxns, recentAlerts,
 *     loading, refreshing, error,
 *     refresh,
 *   } = useDashboard();
 */

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dashboardAPI, transactionAPI, alertAPI } from '../services/api';
import { parseError } from '../utils/errorHandler';

// Fallback data so UI is always visible during development / demo
const FALLBACK_STATS = {
  totalTransactions: 1247,
  fraudCount: 43,
  legitimateCount: 1204,
  totalAmount: 2456780,
  fraudRate: 3.45,
  riskBreakdown: { LOW: 1080, MEDIUM: 124, HIGH: 43 },
  statusBreakdown: { COMPLETED: 1160, FLAGGED: 52, BLOCKED: 21, FAILED: 14 },
  recentDaily: [
    { date: 'Mon', total: 180, fraud: 6 },
    { date: 'Tue', total: 220, fraud: 8 },
    { date: 'Wed', total: 195, fraud: 5 },
    { date: 'Thu', total: 240, fraud: 12 },
    { date: 'Fri', total: 210, fraud: 7 },
    { date: 'Sat', total: 120, fraud: 3 },
    { date: 'Sun', total: 82, fraud: 2 },
  ],
  alerts: { total: 48, unread: 12, critical: 5, highSeverity: 8 },
  mlService: {
    available: true,
    model_loaded: true,
    model_version: '3.0.0',
    predictions_served: 1247,
  },
};

export function useDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTxns, setRecentTxns] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // ── Core fetch — parallel API calls ────────────────────
  const fetchData = useCallback(async () => {
    setError(null);

    try {
      const [dashRes, txnRes, alertRes] = await Promise.all([
        dashboardAPI.getStats(),
        transactionAPI
          .getAll({ limit: 5 })
          .catch(() => ({ data: { transactions: [] } })),
        alertAPI
          .getAll({ limit: 5 })
          .catch(() => ({ data: [] })),
      ]);

      setStats(dashRes.data);
      setRecentTxns(txnRes.data.transactions || []);
      setRecentAlerts(
        Array.isArray(alertRes.data)
          ? alertRes.data
          : alertRes.data.alerts || []
      );
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
      // Use fallback data so UI is still useful
      setStats(FALLBACK_STATS);
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial fetch on mount ─────────────────────────────
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Manual refresh with feedback ───────────────────────
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    if (mountedRef.current) {
      setRefreshing(false);
      toast.success('Dashboard refreshed');
    }
  }, [fetchData]);

  return {
    stats,
    recentTxns,
    recentAlerts,
    loading,
    refreshing,
    error,
    refresh,
  };
}
