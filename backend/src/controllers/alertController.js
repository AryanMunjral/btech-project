const Alert = require('../models/Alert');

const alertController = {
  /**
   * GET /api/alerts
   * List alerts with optional filtering
   */
  async getAll(req, res, next) {
    try {
      const { severity, is_read, limit, offset } = req.query;
      const alerts = await Alert.findAll({
        severity,
        isRead: is_read !== undefined ? is_read === 'true' : undefined,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0,
      });
      res.json({ alerts, count: alerts.length });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/alerts/stats
   * Get alert summary counts
   */
  async getStats(req, res, next) {
    try {
      const stats = await Alert.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/alerts/:id
   * Get single alert with related data
   */
  async getById(req, res, next) {
    try {
      const alert = await Alert.findById(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      res.json(alert);
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/alerts
   * Create a new alert manually
   */
  async create(req, res, next) {
    try {
      const { type, severity, title, message, userId, transactionId } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({
          error: 'type, title, and message are required',
        });
      }

      const alert = await Alert.create({
        type,
        severity,
        title,
        message,
        userId: userId ? parseInt(userId) : undefined,
        transactionId: transactionId ? parseInt(transactionId) : undefined,
      });

      res.status(201).json(alert);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/alerts/:id/read
   * Mark single alert as read
   */
  async markAsRead(req, res, next) {
    try {
      const alert = await Alert.markAsRead(req.params.id);
      res.json(alert);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Alert not found' });
      }
      next(err);
    }
  },

  /**
   * PATCH /api/alerts/:id/resolve
   * Mark alert as resolved
   */
  async resolve(req, res, next) {
    try {
      const alert = await Alert.resolve(req.params.id);
      res.json(alert);
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Alert not found' });
      }
      next(err);
    }
  },

  /**
   * PATCH /api/alerts/read-all
   * Mark all alerts as read
   */
  async markAllAsRead(req, res, next) {
    try {
      const result = await Alert.markAllAsRead();
      res.json({ message: `${result.count} alerts marked as read` });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/alerts/:id
   */
  async delete(req, res, next) {
    try {
      await Alert.delete(req.params.id);
      res.json({ message: 'Alert deleted successfully' });
    } catch (err) {
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Alert not found' });
      }
      next(err);
    }
  },
};

module.exports = alertController;
