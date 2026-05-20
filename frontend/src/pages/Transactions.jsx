/**
 * Transactions Page (v6.0) — Integrated with useTransactions Hook
 * =================================================================
 *
 * Uses the useTransactions() hook for all data fetching, filtering,
 * and actions. The page only handles UI rendering.
 *
 * Features:
 *   - Fraud filter (All / Fraud / Legitimate)
 *   - Risk level filter (LOW / MEDIUM / HIGH)
 *   - Status filter (COMPLETED / FLAGGED / BLOCKED)
 *   - Search by UPI ID or transaction ID
 *   - Auto re-fetch on filter changes
 */

import { Search, RefreshCw } from 'lucide-react';
import TransactionTable from '../components/TransactionTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTransactions } from '../hooks/useTransactions';

function Transactions() {
  const {
    transactions,
    totalCount,
    loading,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    refetch,
  } = useTransactions();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">
            {totalCount} transaction{totalCount !== 1 ? 's' : ''} found
          </p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by UPI ID or transaction ID..."
          className="input-field pl-10"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
      </div>

      {/* ── Filter Row ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        {/* Fraud Filter */}
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-gray-500 uppercase">
            Fraud:
          </span>
          {['all', 'fraud', 'legitimate'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter('fraudFilter', f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                ${filters.fraudFilter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Risk Filter */}
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-gray-500 uppercase">
            Risk:
          </span>
          {['ALL', 'LOW', 'MEDIUM', 'HIGH'].map((r) => (
            <button
              key={r}
              onClick={() => setFilter('riskFilter', r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filters.riskFilter === r
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-gray-500 uppercase">
            Status:
          </span>
          {['ALL', 'COMPLETED', 'FLAGGED', 'BLOCKED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter('statusFilter', s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                ${filters.statusFilter === s
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-danger-600 bg-danger-50 hover:bg-danger-100 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────────── */}
      {loading ? (
        <LoadingSpinner text="Loading transactions..." />
      ) : (
        <TransactionTable transactions={transactions} />
      )}
    </div>
  );
}

export default Transactions;
