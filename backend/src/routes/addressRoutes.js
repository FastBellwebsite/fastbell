const express = require('express');
const router = express.Router();
const {
  getAddresses,
  createAddress,
  getAddressById,
  updateAddress,
  deleteAddress,
} = require('../controllers/addressController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', getAddresses);
router.post('/', createAddress);
router.get('/:id', getAddressById);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

module.exports = router;
