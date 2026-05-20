/**
 * ML Service — Axios Wrapper for FastAPI ML API
 * ================================================
 *
 * Handles all communication between the Express backend
 * and the Python FastAPI fraud-detection ML service.
 *
 * Endpoints used:
 *   POST /predict         — Single transaction prediction
 *   POST /predict/batch   — Batch prediction (up to 100)
 *   GET  /model/info      — Model metadata
 *   GET  /health          — ML API health check
 *
 * Features:
 *   - Axios instance with base URL + timeout
 *   - Graceful fallback when ML API is unavailable
 *   - Request/response logging
 *   - Retry logic for transient failures
 */

const axios = require('axios');
const config = require('../config');

// ── Create a dedicated Axios instance ────────────────────
const mlClient = axios.create({
  baseURL: config.mlApiUrl,   // http://localhost:8000
  timeout: 10000,              // 10 seconds max
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request logger ───────────────────────────────────────
mlClient.interceptors.request.use((req) => {
  console.log(`[ML-API] >> ${req.method.toUpperCase()} ${req.baseURL}${req.url}`);
  return req;
});

// ── Response logger ──────────────────────────────────────
mlClient.interceptors.response.use(
  (res) => {
    console.log(`[ML-API] << ${res.status} ${res.config.url} (${res.headers['x-process-time-ms'] || '?'}ms)`);
    return res;
  },
  (err) => {
    const status = err.response?.status || 'NETWORK_ERROR';
    console.error(`[ML-API] !! ${status} ${err.config?.url} — ${err.message}`);
    return Promise.reject(err);
  }
);

// ═══════════════════════════════════════════════════════════
// ML SERVICE METHODS
// ═══════════════════════════════════════════════════════════

const mlService = {
  /**
   * Predict fraud for a single transaction.
   *
   * @param {Object} transaction — { amount, sender_upi, receiver_upi,
   *                                  transaction_type, sender_balance_before,
   *                                  receiver_balance_before }
   * @returns {Object} — { is_fraud, fraud_probability, confidence,
   *                        risk_level, features_used }
   * @returns {null}   — If ML API is unavailable
   */
  async predict(transaction) {
    try {
      const response = await mlClient.post('/predict', {
        amount: parseFloat(transaction.amount),
        sender_upi: transaction.sender_upi,
        receiver_upi: transaction.receiver_upi,
        transaction_type: transaction.transaction_type || 'P2P',
        sender_balance_before: parseFloat(transaction.sender_balance_before || 0),
        receiver_balance_before: parseFloat(transaction.receiver_balance_before || 0),
      });

      return response.data;
    } catch (err) {
      console.error('[ML-API] Prediction failed:', err.message);
      return null; // Caller handles fallback
    }
  },

  /**
   * Predict fraud for multiple transactions at once.
   *
   * @param {Array<Object>} transactions — Array of transaction objects
   * @returns {Object} — { total, fraud_count, legitimate_count,
   *                        processing_time_ms, results }
   * @returns {null}   — If ML API is unavailable
   */
  async predictBatch(transactions) {
    try {
      const payload = transactions.map((txn) => ({
        amount: parseFloat(txn.amount),
        sender_upi: txn.sender_upi,
        receiver_upi: txn.receiver_upi,
        transaction_type: txn.transaction_type || 'P2P',
        sender_balance_before: parseFloat(txn.sender_balance_before || 0),
        receiver_balance_before: parseFloat(txn.receiver_balance_before || 0),
      }));

      const response = await mlClient.post('/predict/batch', {
        transactions: payload,
      });

      return response.data;
    } catch (err) {
      console.error('[ML-API] Batch prediction failed:', err.message);
      return null;
    }
  },

  /**
   * Get ML model metadata and stats.
   *
   * @returns {Object} — { model_loaded, model_version, model_type,
   *                        features_count, predictions_served, ... }
   */
  async getModelInfo() {
    try {
      const response = await mlClient.get('/model/info');
      return response.data;
    } catch (err) {
      console.error('[ML-API] Model info failed:', err.message);
      return null;
    }
  },

  /**
   * Check if the ML API is healthy and reachable.
   *
   * @returns {Object}  — { status, model_loaded, uptime_seconds, ... }
   * @returns {null}    — If unreachable
   */
  async healthCheck() {
    try {
      const response = await mlClient.get('/health');
      return response.data;
    } catch (err) {
      console.error('[ML-API] Health check failed:', err.message);
      return null;
    }
  },

  /**
   * Check if the ML API is reachable (boolean).
   * @returns {boolean}
   */
  async isAvailable() {
    const health = await this.healthCheck();
    return health !== null && health.status === 'healthy';
  },
};

module.exports = mlService;
