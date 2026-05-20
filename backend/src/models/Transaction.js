/**
 * Transaction Model (v4.0) — Prisma-based CRUD + Workflow Helpers
 * ================================================================
 *
 * Upgraded with:
 *   - status and risk_level filters on findAll()
 *   - Transaction count by sender (for rapid-txn detection)
 *   - Status override for create() (COMPLETED/FLAGGED/BLOCKED)
 *   - Enhanced dashboard stats with risk breakdown
 */

const { prisma } = require('../config/database');

const Transaction = {
  /**
   * Get all transactions with optional filtering & pagination.
   *
   * Filters:
   *   - is_fraud    — true/false
   *   - risk_level  — LOW, MEDIUM, HIGH
   *   - status      — PENDING, COMPLETED, FAILED, FLAGGED, BLOCKED
   *   - search      — matches senderUpi, receiverUpi, or transactionId
   */
  async findAll({ is_fraud, risk_level, status, search, limit = 50, offset = 0 } = {}) {
    const where = {};

    if (is_fraud !== undefined) {
      where.isFraud = is_fraud;
    }

    if (risk_level) {
      where.riskLevel = risk_level;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { senderUpi: { contains: search, mode: 'insensitive' } },
        { receiverUpi: { contains: search, mode: 'insensitive' } },
        { transactionId: { contains: search, mode: 'insensitive' } },
      ];
    }

    return prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: { select: { id: true, name: true, upiId: true } },
        receiver: { select: { id: true, name: true, upiId: true } },
      },
    });
  },

  /**
   * Find a single transaction by primary key (includes sender, receiver, alerts).
   */
  async findById(id) {
    return prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        sender: { select: { id: true, name: true, upiId: true, email: true } },
        receiver: { select: { id: true, name: true, upiId: true, email: true } },
        alerts: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            severity: true,
            title: true,
            isRead: true,
            resolved: true,
            createdAt: true,
          },
        },
      },
    });
  },

  /**
   * Find by transaction ID string (e.g. TXN20240815001).
   */
  async findByTransactionId(transactionId) {
    return prisma.transaction.findUnique({
      where: { transactionId },
      include: {
        sender: { select: { id: true, name: true, upiId: true } },
        receiver: { select: { id: true, name: true, upiId: true } },
      },
    });
  },

  /**
   * Create a new transaction record.
   *
   * The `status` field is now driven by the fraud prediction:
   *   - COMPLETED  — legitimate transaction
   *   - FLAGGED    — fraud probability >= 0.5
   *   - BLOCKED    — fraud probability >= 0.85
   *   - FAILED     — insufficient funds
   */
  async create(data) {
    return prisma.transaction.create({
      data: {
        transactionId: data.transaction_id,
        senderUpi: data.sender_upi,
        receiverUpi: data.receiver_upi,
        amount: data.amount,
        transactionType: data.transaction_type || 'P2P',
        isFraud: data.is_fraud || false,
        fraudProbability: data.fraud_probability || 0,
        riskLevel: data.risk_level || 'LOW',
        senderBalanceBefore: data.sender_balance_before || 0,
        receiverBalanceBefore: data.receiver_balance_before || 0,
        status: data.status || (data.is_fraud ? 'FLAGGED' : 'COMPLETED'),
        // Link to users if they exist in the system
        ...(data.sender_id && { sender: { connect: { id: data.sender_id } } }),
        ...(data.receiver_id && { receiver: { connect: { id: data.receiver_id } } }),
      },
      include: {
        sender: { select: { id: true, name: true, upiId: true } },
        receiver: { select: { id: true, name: true, upiId: true } },
      },
    });
  },

  /**
   * Update a transaction (e.g., change status after analyst review).
   */
  async update(id, data) {
    return prisma.transaction.update({
      where: { id: parseInt(id) },
      data,
      include: {
        sender: { select: { id: true, name: true, upiId: true } },
        receiver: { select: { id: true, name: true, upiId: true } },
      },
    });
  },

  /**
   * Delete a transaction (admin only).
   */
  async delete(id) {
    return prisma.transaction.delete({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get enhanced dashboard statistics.
   *
   * Returns:
   *   - Total, fraud, legitimate counts
   *   - Total amount processed
   *   - Fraud rate percentage
   *   - Breakdown by risk level (LOW, MEDIUM, HIGH)
   *   - Breakdown by status (COMPLETED, FLAGGED, BLOCKED, FAILED)
   *   - Daily trend (last 7 days)
   */
  async getStats() {
    const [
      totalAgg,
      fraudAgg,
      legitAgg,
      amountAgg,
      riskBreakdown,
      statusBreakdown,
      dailyTxns,
    ] = await Promise.all([
      // Total count
      prisma.transaction.count(),

      // Fraud count
      prisma.transaction.count({ where: { isFraud: true } }),

      // Legitimate count
      prisma.transaction.count({ where: { isFraud: false } }),

      // Total amount
      prisma.transaction.aggregate({ _sum: { amount: true } }),

      // Risk level breakdown
      prisma.transaction.groupBy({
        by: ['riskLevel'],
        _count: { _all: true },
      }),

      // Status breakdown
      prisma.transaction.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      // Daily breakdown (last 7 days)
      prisma.$queryRaw`
        SELECT
          TO_CHAR(created_at, 'Dy') AS date,
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE is_fraud = true)::int AS fraud
        FROM transactions
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at), TO_CHAR(created_at, 'Dy')
        ORDER BY DATE(created_at)
      `,
    ]);

    const totalTransactions = totalAgg;
    const fraudCount = fraudAgg;
    const fraudRate =
      totalTransactions > 0
        ? parseFloat(((fraudCount / totalTransactions) * 100).toFixed(2))
        : 0;

    // Format risk breakdown: { LOW: 10, MEDIUM: 5, HIGH: 2 }
    const riskStats = {};
    riskBreakdown.forEach((r) => {
      riskStats[r.riskLevel] = r._count._all;
    });

    // Format status breakdown: { COMPLETED: 12, FLAGGED: 3, BLOCKED: 1 }
    const statusStats = {};
    statusBreakdown.forEach((s) => {
      statusStats[s.status] = s._count._all;
    });

    return {
      totalTransactions,
      fraudCount,
      legitimateCount: legitAgg,
      totalAmount: Number(amountAgg._sum.amount || 0),
      fraudRate,
      riskBreakdown: riskStats,
      statusBreakdown: statusStats,
      recentDaily: dailyTxns,
    };
  },
};

module.exports = Transaction;
