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

// ── Get PORT from environment or config ────────────────
const PORT = process.env.PORT || config.port || 5000;

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
console.log(`[INFO] Starting server on PORT: ${PORT}`);
console.log(`[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[INFO] Database URL: ${process.env.DATABASE_URL ? 'Configured' : 'Not set (local mode)'}`);

try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  ✅ UPI Fraud Detection Backend v4.0 Started`);
    console.log(`  📍 Listening on: 0.0.0.0:${PORT}`);
    console.log(`  🌍 Environment: ${config.nodeEnv}`);
    console.log(`  🔐 Auth: JWT + Role-based access control`);
    console.log(`  🗄️  ORM: Prisma + PostgreSQL`);
    console.log(`  🤖 ML API: ${config.mlApiUrl}\n`);
  });

  // Handle startup errors
  server.on('error', (err) => {
    console.error('[ERROR] Server failed to start:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.error(`[ERROR] Port ${PORT} is already in use`);
    }
    process.exit(1);
  });

  // ── Graceful Shutdown ──────────────────────────────────
  async function shutdown() {
    console.log('\n🔌 Shutting down gracefully...');
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.warn('Prisma disconnect warning:', e.message);
    }
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  }

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  
  // Uncaught exception handler
  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    process.exit(1);
  });

} catch (err) {
  console.error('[ERROR] Failed to initialize server:', err.message);
  process.exit(1);
}

module.exports = app;
