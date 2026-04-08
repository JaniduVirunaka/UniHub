const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

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

// Create new event (simple seed route)
router.post('/', async (req, res, next) => {
  try {
    const eventData = req.body;
    const event = await Event.create(eventData);
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
