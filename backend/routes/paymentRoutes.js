const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

router.post('/create', authMiddleware.protect, paymentController.createPayment);
// Simulated approval endpoints (GET so they can be opened in browser during demo)
router.get('/approve/:id', authMiddleware.protect, paymentController.approvePayment);
router.get('/reject/:id', authMiddleware.protect, paymentController.rejectPayment);

module.exports = router;
