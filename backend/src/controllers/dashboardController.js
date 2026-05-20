/**
 * Dashboard Controller (v4.0)
 * =============================
 *
 * Returns combined statistics for the frontend dashboard:
 *   - Transaction stats (counts, amounts, fraud rate)
 *   - Risk level breakdown (LOW, MEDIUM, HIGH)
 *   - Status breakdown (COMPLETED, FLAGGED, BLOCKED, FAILED)
 *   - Alert stats (total, unread, critical)
 *   - ML API status (available, model loaded, predictions served)
 *   - Daily trend (last 7 days)
 */

const Transaction = require('../models/Transaction');
const Alert = require('../models/Alert');
const transactionService = require('../services/transactionService');

const dashboardController = {
  /**
   * GET /api/dashboard/stats
   * Returns the full dashboard data in a single API call.
   */
  async getStats(req, res, next) {
    try {
      // Run all stat queries + ML health check in parallel
      const [transactionStats, alertStats, mlStatus] = await Promise.all([
        Transaction.getStats(),
        Alert.getStats(),
        transactionService.getMLStatus(),
      ]);

      res.json({
        success: true,

        // Transaction overview
        totalTransactions: transactionStats.totalTransactions,
        fraudCount: transactionStats.fraudCount,
        legitimateCount: transactionStats.legitimateCount,
        totalAmount: transactionStats.totalAmount,
        fraudRate: transactionStats.fraudRate,

        // Breakdowns
        riskBreakdown: transactionStats.riskBreakdown,
        statusBreakdown: transactionStats.statusBreakdown,

        // Daily trend
        recentDaily: transactionStats.recentDaily,

        // Alerts
        alerts: alertStats,

        // ML API status
        mlService: {
          available: mlStatus.ml_api_available,
          model_loaded: mlStatus.ml_api_health?.model_loaded || false,
          model_version: mlStatus.ml_api_health?.model_version || 'unknown',
          predictions_served: mlStatus.ml_api_health?.predictions_served || 0,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = dashboardController;
