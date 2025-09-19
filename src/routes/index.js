const express = require('express');
const userRoutes = require('./userRoutes');
const carRoutes = require('./carRoutes');
const rentalRoutes = require('./rentalRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/cars', carRoutes);
router.use('/rentals', rentalRoutes);

module.exports = router;