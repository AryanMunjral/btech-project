const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { prisma } = require('./config/database');

const app = express();

// ── Security & Middleware ──────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Rate limiting — general
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Rate limiting — stricter for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: {
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ── Routes ─────────────────────────────────────────────
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'UPI Fraud Detection API',
    version: '4.0.0',
    auth: 'JWT (Bearer token)',
    orm: 'Prisma',
    workflow: 'Transaction → ML Prediction → Fraud Scoring → Alert Generation',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me',
        logout: 'POST /api/auth/logout',
      },
      transactions: {
        list: 'GET /api/transactions',
        create: 'POST /api/transactions (→ ML fraud check)',
        batch: 'POST /api/transactions/batch',
        detail: 'GET /api/transactions/:id',
        recheck: 'POST /api/transactions/:id/recheck',
        mlStatus: 'GET /api/transactions/ml-status',
        update: 'PUT /api/transactions/:id (ADMIN/ANALYST)',
        delete: 'DELETE /api/transactions/:id (ADMIN)',
      },
      users: '/api/users (ADMIN/ANALYST)',
      alerts: '/api/alerts (authenticated)',
      dashboard: '/api/dashboard/stats (authenticated)',
    },
  });
});

// ── Error Handling ─────────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   UPI Fraud Detection Backend API v4.0           ║
  ║   Running on: 0.0.0.0:${config.port}                        ║
  ║   Environment: ${config.nodeEnv.padEnd(30)}║
  ║   Auth: JWT + Role-based access control          ║
  ║   ORM: Prisma + PostgreSQL                       ║
  ║   ML API: ${config.mlApiUrl.padEnd(36)}║
  ╚══════════════════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ──────────────────────────────────
async function shutdown() {
  console.log('\n🔌 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
