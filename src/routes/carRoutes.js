const express = require('express');
const carController = require('../controller/carController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, carController.registerCar);
router.get('/available', authMiddleware, carController.getAvailableCars);

module.exports = router;