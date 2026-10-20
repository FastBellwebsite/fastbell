const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductAvailability,
  deleteProduct,
} = require('../controllers/productController');

// Public read routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Protected mutation routes (ADMIN or VENDOR)
router.post('/', authMiddleware, requireRole('ADMIN', 'VENDOR'), createProduct);
router.put('/:id', authMiddleware, requireRole('ADMIN', 'VENDOR'), updateProduct);
router.patch('/:id/status', authMiddleware, requireRole('ADMIN', 'VENDOR'), updateProductAvailability);
router.delete('/:id', authMiddleware, requireRole('ADMIN', 'VENDOR'), deleteProduct);

module.exports = router;
