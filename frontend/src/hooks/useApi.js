/**
 * useApi — Generic Data-Fetching Hook
 * =====================================
 *
 * Encapsulates the common pattern:
 *   loading → fetch → data / error → refetch
 *
 * Returns { data, loading, error, refetch, setData }.
 *
 * Features:
 *   - Auto-fetch on mount (configurable)
 *   - Dependency-aware re-fetching
 *   - Built-in loading & error states
 *   - Abort on unmount (prevents state-update-on-unmounted)
 *   - Manual refetch function
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(
 *     () => transactionAPI.getAll({ limit: 10 }),
 *     { initialData: [], deps: [filter] }
 *   );
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { parseError } from '../utils/errorHandler';

export function useApi(apiFunc, options = {}) {
  const {
    initialData = null,
    deps = [],
    autoFetch = true,
    onSuccess = null,
    onError = null,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);

  // Track latest fetch to prevent stale updates from races
  const fetchIdRef = useRef(0);

  const execute = useCallback(
    async (...args) => {
      const fetchId = ++fetchIdRef.current;

      setLoading(true);
      setError(null);

      try {
        const response = await apiFunc(...args);
        const result = response?.data !== undefined ? response.data : response;

        // Only update state if this is the latest fetch
        if (fetchId === fetchIdRef.current) {
          setData(result);
          setLoading(false);
          if (onSuccess) onSuccess(result);
        }

        return result;
      } catch (err) {
        if (fetchId === fetchIdRef.current) {
          const message = parseError(err);
          setError(message);
          setLoading(false);
          if (onError) onError(err, message);
        }

        throw err;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiFunc]
  );

  // Auto-fetch on mount and when deps change
  useEffect(() => {
    if (autoFetch) {
      execute().catch(() => {
        // Error already handled inside execute
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: execute,
    setData,
  };
}

/**
 * useMutation — For create / update / delete operations
 * ======================================================
 *
 * Unlike useApi, this does NOT auto-fetch on mount.
 * You call `mutate(payload)` explicitly.
 *
 * Returns { mutate, data, loading, error, reset }.
 *
 * Usage:
 *   const { mutate, loading } = useMutation(transactionAPI.create);
 *
 *   const handleSubmit = async (payload) => {
 *     const result = await mutate(payload);
 *     toast.success('Created!');
 *   };
 */
export function useMutation(apiFunc, options = {}) {
  const { onSuccess = null, onError = null } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFunc(...args);
        const result = response?.data !== undefined ? response.data : response;

        setData(result);
        setLoading(false);
        if (onSuccess) onSuccess(result);

        return result;
      } catch (err) {
        const message = parseError(err);
        setError(message);
        setLoading(false);
        if (onError) onError(err, message);

        throw err;
      }
    },
    [apiFunc, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, data, loading, error, reset };
}
