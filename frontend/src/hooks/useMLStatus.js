/**
 * useMLStatus — ML Service Status Hook
 * =======================================
 *
 * Checks ML service health via the backend proxy.
 * Used in Analytics and Dashboard pages to show ML engine status.
 *
 * Returns:
 *   - mlStatus (full health object)
 *   - isAvailable (boolean)
 *   - mlHealth (detailed health info)
 *   - loading, error
 *   - refetch
 *
 * Usage:
 *   const { isAvailable, mlHealth, loading } = useMLStatus();
 */

import { useState, useCallback, useEffect } from 'react';
import { transactionAPI } from '../services/api';

export function useMLStatus(options = {}) {
  const { autoFetch = true } = options;

  const [mlStatus, setMlStatus] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await transactionAPI.getMLStatus();
      setMlStatus(data);
    } catch (err) {
      setMlStatus({ ml_api_available: false });
      setError('ML service check failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) fetchStatus();
  }, [fetchStatus, autoFetch]);

  // Derived convenience values
  const isAvailable = mlStatus?.ml_api_available || false;
  const mlHealth = mlStatus?.ml_api_health || null;

  return {
    mlStatus,
    isAvailable,
    mlHealth,
    loading,
    error,
    refetch: fetchStatus,
  };
}
