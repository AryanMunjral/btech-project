/**
 * Transaction Routes (v4.0) — Full Fraud Detection Workflow
 * ===========================================================
 *
 * All routes require authentication.
 *
 * Endpoints:
 *   GET    /api/transactions            — List (any user)
 *   GET    /api/transactions/ml-status  — ML API health (any user)
 *   GET    /api/transactions/:id        — Single txn (any user)
 *   POST   /api/transactions            — Create + fraud check (any user)
 *   POST   /api/transactions/batch      — Batch create (any user)
 *   POST   /api/transactions/:id/recheck — Re-score (ADMIN/ANALYST)
 *   PUT    /api/transactions/:id        — Update (ADMIN/ANALYST)
 *   DELETE /api/transactions/:id        — Delete (ADMIN only)
 */

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createTransactionSchema,
  updateTransactionSchema,
  batchTransactionSchema,
} = require('../validators/transactionSchemas');

// All transaction routes require authentication
router.use(authenticate);

// ── Any logged-in user ───────────────────────────────────

// List transactions (with filters: is_fraud, risk_level, status, search)
router.get('/', transactionController.getAll);

// ML API health status
router.get('/ml-status', transactionController.mlStatus);

// Single transaction detail
router.get('/:id', transactionController.getById);

// Create a single transaction → full fraud detection workflow
router.post(
  '/',
  validate(createTransactionSchema),
  transactionController.create
);

// Batch create transactions → each goes through fraud pipeline
router.post(
  '/batch',
  validate(batchTransactionSchema),
  transactionController.createBatch
);

// ── ADMIN + ANALYST only ─────────────────────────────────

// Re-score an existing transaction against the ML model
router.post(
  '/:id/recheck',
  authorize('ADMIN', 'ANALYST'),
  transactionController.recheck
);

// Update transaction fields (status, risk level, etc.)
router.put(
  '/:id',
  authorize('ADMIN', 'ANALYST'),
  validate(updateTransactionSchema),
  transactionController.update
);

// ── ADMIN only ───────────────────────────────────────────

// Delete a transaction
router.delete('/:id', authorize('ADMIN'), transactionController.delete);

module.exports = router;
