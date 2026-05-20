/**
 * Alert model — Prisma-based CRUD operations
 */

const { prisma } = require('../config/database');

const Alert = {
  /**
   * Get all alerts (paginated, filterable)
   */
  async findAll({ severity, isRead, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (severity) where.severity = severity;
    if (isRead !== undefined) where.isRead = isRead;

    return prisma.alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: { select: { id: true, name: true, upiId: true } },
        transaction: {
          select: {
            id: true,
            transactionId: true,
            amount: true,
            isFraud: true,
          },
        },
      },
    });
  },

  /**
   * Find alert by ID
   */
  async findById(id) {
    return prisma.alert.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { id: true, name: true, email: true, upiId: true } },
        transaction: true,
      },
    });
  },

  /**
   * Create a new alert
   */
  async create({ type, severity, title, message, userId, transactionId }) {
    return prisma.alert.create({
      data: {
        type,
        severity: severity || 'MEDIUM',
        title,
        message,
        ...(userId && { user: { connect: { id: userId } } }),
        ...(transactionId && {
          transaction: { connect: { id: transactionId } },
        }),
      },
      include: {
        user: { select: { id: true, name: true, upiId: true } },
        transaction: {
          select: { id: true, transactionId: true, amount: true },
        },
      },
    });
  },

  /**
   * Mark alert as read
   */
  async markAsRead(id) {
    return prisma.alert.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });
  },

  /**
   * Mark alert as resolved
   */
  async resolve(id) {
    return prisma.alert.update({
      where: { id: parseInt(id) },
      data: { resolved: true, isRead: true },
    });
  },

  /**
   * Bulk mark alerts as read
   */
  async markAllAsRead() {
    return prisma.alert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  },

  /**
   * Delete an alert
   */
  async delete(id) {
    return prisma.alert.delete({
      where: { id: parseInt(id) },
    });
  },

  /**
   * Get alert summary stats
   */
  async getStats() {
    const [total, unread, critical, highSeverity] = await Promise.all([
      prisma.alert.count(),
      prisma.alert.count({ where: { isRead: false } }),
      prisma.alert.count({ where: { severity: 'CRITICAL' } }),
      prisma.alert.count({ where: { severity: 'HIGH' } }),
    ]);

    return { total, unread, critical, highSeverity };
  },
};

module.exports = Alert;
