const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
} = require('../controllers/orderController');
const { getPaymentByOrderId } = require('../controllers/paymentController');
const { getDeliveryByOrderId } = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:orderId/payment', getPaymentByOrderId);
router.get('/:orderId/delivery', getDeliveryByOrderId);
router.get('/:id', getOrderById);

module.exports = router;
