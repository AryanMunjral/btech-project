/**
 * Zod Validation Schemas for Transaction Routes
 * ================================================
 *
 * Validates request bodies BEFORE they reach the controller.
 * Used with the validate() middleware from middleware/validate.js
 *
 * Schemas:
 *   - createTransactionSchema  — POST /api/transactions
 *   - updateTransactionSchema  — PUT  /api/transactions/:id
 *   - batchTransactionSchema   — POST /api/transactions/batch
 *   - recheckTransactionSchema — POST /api/transactions/:id/recheck
 */

const { z } = require('zod');

// ── Valid UPI ID pattern: name@bank ──────────────────────
const upiIdPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

// ═══════════════════════════════════════════════════════════
// CREATE TRANSACTION
// ═══════════════════════════════════════════════════════════

const createTransactionSchema = z.object({
  sender_upi: z
    .string({ required_error: 'Sender UPI ID is required' })
    .min(3, 'Sender UPI ID must be at least 3 characters')
    .max(100)
    .regex(upiIdPattern, 'Invalid UPI ID format (e.g., user@paytm)')
    .trim(),

  receiver_upi: z
    .string({ required_error: 'Receiver UPI ID is required' })
    .min(3, 'Receiver UPI ID must be at least 3 characters')
    .max(100)
    .regex(upiIdPattern, 'Invalid UPI ID format (e.g., shop@ybl)')
    .trim(),

  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be greater than 0')
    .max(10000000, 'Amount cannot exceed ₹1 Crore (10,000,000)'),

  transaction_type: z
    .enum(['P2P', 'P2M', 'BILL', 'RECHARGE'], {
      errorMap: () => ({
        message: 'Transaction type must be one of: P2P, P2M, BILL, RECHARGE',
      }),
    })
    .default('P2P'),

  sender_balance_before: z
    .number()
    .min(0, 'Balance cannot be negative')
    .optional()
    .default(0),

  receiver_balance_before: z
    .number()
    .min(0, 'Balance cannot be negative')
    .optional()
    .default(0),
}).refine(
  (data) => data.sender_upi !== data.receiver_upi,
  {
    message: 'Sender and receiver UPI IDs must be different',
    path: ['receiver_upi'],
  }
);

// ═══════════════════════════════════════════════════════════
// UPDATE TRANSACTION (admin/analyst)
// ═══════════════════════════════════════════════════════════

const updateTransactionSchema = z.object({
  status: z
    .enum(['PENDING', 'COMPLETED', 'FAILED', 'FLAGGED', 'BLOCKED'])
    .optional(),

  isFraud: z.boolean().optional(),

  riskLevel: z
    .enum(['LOW', 'MEDIUM', 'HIGH'])
    .optional(),

  fraudProbability: z
    .number()
    .min(0)
    .max(1)
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// ═══════════════════════════════════════════════════════════
// BATCH TRANSACTION
// ═══════════════════════════════════════════════════════════

const singleTxnSchema = z.object({
  sender_upi: z
    .string()
    .min(3)
    .max(100)
    .regex(upiIdPattern, 'Invalid UPI ID format')
    .trim(),

  receiver_upi: z
    .string()
    .min(3)
    .max(100)
    .regex(upiIdPattern, 'Invalid UPI ID format')
    .trim(),

  amount: z.number().positive().max(10000000),

  transaction_type: z
    .enum(['P2P', 'P2M', 'BILL', 'RECHARGE'])
    .default('P2P'),

  sender_balance_before: z.number().min(0).optional().default(0),
  receiver_balance_before: z.number().min(0).optional().default(0),
});

const batchTransactionSchema = z.object({
  transactions: z
    .array(singleTxnSchema, {
      required_error: 'Transactions array is required',
    })
    .min(1, 'At least 1 transaction is required')
    .max(50, 'Maximum 50 transactions per batch'),
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  batchTransactionSchema,
};
