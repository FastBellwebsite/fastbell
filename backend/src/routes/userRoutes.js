const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  updateUserStatus,
} = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = authMiddleware.requireAdmin;

router.use(authMiddleware);

// Admin-only user management routes
router.get('/', requireAdmin, getUsers);
router.patch('/:id/status', requireAdmin, updateUserStatus);

// Self user profile routes
router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/password', changePassword);

module.exports = router;
