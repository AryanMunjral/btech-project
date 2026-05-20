const User = require('../models/User');

const userController = {
  /**
   * GET /api/users
   * List all users (paginated)
   */
  async getAll(req, res, next) {
    try {
      const { limit, offset, role } = req.query;
      const users = await User.findAll({
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
        role,
      });
      res.json({ users, count: users.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/:id
   * Get single user with stats
   */
  async getById(req, res, next) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/upi/:upiId
   * Find user by UPI ID
   */
  async getByUpiId(req, res, next) {
    try {
      const user = await User.findByUpiId(req.params.upiId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/users
   * Register a new user
   */
  async create(req, res, next) {
    try {
      const { name, email, password, upiId, phone, balance } = req.body;

      // Validate required fields
      if (!name || !email || !password || !upiId) {
        return res.status(400).json({
          error: 'name, email, password, and upiId are required',
        });
      }

      // Check for duplicates
      const existing = await User.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const user = await User.create({ name, email, password, upiId, phone, balance });
      res.status(201).json(user);
    } catch (err) {
      if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'field';
        return res.status(409).json({ error: `${field} already exists` });
      }
      next(err);
    }
  },

  /**
   * PUT /api/users/:id
   * Update user fields
   */
  async update(req, res, next) {
    try {
      const user = await User.update(req.params.id, req.body);
      res.json(user);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      next(err);
    }
  },

  /**
   * DELETE /api/users/:id
   * Soft-deactivate user
   */
  async deactivate(req, res, next) {
    try {
      await User.deactivate(req.params.id);
      res.json({ message: 'User deactivated successfully' });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'User not found' });
      }
      next(err);
    }
  },

  /**
   * GET /api/users/:id/transactions
   * Get user's transaction history
   */
  async getTransactions(req, res, next) {
    try {
      const transactions = await User.getTransactions(req.params.id, {
        limit: parseInt(req.query.limit) || 20,
      });
      res.json({ transactions, count: transactions.length });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = userController;
