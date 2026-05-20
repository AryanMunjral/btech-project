/**
 * Transaction Controller (v4.0 — Service Layer)
 * ================================================
 *
 * Thin controller that delegates to the service layer.
 * Handles HTTP concerns only (parsing, status codes, responses).
 *
 * Endpoints:
 *   GET    /api/transactions          — List with filters
 *   GET    /api/transactions/:id      — Single transaction
 *   POST   /api/transactions          — Create + fraud check
 *   POST   /api/transactions/batch    — Batch create + fraud check
 *   POST   /api/transactions/:id/recheck — Re-score existing txn
 *   PUT    /api/transactions/:id      — Update (admin/analyst)
 *   DELETE /api/transactions/:id      — Delete (admin)
 *   GET    /api/transactions/ml-status — ML API health
 */

const Transaction = require('../models/Transaction');
const transactionService = require('../services/transactionService');

const transactionController = {
  // ═══════════════════════════════════════════════════════════
  // GET /api/transactions — List Transactions
  // ═══════════════════════════════════════════════════════════

  async getAll(req, res, next) {
    try {
      const { is_fraud, search, limit, offset, risk_level, status } = req.query;

      const filters = {
        is_fraud: is_fraud !== undefined ? is_fraud === 'true' : undefined,
        search,
        risk_level,
        status,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
      };

      const transactions = await Transaction.findAll(filters);

      res.json({
        success: true,
        count: transactions.length,
        filters: {
          is_fraud: filters.is_fraud,
          search: filters.search || null,
          risk_level: filters.risk_level || null,
          status: filters.status || null,
        },
        transactions,
      });
    } catch (err) {
      next(err);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // GET /api/transactions/:id — Single Transaction
  // ═══════════════════════════════════════════════════════════

  async getById(req, res, next) {
    try {
      const transaction = await Transaction.findById(req.params.id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }

      res.json({ success: true, transaction });
    } catch (err) {
      next(err);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // POST /api/transactions — Create Transaction + Fraud Check
  // ═══════════════════════════════════════════════════════════
  //
  // THE MAIN WORKFLOW:
  //   1. User submits transaction
  //   2. Backend stores transaction
  //   3. Backend calls FastAPI ML service
  //   4. ML service returns fraud score
  //   5. Backend updates transaction status
  //   6. Fraud alerts are created if needed
  //
  // ═══════════════════════════════════════════════════════════

  async create(req, res, next) {
    try {
      // req.validated is set by the Zod validate() middleware
      const txnData = req.validated || req.body;
      const userId = req.user?.id || null;

      // Delegate to the service layer — all 7 steps happen here
      const result = await transactionService.processTransaction(
        txnData, userId
      );

      // Choose status code based on outcome
      const statusCode = result.prediction.is_fraud ? 201 : 201;

      res.status(statusCode).json({
        success: true,
        message: result.prediction.is_fraud
          ? `Transaction FLAGGED as fraudulent (${result.prediction.risk_level} risk)`
          : 'Transaction processed successfully',
        transaction: result.transaction,
        prediction: result.prediction,
        alerts: result.alerts,
        balance_updated: result.balance_updated,
      });
    } catch (err) {
      next(err);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // POST /api/transactions/batch — Batch Create + Fraud Check
  // ═══════════════════════════════════════════════════════════

  async createBatch(req, res, next) {
    try {
      const { transactions } = req.validated || req.body;
      const userId = req.user?.id || null;

      const startTime = Date.now();
      const results = [];
      let fraudCount = 0;
      let errorCount = 0;

      // Process each transaction through the full pipeline
      for (let i = 0; i < transactions.length; i++) {
        try {
          const result = await transactionService.processTransaction(
            transactions[i], userId
          );
          if (result.prediction.is_fraud) fraudCount++;
          results.push({
            index: i,
            success: true,
            transaction_id: result.transaction.transactionId,
            is_fraud: result.prediction.is_fraud,
            fraud_probability: result.prediction.fraud_probability,
            risk_level: result.prediction.risk_level,
            status: result.prediction.status,
            alerts_created: result.alerts.length,
          });
        } catch (err) {
          errorCount++;
          results.push({
            index: i,
            success: false,
            error: err.message,
          });
        }
      }

      const elapsed = Date.now() - startTime;

      res.status(201).json({
        success: true,
        summary: {
          total: transactions.length,
          processed: transactions.length - errorCount,
          fraud_detected: fraudCount,
          legitimate: transactions.length - errorCount - fraudCount,
          errors: errorCount,
          processing_time_ms: elapsed,
        },
        results,
      });
    } catch (err) {
      next(err);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // POST /api/transactions/:id/recheck — Re-score Transaction
  // ═══════════════════════════════════════════════════════════

  async recheck(req, res, next) {
    try {
      const result = await transactionService.recheckTransaction(req.params.id);

      res.json({
        success: true,
        message: result.message,
        transaction: result.transaction,
        prediction: result.prediction,
      });
    } catch (err) {
      if (err.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: err.message,
        });
      }
      next(err);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // GET /api/transactions/ml-status — ML Service Health
  // ═══════════════════════════════════════════════════════════

  async mlStatus(req, res, next) {
    try {
      const status = await transactionService.getMLStatus();

      res.json({
        success: true,
        ...status,
      });
    } catch (err) {
      next(err);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // PUT /api/transactions/:id — Update Transaction
  // ═══════════════════════════════════════════════════════════

  async update(req, res, next) {
    try {
      const data = req.validated || req.body;
      const transaction = await Transaction.update(req.params.id, data);

      res.json({
        success: true,
        message: 'Transaction updated successfully',
        transaction,
      });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }
      next(err);
    }
  },

  // ═══════════════════════════════════════════════════════════
  // DELETE /api/transactions/:id — Delete Transaction
  // ═══════════════════════════════════════════════════════════

  async delete(req, res, next) {
    try {
      await Transaction.delete(req.params.id);

      res.json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }
      next(err);
    }
  },
};

module.exports = transactionController;
