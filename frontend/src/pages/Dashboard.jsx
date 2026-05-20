/**
 * Dashboard Page (v6.0) — Integrated with useDashboard Hook
 * ===========================================================
 *
 * Uses the useDashboard() hook for all data fetching, error handling,
 * and refresh logic. The page is now a pure presentational component
 * that delegates all API work to the hook.
 *
 * Layout:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  Welcome Banner + Refresh                                 │
 *   ├──────────┬──────────┬──────────┬──────────────────────────┤
 *   │ KPI Card │ KPI Card │ KPI Card │ KPI Card                 │
 *   ├──────────┴──────────┴──────────┴──────────────────────────┤
 *   │  Fraud Trend (Area Chart)      │  Risk Gauge + Risk Donut │
 *   ├────────────────────────────────┼──────────────────────────┤
 *   │  Recent Transactions           │  Status Breakdown        │
 *   │                                │  + ML Status             │
 *   ├────────────────────────────────┼──────────────────────────┤
 *   │  Alerts Feed                   │  Alert Summary           │
 *   └────────────────────────────────┴──────────────────────────┘
 */

import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle,
  IndianRupee,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import LoadingSpinner from '../components/LoadingSpinner';

// Dashboard Widgets
import KPICard from '../components/dashboard/KPICard';
import MLStatusCard from '../components/dashboard/MLStatusCard';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import AlertsFeed from '../components/dashboard/AlertsFeed';

// Charts
import FraudTrendChart from '../components/charts/FraudTrendChart';
import RiskGauge from '../components/charts/RiskGauge';
import RiskDistribution from '../components/charts/RiskDistribution';
import StatusBreakdown from '../components/charts/StatusBreakdown';

function Dashboard() {
  const { user } = useAuth();
  const {
    stats,
    recentTxns,
    recentAlerts,
    loading,
    refreshing,
    error,
    refresh,
  } = useDashboard();

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-500 mt-0.5">
            UPI Fraud Detection — Real-time monitoring dashboard
          </p>
          {error && (
            <p className="text-xs text-amber-600 mt-1">
              Using demo data — backend connection failed
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors self-start"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Transactions"
          value={stats?.totalTransactions || 0}
          icon={ArrowLeftRight}
          color="primary"
          description={`₹${((stats?.totalAmount || 0) / 100000).toFixed(1)}L total volume`}
        />
        <KPICard
          title="Fraud Detected"
          value={stats?.fraudCount || 0}
          icon={AlertTriangle}
          color="danger"
          description={`${stats?.fraudRate || 0}% fraud rate`}
        />
        <KPICard
          title="Legitimate"
          value={stats?.legitimateCount || 0}
          icon={CheckCircle}
          color="success"
          description={`${(100 - (stats?.fraudRate || 0)).toFixed(1)}% clean`}
        />
        <KPICard
          title="Total Volume"
          value={`₹${((stats?.totalAmount || 0) / 100000).toFixed(1)}L`}
          icon={IndianRupee}
          color="amber"
          description={`${(stats?.totalTransactions || 0).toLocaleString()} transactions`}
        />
      </div>

      {/* ── Row 2: Trend Chart + Risk Section ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Trend (Area Chart) — 2/3 width */}
        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Transaction Trend
            <span className="text-xs font-normal text-gray-400 ml-2">
              Last 7 days
            </span>
          </h3>
          <FraudTrendChart data={stats?.recentDaily || []} height={280} />
        </div>

        {/* Risk Section — 1/3 width */}
        <div className="space-y-6">
          {/* Fraud Rate Gauge */}
          <div className="card flex flex-col items-center py-5">
            <RiskGauge value={stats?.fraudRate || 0} label="Fraud Rate" />
          </div>

          {/* Risk Distribution */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Risk Distribution
            </h3>
            <RiskDistribution
              data={stats?.riskBreakdown || {}}
              height={180}
            />
          </div>
        </div>
      </div>

      {/* ── Row 3: Transactions + Side Panels ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions — 2/3 width */}
        <div className="lg:col-span-2">
          <RecentTransactions transactions={recentTxns} />
        </div>

        {/* Right Column — 1/3 width */}
        <div className="space-y-6">
          {/* Status Breakdown */}
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Transaction Status
            </h3>
            <StatusBreakdown data={stats?.statusBreakdown || {}} />
          </div>

          {/* ML Status */}
          <MLStatusCard status={stats?.mlService || {}} />
        </div>
      </div>

      {/* ── Row 4: Alerts Feed + Alert Stats ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Feed — 2/3 width */}
        <div className="lg:col-span-2">
          <AlertsFeed alerts={recentAlerts} />
        </div>

        {/* Alert Stats — 1/3 width */}
        {stats?.alerts && (
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Alert Summary
            </h3>
            <div className="space-y-4">
              <AlertStatRow
                label="Total Alerts"
                value={stats.alerts.total}
                color="text-gray-900"
              />
              <AlertStatRow
                label="Unread"
                value={stats.alerts.unread}
                color="text-primary-600"
                dot="bg-primary-500"
              />
              <AlertStatRow
                label="Critical"
                value={stats.alerts.critical}
                color="text-danger-600"
                dot="bg-danger-500"
              />
              <AlertStatRow
                label="High Severity"
                value={stats.alerts.highSeverity}
                color="text-amber-600"
                dot="bg-amber-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper Components ────────────────────────────────────

function AlertStatRow({ label, value, color, dot }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-gray-600">
        {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
        {label}
      </span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default Dashboard;
