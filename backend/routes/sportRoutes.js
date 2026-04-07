const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { createSport, getSports, getSportById, updateSport, deleteSport, assignCaptain, assignViceCaptain, removeMember } = require('../controllers/sportController');

router.get('/', protect, getSports);
router.get('/:id', protect, getSportById);
router.post('/', protect, requireRole('sport_admin'), createSport);
router.put('/:id', protect, requireRole('sport_admin'), updateSport);
router.delete('/:id', protect, requireRole('sport_admin'), deleteSport);
router.put('/:id/assign-captain', protect, requireRole('sport_admin'), assignCaptain);
router.put('/:id/assign-vice-captain', protect, requireRole('sport_admin'), assignViceCaptain);
router.put('/:id/remove-member/:studentId', protect, requireRole('sport_admin'), removeMember);

module.exports = router;
