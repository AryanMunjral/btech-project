/**
 * Alert Routes — Protected by role-based access
 *
 * Viewing alerts: any authenticated user.
 * Managing alerts: ADMIN + ANALYST.
 */

const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticate, authorize } = require('../middleware/auth');

// All alert routes require authentication
router.use(authenticate);

// Any authenticated user can view alerts
router.get('/', alertController.getAll);
router.get('/stats', alertController.getStats);
router.get('/:id', alertController.getById);

// ADMIN + ANALYST can manage alerts
router.post('/', authorize('ADMIN', 'ANALYST'), alertController.create);
router.patch('/read-all', authorize('ADMIN', 'ANALYST'), alertController.markAllAsRead);
router.patch('/:id/read', authorize('ADMIN', 'ANALYST'), alertController.markAsRead);
router.patch('/:id/resolve', authorize('ADMIN', 'ANALYST'), alertController.resolve);
router.delete('/:id', authorize('ADMIN'), alertController.delete);

module.exports = router;
