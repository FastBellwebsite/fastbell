const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  claimOrder,
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
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.post('/:id/claim', claimOrder);

module.exports = router;
