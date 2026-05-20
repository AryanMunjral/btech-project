/**
 * useTransactions — Transaction Data Hook
 * =========================================
 *
 * Manages the full transaction list lifecycle:
 *   - Fetching with filters (fraud, risk, status, search)
 *   - Creating new transactions
 *   - Rechecking existing transactions
 *   - Pagination-ready (count + transactions)
 *
 * Usage:
 *   const {
 *     transactions, loading, error, totalCount,
 *     filters, setFilter, clearFilters,
 *     refetch, createTransaction, recheckTransaction,
 *   } = useTransactions();
 */

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { transactionAPI } from '../services/api';
import { handleApiError } from '../utils/errorHandler';

const INITIAL_FILTERS = {
  fraudFilter: 'all',       // 'all' | 'fraud' | 'legitimate'
  riskFilter: 'ALL',        // 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH'
  statusFilter: 'ALL',      // 'ALL' | 'COMPLETED' | 'FLAGGED' | 'BLOCKED'
  search: '',
  limit: 50,
};

export function useTransactions(options = {}) {
  const { autoFetch = true, limit = 50 } = options;

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS, limit });

  // ── Build API params from filter state ─────────────────
  const buildParams = useCallback(() => {
    const params = { limit: filters.limit };
    if (filters.fraudFilter !== 'all') params.is_fraud = filters.fraudFilter === 'fraud';
    if (filters.riskFilter !== 'ALL') params.risk_level = filters.riskFilter;
    if (filters.statusFilter !== 'ALL') params.status = filters.statusFilter;
    if (filters.search.trim()) params.search = filters.search.trim();
    return params;
  }, [filters]);

  // ── Fetch transaction list ─────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = buildParams();
      const { data } = await transactionAPI.getAll(params);

      setTransactions(data.transactions || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      const msg = handleApiError(err, 'Failed to load transactions');
      setError(msg);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  // ── Auto-fetch on mount + filter changes ───────────────
  useEffect(() => {
    if (autoFetch) fetchTransactions();
  }, [fetchTransactions, autoFetch]);

  // ── Set individual filter ──────────────────────────────
  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Clear all filters ─────────────────────────────────
  const clearFilters = useCallback(() => {
    setFilters((prev) => ({ ...INITIAL_FILTERS, limit: prev.limit }));
  }, []);

  // ── Check if any filter is active ──────────────────────
  const hasActiveFilters =
    filters.fraudFilter !== 'all' ||
    filters.riskFilter !== 'ALL' ||
    filters.statusFilter !== 'ALL' ||
    filters.search.trim() !== '';

  // ── Create a new transaction ───────────────────────────
  const createTransaction = useCallback(async (payload) => {
    try {
      const { data } = await transactionAPI.create(payload);

      if (data.prediction?.is_fraud) {
        toast.error(
          `FRAUD DETECTED — ${data.prediction.risk_level} risk (${(data.prediction.fraud_probability * 100).toFixed(1)}%)`
        );
      } else {
        toast.success('Transaction processed — appears legitimate');
      }

      return data;
    } catch (err) {
      // Don't show a confusing toast if already redirecting to login
      if (!err._authRedirect) {
        handleApiError(err, 'Transaction failed. Please try again.');
      }
      throw err;
    }
  }, []);

  // ── Recheck an existing transaction ────────────────────
  const recheckTransaction = useCallback(async (id) => {
    try {
      const { data } = await transactionAPI.recheck(id);
      toast.success('Transaction rechecked');

      // Update in local state if it exists
      setTransactions((prev) =>
        prev.map((txn) => (txn.id === id ? { ...txn, ...data.transaction } : txn))
      );

      return data;
    } catch (err) {
      handleApiError(err, 'Failed to recheck transaction');
      throw err;
    }
  }, []);

  // ── Get single transaction by ID ───────────────────────
  const getTransaction = useCallback(async (id) => {
    try {
      const { data } = await transactionAPI.getById(id);
      return data;
    } catch (err) {
      handleApiError(err, 'Failed to load transaction details');
      throw err;
    }
  }, []);

  return {
    // Data
    transactions,
    totalCount,
    loading,
    error,

    // Filters
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,

    // Actions
    refetch: fetchTransactions,
    createTransaction,
    recheckTransaction,
    getTransaction,
  };
}
