const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

router.use(authMiddleware.protect);
router.get('/', notificationController.getMyNotifications);
router.patch('/:id/read', notificationController.markRead);
router.patch('/mark-all-read', notificationController.markAllRead);

module.exports = router;
