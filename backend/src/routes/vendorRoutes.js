const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const {
  getAllVendors,
  getVendorById,
  getVendorProducts,
  getNearbyVendors,
  updateStore,
} = require('../controllers/vendorController');

router.get('/', getAllVendors);
router.get('/nearby', getNearbyVendors);
router.get('/:id', getVendorById);
router.get('/:vendorId/products', getVendorProducts);
router.patch('/stores/:storeId', authMiddleware, requireRole('VENDOR', 'ADMIN'), updateStore);
router.put('/stores/:storeId', authMiddleware, requireRole('VENDOR', 'ADMIN'), updateStore);

module.exports = router;
