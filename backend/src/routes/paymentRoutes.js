const express = require('express');
const router = express.Router();
const {
  createPayment,
  getPaymentById,
} = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createPayment);
router.get('/:id', getPaymentById);

module.exports = router;
