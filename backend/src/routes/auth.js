/**
 * Auth Routes
 *
 * POST /api/auth/register       — Create new account
 * POST /api/auth/login          — Get JWT tokens
 * GET  /api/auth/me             — Get own profile (protected)
 * PUT  /api/auth/profile        — Update own profile (protected)
 * PUT  /api/auth/change-password — Change password (protected)
 * POST /api/auth/refresh        — Refresh access token
 * POST /api/auth/logout         — Revoke current token (protected)
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validators/authSchemas');

// ── Public routes (no token needed) ────────────────────
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);

// ── Protected routes (token required) ──────────────────
router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
