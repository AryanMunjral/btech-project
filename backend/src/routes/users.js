/**
 * User Routes — Protected by role-based access
 *
 * Only ADMIN and ANALYST can manage users.
 * Users can view their own data via /api/auth/me instead.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// All user management requires authentication
router.use(authenticate);

// Any logged-in user can look up a UPI ID (needed for transfers)
router.get('/upi/:upiId', userController.getByUpiId);

// ADMIN + ANALYST can list users, view details, view user transactions
router.get('/', authorize('ADMIN', 'ANALYST'), userController.getAll);
router.get('/:id', authorize('ADMIN', 'ANALYST'), userController.getById);
router.get('/:id/transactions', authorize('ADMIN', 'ANALYST'), userController.getTransactions);

// Only ADMIN can create, update, or deactivate users
router.post('/', authorize('ADMIN'), userController.create);
router.put('/:id', authorize('ADMIN'), userController.update);
router.delete('/:id', authorize('ADMIN'), userController.deactivate);

module.exports = router;
