/**
 * Dashboard Routes — Protected
 *
 * Requires authentication to view stats.
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

// Dashboard requires login
router.get('/stats', authenticate, dashboardController.getStats);

module.exports = router;
