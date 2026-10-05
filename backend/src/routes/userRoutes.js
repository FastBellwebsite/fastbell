const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/password', changePassword);

module.exports = router;
