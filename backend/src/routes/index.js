const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const transactionRoutes = require('./transactions');
const dashboardRoutes = require('./dashboard');
const userRoutes = require('./users');
const alertRoutes = require('./alerts');
const mlService = require('../services/mlService');

// ── Public routes ──────────────────────────────────────
router.use('/auth', authRoutes);

// ── Protected routes (auth applied inside each file) ───
router.use('/transactions', transactionRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/alerts', alertRoutes);

// ── Health check (public) ──────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'upi-fraud-backend',
    version: '4.0.0',
    orm: 'prisma',
    auth: 'jwt',
    ml_api: {
      status: 'connected',
      note: 'ML model served via Streamlit dashboard',
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
