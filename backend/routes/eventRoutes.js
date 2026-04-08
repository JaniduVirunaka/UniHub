const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { protect, requireRole } = require('../middleware/authMiddleware');

// Get all events
router.get('/', async (req, res, next) => {
  try {
    const events = await Event.find().lean();
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Get event by ID
router.get('/:id', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    next(error);
  }
});

// Check ticket availability
router.get('/:id/availability', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ availableTickets: event.availableTickets });
  } catch (error) {
    next(error);
  }
});

// Create new event — admin only
router.post('/', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

// Update event — admin only
router.put('/:id', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (error) {
    next(error);
  }
});

// Delete event — admin only
router.delete('/:id', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
