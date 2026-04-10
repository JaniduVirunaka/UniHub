const Review = require('../models/Review');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

const createReview = async (req, res) => {
  try {
    const { eventId, rating, review } = req.body;

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Only allow reviews after event date/time passed
    const eventDate = event.date ? new Date(event.date) : null;
    if (!eventDate) return res.status(400).json({ message: 'Event date is not set' });
    if (eventDate.getTime() > Date.now()) {
      return res.status(400).json({ message: 'You can review only after the event ends' });
    }

    // Only allow users whose payment has been verified (status: registered)
    const booking = await Registration.findOne({
      userId: req.user._id,
      eventId,
      status: 'registered'
    }).lean();
    if (!booking) {
      return res.status(403).json({ message: 'You can only review events you attended after payment was verified' });
    }

    const existing = await Review.findOne({ user: req.user._id, event: eventId }).lean();
    if (existing) {
      return res.status(400).json({ message: 'You already reviewed this event' });
    }

    const newReview = new Review({
      user: req.user._id,
      event: eventId,
      rating,
      review
    });
    await newReview.save();
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReviewsForEvent = async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId }).populate('user', 'name');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getReviewsForEvent };