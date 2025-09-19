const express = require('express');
const rentalController = require('../controller/rentalController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, rentalController.createRental);
router.get('/user', authMiddleware, rentalController.getRentalsByUser);

module.exports = router;