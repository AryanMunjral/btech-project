/**
 * Global error handling middleware
 *
 * Catches all errors and returns consistent JSON responses.
 * Handles: Validation, Auth (JWT), Prisma, and generic errors.
 */
function errorHandler(err, req, res, _next) {
  console.error('Error:', err.message);

  // ── Zod / validation errors ──────────────────────────
  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    });
  }

  // ── JWT errors ───────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'The provided token is malformed or invalid.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Your session has expired. Please log in again.',
    });
  }

  if (err.name === 'TokenRevokedError') {
    return res.status(401).json({
      error: 'Token Revoked',
      message: 'This token has been logged out.',
    });
  }

  // ── Prisma errors ────────────────────────────────────
  if (err.code === 'P2002') {
    // Unique constraint violation
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      error: 'Conflict',
      message: `A record with this ${field} already exists.`,
    });
  }

  if (err.code === 'P2025') {
    // Record not found
    return res.status(404).json({
      error: 'Not Found',
      message: 'The requested resource was not found.',
    });
  }

  if (err.code === '23505') {
    // PostgreSQL unique violation (legacy)
    return res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists.',
    });
  }

  // ── Generic errors ───────────────────────────────────
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.message,
    }),
  });
}

module.exports = errorHandler;
