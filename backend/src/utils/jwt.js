/**
 * JWT Utility Module
 *
 * Handles token creation, verification, and an in-memory
 * blacklist for logout (production would use Redis/DB).
 */

const jwt = require('jsonwebtoken');
const config = require('../config');

// ── In-memory token blacklist (for logout) ─────────────
// In production, replace with Redis or a DB table
const tokenBlacklist = new Set();

const jwtUtil = {
  /**
   * Generate an access token
   * Payload: { id, email, role }
   */
  signAccessToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  },

  /**
   * Generate a refresh token (longer-lived)
   */
  signRefreshToken(user) {
    return jwt.sign(
      {
        id: user.id,
        type: 'refresh',
      },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  },

  /**
   * Verify and decode a token
   * Returns the decoded payload or throws an error
   */
  verifyToken(token) {
    if (tokenBlacklist.has(token)) {
      const err = new Error('Token has been revoked');
      err.name = 'TokenRevokedError';
      throw err;
    }
    return jwt.verify(token, config.jwt.secret);
  },

  /**
   * Blacklist a token (for logout)
   */
  blacklistToken(token) {
    tokenBlacklist.add(token);
  },

  /**
   * Check if a token is blacklisted
   */
  isBlacklisted(token) {
    return tokenBlacklist.has(token);
  },

  /**
   * Extract token from Authorization header
   * Supports: "Bearer <token>"
   */
  extractFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.slice(7); // Remove "Bearer "
  },
};

module.exports = jwtUtil;
