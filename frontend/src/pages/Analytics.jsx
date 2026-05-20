/**
 * Admin Analytics Page (v6.0) — Integrated with Hooks
 * =====================================================
 *
 * Uses useMLStatus() for ML service health and useApi() for stats.
 * Advanced analytics for ADMIN and ANALYST roles.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  Header + Refresh                             │
 *   ├──────────┬──────────┬──────────┬─────────────┤
 *   │ Fraud %  │ Blocked  │ Alerts   │ Volume      │
 *   ├──────────┴──────────┴──────────┴─────────────┤
 *   │  ML Service Status (full width)               │
 *   ├───────────────────────┬──────────────────────┤
 *   │  Fraud Trend Chart    │  Risk Gauge           │
 *   │  (area chart)         │  + Risk Distribution  │
 *   ├───────────────────────┼──────────────────────┤
 *   │  Status Breakdown     │  Fraud vs Legit Pie   │
 *   ├───────────────────────┴──────────────────────┤
 *   │  Recent Fraud Transactions Table              │
 *   └──────────────────────────────────────────────┘
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Ban,
  Bell,
  IndianRupee,
  Cpu,
  WifiOff,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import toast from 'react-hot-toast';
import { dashboardAPI, transactionAPI } from '../services/api';
import { useMLStatus } from '../hooks/useMLStatus';
import { handleApiError } from '../utils/errorHandler';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';
import Badge from '../components/Badge';
import KPICard from '../components/dashboard/KPICard';

// Charts
import FraudTrendChart from '../components/charts/FraudTrendChart';
import RiskGauge from '../components/charts/RiskGauge';
import RiskDistribution from '../components/charts/RiskDistribution';
import StatusBreakdown from '../components/charts/StatusBreakdown';

const PIE_COLORS = ['#22c55e', '#ef4444'];

function Analytics() {
  const [stats, setStats] = useState(null);
  const [recentFraud, setRecentFraud] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { isAvailable, mlHealth } = useMLStatus();

  const fetchData = async () => {
    try {
      const [dashRes, fraudRes] = await Promise.all([
        dashboardAPI.getStats(),
        transactionAPI
          .getAll({ is_fraud: true, limit: 10 })
          .catch(() => ({ data: { transactions: [] } })),
      ]);

      setStats(dashRes.data);
      setRecentFraud(fraudRes.data.transactions || []);
    } catch (err) {
      handleApiError(err, 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading analytics..." />;
  }

  const pieData = [
    { name: 'Legitimate', value: stats?.legitimateCount || 0 },
    { name: 'Fraud', value: stats?.fraudCount || 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Analytics
          </h1>
          <p className="text-gray-500 mt-0.5">
            Advanced fraud detection metrics and system health
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors self-start"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── KPI Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Fraud Rate"
          value={`${stats?.fraudRate || 0}%`}
          icon={TrendingUp}
          color="danger"
          description={`${stats?.fraudCount || 0} of ${stats?.totalTransactions || 0} transactions`}
        />
        <KPICard
          title="Blocked"
          value={stats?.statusBreakdown?.BLOCKED || 0}
          icon={Ban}
          color="danger"
          description="Auto-blocked by ML model"
        />
        <KPICard
          title="Unread Alerts"
          value={stats?.alerts?.unread || 0}
          icon={Bell}
          color="amber"
          description={`${stats?.alerts?.critical || 0} critical`}
        />
        <KPICard
          title="Volume"
          value={formatCurrency(stats?.totalAmount || 0, { compact: true })}
          icon={IndianRupee}
          color="primary"
          description={`${(stats?.totalTransactions || 0).toLocaleString()} total`}
        />
      </div>

      {/* ── ML Service Status (full width) ──────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="h-5 w-5 text-primary-600" />
          <h2 className="text-base font-semibold text-gray-900">
            ML Service Status
          </h2>
        </div>

        {isAvailable ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-semibold text-success-600">
                  Connected
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Model</p>
              <p className="text-sm font-semibold text-gray-900">
                {mlHealth?.model_loaded ? 'XGBoost' : 'Rule-based'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Version</p>
              <p className="text-sm font-semibold text-gray-900">
                v{mlHealth?.model_version || '3.0'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Features</p>
              <p className="text-sm font-semibold text-gray-900">
                {mlHealth?.features_count || 29}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Predictions</p>
              <p className="text-sm font-semibold text-gray-900">
                {(mlHealth?.predictions_served || 0).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 rounded-lg p-4">
            <WifiOff className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-700">
                ML API Unavailable
              </p>
              <p className="text-xs text-amber-500">
                Using rule-based fallback. Start ML API: uvicorn app.main:app
                --port 8000
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Row 2: Trend + Risk ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Trend */}
        <div className="card lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Fraud Trend
            <span className="text-xs font-normal text-gray-400 ml-2">
              Last 7 days
            </span>
          </h3>
          <FraudTrendChart data={stats?.recentDaily || []} height={300} />
        </div>

        {/* Risk Analysis */}
        <div className="space-y-6">
          <div className="card flex flex-col items-center py-5">
            <RiskGauge value={stats?.fraudRate || 0} label="Overall Fraud Rate" />
          </div>
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Risk Distribution
            </h3>
            <RiskDistribution data={stats?.riskBreakdown || {}} height={190} />
          </div>
        </div>
      </div>

      {/* ── Row 3: Status + Pie Chart ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Transaction Status
          </h3>
          <StatusBreakdown data={stats?.statusBreakdown || {}} />
        </div>

        {/* Fraud vs Legitimate Pie */}
        <div className="card">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            Fraud vs Legitimate
          </h3>
          {(stats?.totalTransactions || 0) > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="60%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-success-500" />
                    <span className="text-sm text-gray-600">Legitimate</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900 ml-5">
                    {(stats?.legitimateCount || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-danger-500" />
                    <span className="text-sm text-gray-600">Fraud</span>
                  </div>
                  <p className="text-xl font-bold text-danger-600 ml-5">
                    {(stats?.fraudCount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">
              No data yet
            </p>
          )}
        </div>
      </div>

      {/* ── Row 4: Recent Fraud Table ────────────────────── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-danger-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Recent Fraud Transactions
          </h3>
          <span className="text-xs text-gray-400 ml-auto">
            Last 10 flagged
          </span>
        </div>

        {recentFraud.length > 0 ? (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="table-header">Transaction</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Probability</th>
                  <th className="table-header">Risk</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentFraud.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="text-sm font-mono text-gray-700">
                        {(txn.transactionId || '').slice(0, 16)}...
                      </p>
                      <p className="text-xs text-gray-400">
                        {txn.senderUpi} → {txn.receiverUpi}
                      </p>
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                      {formatCurrency(txn.amount)}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-danger-500 rounded-full"
                            style={{
                              width: `${(txn.fraudProbability || 0) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {((txn.fraudProbability || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          txn.riskLevel === 'HIGH'
                            ? 'danger'
                            : txn.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {txn.riskLevel}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <Badge
                        variant={
                          txn.status === 'BLOCKED'
                            ? 'critical'
                            : txn.status === 'FLAGGED'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {txn.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500">
                      {formatDate(txn.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">
            No fraud transactions detected yet
          </p>
        )}
      </div>
    </div>
  );
}

export default Analytics;
