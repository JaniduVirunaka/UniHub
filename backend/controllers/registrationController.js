const Registration = require('../models/Registration');
const Event = require('../models/Event');

exports.registerEvent = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { eventId } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existing = await Registration.findOne({
      userId,
      eventId,
      status: { $in: ['registered', 'pending_payment'] }
    });
    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Atomic decrement — only succeeds if availableTickets >= 1
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventId, availableTickets: { $gte: 1 } },
      { $inc: { availableTickets: -1 } },
      { new: true }
    );
    if (!updatedEvent) {
      return res.status(400).json({ message: 'Event is sold out' });
    }

    const registration = await Registration.create({ userId, eventId, ticketsBooked: 1 });

    res.status(201).json({ message: 'Registered successfully', registration });
  } catch (error) {
    next(error);
  }
};

exports.getMyEvents = async (req, res, next) => {
  try {
    const userId = req.user._id;
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
    const userId = req.user._id;
    const { id } = req.params;

    const registration = await Registration.findOne({ _id: id, userId, status: 'registered' });
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    registration.status = 'cancelled';
    await registration.save();

    await Event.findByIdAndUpdate(registration.eventId, {
      $inc: { availableTickets: registration.ticketsBooked }
    });

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getAllRegistrations = async (req, res, next) => {
  try {
    const { status, eventId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (eventId) filter.eventId = eventId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Registration.countDocuments(filter);

    const registrations = await Registration.find(filter)
      .populate('userId', 'name email')
      .populate('eventId', 'title date location')
      .sort({ registeredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({ registrations, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const [totalRegistrations, pendingPayments, registeredCount, cancelledCount] = await Promise.all([
      Registration.countDocuments({}),
      Registration.countDocuments({ status: 'pending_payment' }),
      Registration.countDocuments({ status: 'registered' }),
      Registration.countDocuments({ status: 'cancelled' })
    ]);

    res.json({ totalRegistrations, pendingPayments, registeredCount, cancelledCount });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "approve" or "reject"' });
    }

    const registration = await Registration.findById(id);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Registration is not awaiting payment verification' });
    }

    if (action === 'approve') {
      registration.status = 'registered';
      await registration.save();
    } else {
      registration.status = 'cancelled';
      await registration.save();
      // Restore the reserved tickets
      await Event.findByIdAndUpdate(registration.eventId, {
        $inc: { availableTickets: registration.ticketsBooked }
      });
    }

    res.json({ message: action === 'approve' ? 'Payment verified' : 'Payment rejected', registration });
  } catch (error) {
    next(error);
  }
};
