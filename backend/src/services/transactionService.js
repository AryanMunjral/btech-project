/**
 * Transaction Service — Full Workflow Orchestration
 * ====================================================
 *
 * THE MAIN WORKFLOW ENGINE. Orchestrates the complete
 * end-to-end fraud detection transaction pipeline:
 *
 *   Step 1: Validate sender & receiver exist (optional)
 *   Step 2: Check sender has sufficient balance
 *   Step 3: Call ML API for fraud prediction
 *   Step 4: Store transaction in database
 *   Step 5: Update sender/receiver balances
 *   Step 6: Create fraud alerts if needed
 *   Step 7: Return complete result to caller
 *
 * This service ties together:
 *   - User model (balance lookup + update)
 *   - Transaction model (CRUD)
 *   - Fraud service (ML prediction + alert creation)
 *   - ML service (FastAPI communication)
 *
 * The controller stays thin — it only parses input and calls this service.
 */

const { v4: uuidv4 } = require('uuid');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const fraudService = require('./fraudService');
const mlService = require('./mlService');
const { prisma } = require('../config/database');

const transactionService = {
  /**
   * Process a new UPI transaction through the fraud detection pipeline.
   *
   * This is the MAIN workflow method. The full flow:
   *
   *   1. Look up sender/receiver by UPI ID (if they exist in our system)
   *   2. Check sender balance (if sender is a registered user)
   *   3. Call ML API for fraud prediction
   *   4. Create the transaction record in DB
   *   5. Update balances (deduct from sender, add to receiver)
   *   6. Generate alerts if fraud/suspicious
   *   7. Return the full result
   *
   * @param {Object} txnData — {
   *   sender_upi, receiver_upi, amount,
   *   transaction_type, sender_balance_before,
   *   receiver_balance_before
   * }
   * @param {number|null} userId — Authenticated user's ID
   * @returns {Object} — { transaction, prediction, alerts, balance_updated }
   */
  async processTransaction(txnData, userId = null) {
    const {
      sender_upi,
      receiver_upi,
      amount,
      transaction_type = 'P2P',
      sender_balance_before,
      receiver_balance_before,
    } = txnData;

    const parsedAmount = parseFloat(amount);

    console.log(
      `[TxnService] Processing: ₹${parsedAmount.toLocaleString('en-IN')} ` +
      `from ${sender_upi} → ${receiver_upi}`
    );

    // ── Step 1: Look up sender & receiver ────────────────
    const sender = await User.findByUpiId(sender_upi);
    const receiver = await User.findByUpiId(receiver_upi);

    // Use real balances if users exist, otherwise use provided values
    const actualSenderBalance = sender
      ? sender.balance
      : parseFloat(sender_balance_before || 0);
    const actualReceiverBalance = receiver
      ? receiver.balance
      : parseFloat(receiver_balance_before || 0);

    // ── Step 2: Check sufficient balance ─────────────────
    let insufficientFunds = false;
    if (sender && sender.balance < parsedAmount) {
      console.warn(
        `[TxnService] Insufficient funds: sender ${sender_upi} ` +
        `has ₹${sender.balance}, needs ₹${parsedAmount}`
      );
      insufficientFunds = true;
    }

    // ── Step 3: Call ML API for fraud prediction ─────────
    const prediction = await fraudService.analyzeFraud({
      amount: parsedAmount,
      sender_upi,
      receiver_upi,
      transaction_type,
      sender_balance_before: actualSenderBalance,
      receiver_balance_before: actualReceiverBalance,
    });

    // Override status if insufficient funds
    if (insufficientFunds && !prediction.is_fraud) {
      prediction.status = 'FAILED';
    }

    // ── Step 4: Create the transaction record ────────────
    const transaction = await Transaction.create({
      transaction_id: this._generateTxnId(),
      sender_upi,
      receiver_upi,
      amount: parsedAmount,
      transaction_type,
      is_fraud: prediction.is_fraud,
      fraud_probability: prediction.fraud_probability,
      risk_level: prediction.risk_level,
      sender_balance_before: actualSenderBalance,
      receiver_balance_before: actualReceiverBalance,
      sender_id: sender?.id || null,
      receiver_id: receiver?.id || null,
      status: prediction.status,
    });

    console.log(
      `[TxnService] Transaction ${transaction.transactionId} created ` +
      `| fraud=${prediction.is_fraud} | prob=${prediction.fraud_probability} ` +
      `| status=${prediction.status} | method=${prediction.method}`
    );

    // ── Step 5: Update balances (only for COMPLETED transactions) ──
    let balanceUpdated = false;

    if (prediction.status === 'COMPLETED' && !insufficientFunds) {
      balanceUpdated = await this._updateBalances(
        sender, receiver, parsedAmount
      );
    }

    // ── Step 6: Create fraud alerts ──────────────────────
    const alerts = await fraudService.createAlerts(
      transaction, prediction, userId
    );

    // ── Step 7: Return the complete result ───────────────
    return {
      transaction,
      prediction: {
        is_fraud: prediction.is_fraud,
        fraud_probability: prediction.fraud_probability,
        risk_level: prediction.risk_level,
        confidence: prediction.confidence,
        method: prediction.method,
        status: prediction.status,
      },
      alerts: alerts.map((a) => ({
        id: a.id,
        type: a.type,
        severity: a.severity,
        title: a.title,
      })),
      balance_updated: balanceUpdated,
    };
  },

  /**
   * Re-check an existing transaction against the ML model.
   *
   * Useful when:
   *   - The ML model has been retrained
   *   - An analyst wants to re-score a flagged transaction
   *
   * @param {string|number} transactionId — Transaction DB ID
   * @returns {Object} — Updated prediction result
   */
  async recheckTransaction(transactionId) {
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    // Re-run fraud analysis
    const prediction = await fraudService.analyzeFraud({
      amount: transaction.amount,
      sender_upi: transaction.senderUpi,
      receiver_upi: transaction.receiverUpi,
      transaction_type: transaction.transactionType,
      sender_balance_before: transaction.senderBalanceBefore,
      receiver_balance_before: transaction.receiverBalanceBefore,
    });

    // Update the transaction record with new prediction
    const updated = await Transaction.update(transactionId, {
      isFraud: prediction.is_fraud,
      fraudProbability: prediction.fraud_probability,
      riskLevel: prediction.risk_level,
      status: prediction.status,
    });

    console.log(
      `[TxnService] Re-checked ${transaction.transactionId}: ` +
      `fraud=${prediction.is_fraud} → ${prediction.status}`
    );

    return {
      transaction: updated,
      prediction,
      message: `Transaction re-scored: ${prediction.risk_level} risk (${prediction.method})`,
    };
  },

  /**
   * Get ML service status for the health check endpoint.
   */
  async getMLStatus() {
    const [health, modelInfo] = await Promise.all([
      mlService.healthCheck(),
      mlService.getModelInfo(),
    ]);

    return {
      ml_api_available: health !== null,
      ml_api_health: health,
      model_info: modelInfo,
    };
  },

  // ═══════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════

  /**
   * Generate a unique transaction ID.
   * Format: TXN + timestamp + 8-char UUID
   * Example: TXN1716835200000AB3C4D5E
   */
  _generateTxnId() {
    return `TXN${Date.now()}${uuidv4().slice(0, 8).toUpperCase()}`;
  },

  /**
   * Update sender and receiver balances after a successful transaction.
   *
   * Uses a Prisma interactive transaction to ensure atomicity:
   *   - Sender balance decreases
   *   - Receiver balance increases
   *   - If either fails, both roll back
   *
   * @param {Object|null} sender   — User record or null
   * @param {Object|null} receiver — User record or null
   * @param {number}      amount   — Transaction amount
   * @returns {boolean} — Whether balances were updated
   */
  async _updateBalances(sender, receiver, amount) {
    try {
      if (!sender && !receiver) return false;

      await prisma.$transaction(async (tx) => {
        // Deduct from sender
        if (sender) {
          await tx.user.update({
            where: { id: sender.id },
            data: { balance: { decrement: amount } },
          });
          console.log(
            `[TxnService] Sender ${sender.upiId}: -₹${amount.toLocaleString('en-IN')} ` +
            `(was ₹${sender.balance.toLocaleString('en-IN')})`
          );
        }

        // Credit to receiver
        if (receiver) {
          await tx.user.update({
            where: { id: receiver.id },
            data: { balance: { increment: amount } },
          });
          console.log(
            `[TxnService] Receiver ${receiver.upiId}: +₹${amount.toLocaleString('en-IN')} ` +
            `(was ₹${receiver.balance.toLocaleString('en-IN')})`
          );
        }
      });

      return true;
    } catch (err) {
      console.error('[TxnService] Balance update failed:', err.message);
      return false;
    }
  },
};

module.exports = transactionService;
