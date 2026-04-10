const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register-event', authMiddleware.protect, registrationController.registerEvent);
router.get('/my-events', authMiddleware.protect, registrationController.getMyEvents);
router.delete('/:id', authMiddleware.protect, registrationController.cancelRegistration);

// Admin routes
router.get('/all', authMiddleware.protect, authMiddleware.requireRole('admin'), registrationController.getAllRegistrations);
router.get('/stats', authMiddleware.protect, authMiddleware.requireRole('admin'), registrationController.getStats);
router.patch('/:id/verify-payment', authMiddleware.protect, authMiddleware.requireRole('admin'), registrationController.verifyPayment);

module.exports = router;
