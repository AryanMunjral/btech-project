/**
 * Alerts Page (v6.0) — Integrated with useAlerts Hook
 * =====================================================
 *
 * Uses the useAlerts() hook for fetching, filtering, and all
 * alert actions. The page is purely presentational.
 *
 * Features:
 *   - Severity filtering (ALL, CRITICAL, HIGH, MEDIUM, LOW)
 *   - Read/unread filtering
 *   - Mark as read / resolve actions
 *   - Mark all as read (bulk action)
 *   - Alert stats summary
 */

import {
  Bell,
  AlertTriangle,
  ShieldAlert,
  Zap,
  Eye,
  CheckCircle,
  Filter,
  BellOff,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAlerts } from '../hooks/useAlerts';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

// Alert type → icon mapping
const typeIcons = {
  FRAUD_DETECTED: ShieldAlert,
  SUSPICIOUS_ACTIVITY: AlertTriangle,
  HIGH_AMOUNT: Zap,
  RAPID_TRANSACTIONS: Zap,
  ACCOUNT_ANOMALY: AlertTriangle,
};

// Severity → badge variant mapping
const severityVariant = {
  CRITICAL: 'critical',
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'neutral',
};

function Alerts() {
  const { canManage } = useAuth();
  const {
    alerts,
    stats,
    loading,
    severityFilter,
    setSeverityFilter,
    readFilter,
    setReadFilter,
    resetFilters,
    markAsRead,
    resolve,
    markAllRead,
  } = useAlerts();

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading alerts..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud Alerts</h1>
          <p className="text-gray-500 mt-1">
            Monitor and manage fraud detection alerts
          </p>
        </div>

        {canManage && stats?.unread > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Eye className="h-4 w-4" />
            Mark All Read ({stats.unread})
          </button>
        )}
      </div>

      {/* ── Stats Bar ───────────────────────────────────── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card py-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-gray-500">Unread</p>
            <p className="text-xl font-bold text-primary-600">{stats.unread}</p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-gray-500">Critical</p>
            <p className="text-xl font-bold text-red-600">{stats.critical}</p>
          </div>
          <div className="card py-4">
            <p className="text-sm text-gray-500">High</p>
            <p className="text-xl font-bold text-amber-600">
              {stats.highSeverity}
            </p>
          </div>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Severity Filter */}
        <div className="flex gap-2 flex-wrap">
          <Filter className="h-5 w-5 text-gray-400 self-center" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${severityFilter === sev
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Read/Unread Filter */}
        <div className="flex gap-2">
          {['all', 'unread', 'read'].map((rf) => (
            <button
              key={rf}
              onClick={() => setReadFilter(rf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${readFilter === rf
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              {rf}
            </button>
          ))}
        </div>
      </div>

      {/* ── Alert List ──────────────────────────────────── */}
      {alerts.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No alerts found"
          description="All clear — no fraud alerts match your current filters."
          action={{ label: 'Reset Filters', onClick: resetFilters }}
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const TypeIcon = typeIcons[alert.type] || AlertTriangle;

            return (
              <div
                key={alert.id}
                className={`card flex items-start gap-4 transition-all ${
                  !alert.isRead
                    ? 'border-l-4 border-l-primary-500 bg-primary-50/30'
                    : alert.resolved
                    ? 'opacity-60'
                    : ''
                }`}
              >
                {/* Icon */}
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    alert.severity === 'CRITICAL'
                      ? 'bg-red-100 text-red-600'
                      : alert.severity === 'HIGH'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <TypeIcon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {alert.title}
                    </h3>
                    <Badge variant={severityVariant[alert.severity]}>
                      {alert.severity}
                    </Badge>
                    {alert.resolved && (
                      <Badge variant="success">Resolved</Badge>
                    )}
                    {!alert.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {alert.message}
                  </p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>{alert.type?.replace(/_/g, ' ')}</span>
                    {alert.transaction && (
                      <span>
                        Txn: {alert.transaction.transactionId?.slice(0, 16)}...
                      </span>
                    )}
                    <span>
                      {new Date(alert.createdAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {canManage && !alert.resolved && (
                  <div className="flex gap-2 flex-shrink-0">
                    {!alert.isRead && (
                      <button
                        onClick={() => markAsRead(alert.id)}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => resolve(alert.id)}
                      className="p-1.5 text-gray-400 hover:text-success-600 hover:bg-success-50 rounded-lg transition-colors"
                      title="Resolve"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Alerts;
