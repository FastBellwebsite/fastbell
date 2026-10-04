const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
} = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);

module.exports = router;
