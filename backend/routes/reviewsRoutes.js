const express = require('express');
const { createReview, getReviewsForEvent, getAllReviews } = require('../controllers/reviewsController');
const { protect, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/event/:eventId', getReviewsForEvent);
router.get('/all', protect, requireRole('admin', 'event_manager'), getAllReviews);

module.exports = router;