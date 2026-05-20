/**
 * Zod validation schemas for authentication routes.
 *
 * Each schema validates req.body before it reaches the controller.
 */

const { z } = require('zod');

// ── Register ───────────────────────────────────────────
const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),

  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .max(150)
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be at most 128 characters'),

  upiId: z
    .string({ required_error: 'UPI ID is required' })
    .min(3, 'UPI ID must be at least 3 characters')
    .max(100)
    .regex(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/,
      'UPI ID must be in format: name@bank (e.g., user@paytm)'
    )
    .trim(),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian number')
    .optional()
    .nullable(),

  balance: z
    .number()
    .min(0, 'Balance cannot be negative')
    .optional()
    .default(10000),
});

// ── Login ──────────────────────────────────────────────
const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ── Update Profile ─────────────────────────────────────
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim()
    .optional(),

  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian number')
    .optional()
    .nullable(),
});

// ── Change Password ────────────────────────────────────
const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),

  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(6, 'New password must be at least 6 characters')
    .max(128),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
};
