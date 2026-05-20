/**
 * Authentication & Authorization Middleware
 *
 * Two middleware functions:
 *   1. authenticate — verifies JWT token, attaches req.user
 *   2. authorize(...roles) — checks if req.user.role is allowed
 *
 * Usage:
 *   // Any logged-in user
 *   router.get('/profile', authenticate, controller.getProfile);
 *
 *   // Only ADMIN and ANALYST
 *   router.get('/users', authenticate, authorize('ADMIN', 'ANALYST'), controller.getAll);
 */

const jwtUtil = require('../utils/jwt');
const { prisma } = require('../config/database');

/**
 * Authenticate — verify JWT and attach user to request.
 *
 * Reads token from: Authorization: Bearer <token>
 * Sets: req.user = { id, name, email, upiId, role, isActive }
 * Sets: req.token = raw token string (needed for logout)
 */
async function authenticate(req, res, next) {
  try {
    // 1. Extract token from header
    const token = jwtUtil.extractFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided. Send: Authorization: Bearer <token>',
      });
    }

    // 2. Verify token (checks signature, expiry, and blacklist)
    let decoded;
    try {
      decoded = jwtUtil.verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Your session has expired. Please log in again.',
        });
      }
      if (err.name === 'TokenRevokedError') {
        return res.status(401).json({
          error: 'Token revoked',
          message: 'This token has been logged out. Please log in again.',
        });
      }
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token verification failed.',
      });
    }

    // 3. Fetch fresh user from DB (ensures user still exists + is active)
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        upiId: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'User not found',
        message: 'The user associated with this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Contact support.',
      });
    }

    // 4. Attach user and raw token to request
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Authorize — role-based access control.
 *
 * Must be used AFTER authenticate middleware.
 *
 * @param  {...string} allowedRoles — e.g. 'ADMIN', 'ANALYST'
 * @returns Express middleware
 *
 * Example:
 *   authorize('ADMIN')           → only admins
 *   authorize('ADMIN', 'ANALYST') → admins and analysts
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
