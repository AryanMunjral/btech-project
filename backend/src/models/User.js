/**
 * User Model (v4.0) — Prisma-based CRUD + Balance Operations
 * =============================================================
 *
 * Upgraded with:
 *   - updateBalance() — atomic balance increment/decrement
 *   - getBalance()    — quick balance lookup by UPI ID
 *   - Better findByUpiId() with balance included
 */

const { prisma } = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const User = {
  /**
   * Get all users (paginated).
   */
  async findAll({ limit = 50, offset = 0, role } = {}) {
    const where = {};
    if (role) where.role = role;

    return prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        name: true,
        email: true,
        upiId: true,
        phone: true,
        balance: true,
        isActive: true,
        role: true,
        createdAt: true,
        // Never return password
      },
    });
  },

  /**
   * Find user by ID (with transaction + alert counts).
   */
  async findById(id) {
    return prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        upiId: true,
        phone: true,
        balance: true,
        isActive: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sentTransactions: true,
            receivedTransactions: true,
            alerts: true,
          },
        },
      },
    });
  },

  /**
   * Find user by email (for login — includes password).
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  /**
   * Find user by UPI ID (includes balance for transaction workflow).
   */
  async findByUpiId(upiId) {
    return prisma.user.findUnique({
      where: { upiId },
      select: {
        id: true,
        name: true,
        email: true,
        upiId: true,
        balance: true,
        isActive: true,
      },
    });
  },

  /**
   * Quick balance lookup by UPI ID.
   *
   * @param {string} upiId
   * @returns {number|null} — Balance or null if user not found
   */
  async getBalance(upiId) {
    const user = await prisma.user.findUnique({
      where: { upiId },
      select: { balance: true },
    });
    return user ? user.balance : null;
  },

  /**
   * Create a new user (hashes password).
   */
  async create({ name, email, password, upiId, phone, balance }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    return prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        upiId,
        phone: phone || null,
        balance: balance || 10000.0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        upiId: true,
        phone: true,
        balance: true,
        role: true,
        createdAt: true,
      },
    });
  },

  /**
   * Update user fields (hashes password if changed).
   */
  async update(id, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
    }

    return prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        upiId: true,
        phone: true,
        balance: true,
        isActive: true,
        role: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Atomic balance update — increment or decrement.
   *
   * @param {number} userId — User DB ID
   * @param {number} amount — Positive to add, negative to subtract
   * @returns {Object} — Updated user with new balance
   */
  async updateBalance(userId, amount) {
    if (amount > 0) {
      return prisma.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } },
        select: { id: true, upiId: true, balance: true },
      });
    } else {
      return prisma.user.update({
        where: { id: userId },
        data: { balance: { decrement: Math.abs(amount) } },
        select: { id: true, upiId: true, balance: true },
      });
    }
  },

  /**
   * Soft-deactivate a user (sets isActive = false).
   */
  async deactivate(id) {
    return prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });
  },

  /**
   * Verify password (for login).
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Get user's transaction history (sent + received).
   */
  async getTransactions(userId, { limit = 20 } = {}) {
    return prisma.transaction.findMany({
      where: {
        OR: [{ senderId: parseInt(userId) }, { receiverId: parseInt(userId) }],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, upiId: true } },
        receiver: { select: { id: true, name: true, upiId: true } },
      },
    });
  },
};

module.exports = User;
