const express = require('express');
const router = express.Router();
const {
  createDelivery,
  getDeliveryById,
  updateDeliveryStatus,
  getDeliveryPartners,
  updateDeliveryPartnerVerification,
} = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = authMiddleware.requireAdmin;

router.use(authMiddleware);

// Admin delivery partner verification routes
router.get('/admin/partners', requireAdmin, getDeliveryPartners);
router.patch('/admin/partners/:id/verification', requireAdmin, updateDeliveryPartnerVerification);
router.get('/partners', requireAdmin, getDeliveryPartners);
router.patch('/partners/:id/verification', requireAdmin, updateDeliveryPartnerVerification);

// Delivery operations
router.post('/', createDelivery);
router.get('/:id', getDeliveryById);
router.put('/:id/status', updateDeliveryStatus);

module.exports = router;
