const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { createRequest, getMyRequests, getRequestsBySport, approveRequest, rejectRequest } = require('../controllers/requestController');

router.get('/my', protect, requireRole('student', 'captain', 'vice_captain'), getMyRequests);
router.get('/sport/:sportId', protect, requireRole('sport_admin', 'captain', 'vice_captain'), getRequestsBySport);
router.post('/:sportId', protect, requireRole('student'), createRequest);
router.put('/:requestId/approve', protect, requireRole('sport_admin', 'captain', 'vice_captain'), approveRequest);
router.put('/:requestId/reject', protect, requireRole('sport_admin', 'captain', 'vice_captain'), rejectRequest);

module.exports = router;
