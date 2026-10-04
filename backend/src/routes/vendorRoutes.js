const express = require('express');
const router = express.Router();
const {
  getAllVendors,
  getVendorById,
  getVendorProducts,
} = require('../controllers/vendorController');

router.get('/', getAllVendors);
router.get('/:id', getVendorById);
router.get('/:vendorId/products', getVendorProducts);

module.exports = router;
