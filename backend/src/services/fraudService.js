/**
 * Fraud Service — Scoring Logic + Alert Creation
 * =================================================
 *
 * Central fraud-analysis engine that:
 *   1. Calls the ML API for prediction (via mlService)
 *   2. Falls back to rule-based scoring if ML API is down
 *   3. Determines transaction status (COMPLETED / FLAGGED / BLOCKED)
 *   4. Creates appropriate alerts based on risk level
 *   5. Detects rapid-fire transactions per sender
 *
 * This service is the BRAIN between the transaction flow
 * and the ML model — all fraud logic lives here.
 */

const mlService = require('./mlService');
const Alert = require('../models/Alert');
const { prisma } = require('../config/database');

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const THRESHOLDS = {
  FRAUD_CUTOFF: 0.5,           // >= 0.5 = fraud
  SUSPICIOUS_CUTOFF: 0.3,      // >= 0.3 = suspicious
  HIGH_AMOUNT: 50000,          // High-value txn threshold (INR)
  VERY_HIGH_AMOUNT: 100000,    // Very-high-value txn threshold (INR)
  RAPID_TXN_WINDOW_MIN: 5,    // Time window for rapid-fire detection
  RAPID_TXN_COUNT: 3,         // Txns in window to trigger rapid alert
  BLOCK_PROBABILITY: 0.85,     // Auto-block above this probability
};

// ═══════════════════════════════════════════════════════════
// FRAUD SERVICE
// ═══════════════════════════════════════════════════════════

const fraudService = {
  /**
   * Analyze a transaction for fraud.
   *
   * Flow:
   *   1. Call ML API → get prediction
   *   2. If ML API is down → use rule-based fallback
   *   3. Determine transaction status
   *   4. Return prediction result
   *
   * @param {Object} txnData — { amount, sender_upi, receiver_upi,
   *                              transaction_type, sender_balance_before,
   *                              receiver_balance_before }
   * @returns {Object} — { is_fraud, fraud_probability, risk_level,
   *                        confidence, method, status }
   */
  async analyzeFraud(txnData) {
    // Step 1: Try ML API prediction
    const mlResult = await mlService.predict(txnData);

    let prediction;

    if (mlResult) {
      // ML API responded successfully
      prediction = {
        is_fraud: mlResult.is_fraud,
        fraud_probability: mlResult.fraud_probability,
        risk_level: mlResult.risk_level,
        confidence: mlResult.confidence,
        features_used: mlResult.features_used,
        method: 'xgboost',
      };
    } else {
      // Step 2: ML API unavailable — use rule-based fallback
      console.warn('[FraudService] ML API unavailable, using rule-based fallback');
      prediction = this._ruleBased(txnData);
    }

    // Step 3: Determine transaction status
    prediction.status = this._determineStatus(prediction);

    return prediction;
  },

  /**
   * Create appropriate fraud alerts after a transaction is stored.
   *
   * Alert types created:
   *   - FRAUD_DETECTED     — probability >= 0.5 (CRITICAL/HIGH severity)
   *   - SUSPICIOUS_ACTIVITY — probability 0.3–0.5 (MEDIUM severity)
   *   - HIGH_AMOUNT         — amount > 50,000 (MEDIUM severity)
   *   - RAPID_TRANSACTIONS  — 3+ txns from same sender in 5 min (HIGH)
   *
   * @param {Object} transaction — Saved Prisma transaction record
   * @param {Object} prediction  — Result from analyzeFraud()
   * @param {number|null} userId — Authenticated user ID (if available)
   * @returns {Array<Object>}    — List of created alerts
   */
  async createAlerts(transaction, prediction, userId = null) {
    const alerts = [];
    const amount = transaction.amount;
    const senderUpi = transaction.senderUpi;
    const txnId = transaction.transactionId;
    const probability = prediction.fraud_probability;

    // ── Alert 1: FRAUD_DETECTED ──────────────────────────
    if (prediction.is_fraud) {
      const severity = probability >= THRESHOLDS.BLOCK_PROBABILITY
        ? 'CRITICAL'
        : 'HIGH';

      const alert = await Alert.create({
        type: 'FRAUD_DETECTED',
        severity,
        title: `Fraud Detected: ₹${amount.toLocaleString('en-IN')} from ${senderUpi}`,
        message:
          `Transaction ${txnId} flagged as FRAUDULENT.\n` +
          `Probability: ${(probability * 100).toFixed(1)}%\n` +
          `Risk Level: ${prediction.risk_level}\n` +
          `Method: ${prediction.method}\n` +
          `Amount: ₹${amount.toLocaleString('en-IN')}\n` +
          `Sender: ${senderUpi} → Receiver: ${transaction.receiverUpi}\n` +
          `Status: ${prediction.status}`,
        userId: userId,
        transactionId: transaction.id,
      });
      alerts.push(alert);
    }

    // ── Alert 2: SUSPICIOUS_ACTIVITY ─────────────────────
    else if (probability >= THRESHOLDS.SUSPICIOUS_CUTOFF) {
      const alert = await Alert.create({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        title: `Suspicious Activity: ₹${amount.toLocaleString('en-IN')} from ${senderUpi}`,
        message:
          `Transaction ${txnId} has elevated risk.\n` +
          `Probability: ${(probability * 100).toFixed(1)}%\n` +
          `Monitoring recommended.`,
        userId: userId,
        transactionId: transaction.id,
      });
      alerts.push(alert);
    }

    // ── Alert 3: HIGH_AMOUNT (independent of fraud score) ─
    if (amount >= THRESHOLDS.HIGH_AMOUNT && !prediction.is_fraud) {
      const alert = await Alert.create({
        type: 'HIGH_AMOUNT',
        severity: amount >= THRESHOLDS.VERY_HIGH_AMOUNT ? 'HIGH' : 'MEDIUM',
        title: `High-Value Transaction: ₹${amount.toLocaleString('en-IN')}`,
        message:
          `Large transaction detected.\n` +
          `Amount: ₹${amount.toLocaleString('en-IN')}\n` +
          `Sender: ${senderUpi} → Receiver: ${transaction.receiverUpi}\n` +
          `Fraud Probability: ${(probability * 100).toFixed(1)}%`,
        userId: userId,
        transactionId: transaction.id,
      });
      alerts.push(alert);
    }

    // ── Alert 4: RAPID_TRANSACTIONS ──────────────────────
    const isRapid = await this._checkRapidTransactions(senderUpi);
    if (isRapid) {
      const alert = await Alert.create({
        type: 'RAPID_TRANSACTIONS',
        severity: 'HIGH',
        title: `Rapid Transactions from ${senderUpi}`,
        message:
          `${THRESHOLDS.RAPID_TXN_COUNT}+ transactions detected from ` +
          `${senderUpi} within ${THRESHOLDS.RAPID_TXN_WINDOW_MIN} minutes.\n` +
          `Latest: ${txnId} for ₹${amount.toLocaleString('en-IN')}\n` +
          `This pattern may indicate automated fraud or account compromise.`,
        userId: userId,
        transactionId: transaction.id,
      });
      alerts.push(alert);
    }

    if (alerts.length > 0) {
      console.log(
        `[FraudService] Created ${alerts.length} alert(s) for ${txnId}: ` +
        alerts.map((a) => a.type).join(', ')
      );
    }

    return alerts;
  },

  // ═══════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════

  /**
   * Rule-based fallback scoring (when ML API is unavailable).
   * Mirrors the logic in FastAPI's fraud_detector._rule_based_predict().
   */
  _ruleBased(txnData) {
    const amount = parseFloat(txnData.amount);
    const senderBal = parseFloat(txnData.sender_balance_before || 0);
    let score = 0.0;

    // Very high amount
    if (amount > 50000) score += 0.30;
    else if (amount > 10000) score += 0.12;

    // Balance drain — spending more than you have
    if (senderBal > 0 && amount > senderBal) score += 0.25;

    // Spending ratio
    const ratio = senderBal > 0 ? amount / senderBal : 10.0;
    if (ratio > 0.9) score += 0.20;
    else if (ratio > 0.5) score += 0.08;

    // Night hours (1 AM – 5 AM)
    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 5) score += 0.10;

    // Round amount pattern
    if (amount % 1000 === 0 || amount % 500 === 0) score += 0.03;

    // Clamp to [0, 1]
    score = Math.min(Math.max(score, 0), 1);

    const is_fraud = score >= THRESHOLDS.FRAUD_CUTOFF;

    let risk_level = 'LOW';
    if (score >= 0.7) risk_level = 'HIGH';
    else if (score >= 0.3) risk_level = 'MEDIUM';

    return {
      is_fraud,
      fraud_probability: parseFloat(score.toFixed(4)),
      risk_level,
      confidence: parseFloat(Math.max(score, 1 - score).toFixed(4)),
      features_used: null,
      method: 'rule-based',
    };
  },

  /**
   * Determine transaction status based on prediction.
   *
   *   BLOCKED   — probability >= 0.85 (auto-blocked, needs review)
   *   FLAGGED   — probability >= 0.50 (marked as fraud)
   *   COMPLETED — probability < 0.50  (legitimate)
   */
  _determineStatus(prediction) {
    if (prediction.fraud_probability >= THRESHOLDS.BLOCK_PROBABILITY) {
      return 'BLOCKED';
    }
    if (prediction.is_fraud) {
      return 'FLAGGED';
    }
    return 'COMPLETED';
  },

  /**
   * Check if a sender has made too many transactions recently.
   *
   * Queries the DB for transactions from this sender_upi
   * within the last RAPID_TXN_WINDOW_MIN minutes. If the count
   * exceeds RAPID_TXN_COUNT, returns true.
   */
  async _checkRapidTransactions(senderUpi) {
    try {
      const windowStart = new Date(
        Date.now() - THRESHOLDS.RAPID_TXN_WINDOW_MIN * 60 * 1000
      );

      const recentCount = await prisma.transaction.count({
        where: {
          senderUpi: senderUpi,
          createdAt: { gte: windowStart },
        },
      });

      return recentCount >= THRESHOLDS.RAPID_TXN_COUNT;
    } catch (err) {
      console.error('[FraudService] Rapid-txn check failed:', err.message);
      return false;
    }
  },
};

module.exports = fraudService;
