const express = require('express');
const router = express.Router();
const {
  createDelivery,
  getDeliveryById,
  updateDeliveryStatus,
} = require('../controllers/deliveryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/', createDelivery);
router.get('/:id', getDeliveryById);
router.put('/:id/status', updateDeliveryStatus);

module.exports = router;
