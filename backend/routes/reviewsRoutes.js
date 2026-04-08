const express = require('express');
const { createReview, getReviewsForEvent } = require('../controllers/reviewsController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware.protect, createReview);
router.get('/event/:eventId', getReviewsForEvent);

module.exports = router;