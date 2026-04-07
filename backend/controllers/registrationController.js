const Registration = require('../models/Registration');
const Event = require('../models/Event');

exports.registerEvent = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.availableTickets <= 0) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    const existing = await Registration.findOne({
      userId,
      eventId,
      status: { $in: ['registered', 'pending_payment'] }
    });
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    const registration = await Registration.create({ userId, eventId, ticketsBooked: 1 });

    event.availableTickets -= 1;
    if (event.availableTickets < 0) event.availableTickets = 0;
    await event.save();

    res.status(201).json({ message: 'Registered successfully', registration });
  } catch (error) {
    next(error);
  }
};

exports.getMyEvents = async (req, res, next) => {
  try {
    const userId = req.userId;
    const registrations = await Registration.find({ userId, status: { $in: ['registered', 'pending_payment'] } })
      .populate('eventId')
      .lean();

    const events = registrations.map((r) => ({
      registrationId: r._id,
      ...r.eventId,
      ticketsBooked: r.ticketsBooked,
      registeredAt: r.registeredAt,
      registrationStatus: r.status
    }));

    res.json(events);
  } catch (error) {
    next(error);
  }
};

exports.cancelRegistration = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const registration = await Registration.findOne({ _id: id, userId, status: 'registered' });
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.status = 'cancelled';
    await registration.save();

    const event = await Event.findById(registration.eventId);
    if (event) {
      event.availableTickets += registration.ticketsBooked;
      await event.save();
    }

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    next(error);
  }
};