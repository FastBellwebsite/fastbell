const express = require('express');
const router = express.Router();
const { getAllCampuses, getCampusById } = require('../controllers/campusController');

router.get('/', getAllCampuses);
router.get('/:id', getCampusById);

module.exports = router;
