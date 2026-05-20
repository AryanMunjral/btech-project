/**
 * Auth Controller
 *
 * Handles: Register, Login, Get Profile, Change Password, Logout
 */

const User = require('../models/User');
const jwtUtil = require('../utils/jwt');

const authController = {
  /**
   * POST /api/auth/register
   *
   * Body (validated by Zod): { name, email, password, upiId, phone?, balance? }
   * Returns: user + access token + refresh token
   */
  async register(req, res, next) {
    try {
      const { name, email, password, upiId, phone, balance } = req.validated;

      // Check if email already taken
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(409).json({
          error: 'Email already registered',
          message: 'An account with this email already exists. Try logging in.',
        });
      }

      // Check if UPI ID already taken
      const existingUpi = await User.findByUpiId(upiId);
      if (existingUpi) {
        return res.status(409).json({
          error: 'UPI ID already registered',
          message: 'This UPI ID is already linked to another account.',
        });
      }

      // Create the user (password is hashed inside User.create)
      const user = await User.create({ name, email, password, upiId, phone, balance });

      // Generate tokens
      const accessToken = jwtUtil.signAccessToken(user);
      const refreshToken = jwtUtil.signRefreshToken(user);

      res.status(201).json({
        message: 'Registration successful',
        user,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'field';
        return res.status(409).json({ error: `${field} already exists` });
      }
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   *
   * Body (validated by Zod): { email, password }
   * Returns: user + access token + refresh token
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.validated;

      // 1. Find user by email (includes password hash)
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'No account found with this email.',
        });
      }

      // 2. Check if account is active
      if (!user.isActive) {
        return res.status(403).json({
          error: 'Account deactivated',
          message: 'Your account has been deactivated. Contact support.',
        });
      }

      // 3. Verify password
      const isValid = await User.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Incorrect password.',
        });
      }

      // 4. Generate tokens
      const accessToken = jwtUtil.signAccessToken(user);
      const refreshToken = jwtUtil.signRefreshToken(user);

      // 5. Return user (without password) + tokens
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          upiId: user.upiId,
          role: user.role,
        },
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   *
   * Protected route — requires valid JWT
   * Returns: current user's profile with stats
   */
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/profile
   *
   * Protected route — update own profile (name, phone)
   * Body (validated by Zod): { name?, phone? }
   */
  async updateProfile(req, res, next) {
    try {
      const user = await User.update(req.user.id, req.validated);
      res.json({
        message: 'Profile updated successfully',
        user,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/auth/change-password
   *
   * Protected route — change own password
   * Body (validated by Zod): { currentPassword, newPassword }
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.validated;

      // Fetch full user (with password hash)
      const user = await User.findByEmail(req.user.email);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValid = await User.verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return res.status(401).json({
          error: 'Incorrect password',
          message: 'Current password is wrong.',
        });
      }

      // Update to new password (hashed inside User.update)
      await User.update(req.user.id, { password: newPassword });

      // Blacklist the current token (force re-login)
      jwtUtil.blacklistToken(req.token);

      // Issue new tokens
      const accessToken = jwtUtil.signAccessToken(req.user);
      const refreshToken = jwtUtil.signRefreshToken(req.user);

      res.json({
        message: 'Password changed successfully. New tokens issued.',
        accessToken,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/refresh
   *
   * Exchange a refresh token for a new access token
   * Body: { refreshToken }
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token is required' });
      }

      // Verify the refresh token
      let decoded;
      try {
        decoded = jwtUtil.verifyToken(refreshToken);
      } catch (err) {
        return res.status(401).json({
          error: 'Invalid refresh token',
          message: 'Refresh token is expired or invalid. Please log in again.',
        });
      }

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          error: 'Invalid token type',
          message: 'This is not a refresh token.',
        });
      }

      // Fetch the user
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Issue new access token
      const accessToken = jwtUtil.signAccessToken(user);

      res.json({
        message: 'Token refreshed successfully',
        accessToken,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   *
   * Protected route — blacklists the current token
   */
  async logout(req, res) {
    jwtUtil.blacklistToken(req.token);
    res.json({
      message: 'Logged out successfully. Token has been revoked.',
    });
  },
};

module.exports = authController;
