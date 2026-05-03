const Payment = require('../models/Payment');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

// Create a payment record for a registration (simulate PayPal flow)
exports.createPayment = async (req, res, next) => {
  try {
    const { registrationId, method = 'paypal' } = req.body;
    const registration = await Registration.findById(registrationId).populate('eventId');
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    if (String(registration.userId) !== String(req.user._id)) return res.status(403).json({ message: 'Not your registration' });
    if (registration.status !== 'pending_payment') return res.status(400).json({ message: 'Registration not awaiting payment' });

    const amount = (registration.eventId?.ticketPrice || 0) * (registration.ticketsBooked || 1);

    const payment = await Payment.create({ registration: registration._id, user: req.user._id, amount, method, status: 'CREATED' });

    // Notify admins about payment pending
    const admins = await require('../models/User').find({ role: { $in: ['admin', 'sport_admin'] } }).lean();
    const notifications = admins.map(a => ({ recipient: a._id, message: `New payment initiated for registration ${registration._id}`, data: { registrationId: registration._id, paymentId: payment._id }, type: 'payment' }));
    if (notifications.length) await Notification.insertMany(notifications);

    // Return a simulated approval link
    const approvalUrl = `/api/payments/approve/${payment._id}`;
    res.json({ paymentId: payment._id, approvalUrl });
  } catch (error) {
    next(error);
  }
};

// Simulate approving a payment (would be PayPal callback in real integration)
exports.approvePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate('registration');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status === 'APPROVED') return res.json({ message: 'Already approved' });

    payment.status = 'APPROVED';
    await payment.save();
    
    // Do NOT change registration status here — admin must still verify the payment.
    // Notify the paying user that payment succeeded (registration still pending admin verification)
    await Notification.create({ recipient: payment.user, message: `Payment successful for registration ${payment.registration._id}. Awaiting admin verification.`, type: 'payment', data: { registrationId: payment.registration._id, paymentId: payment._id } });

    // Notify admins that a payment was completed for review
    const admins = await require('../models/User').find({ role: { $in: ['admin', 'sport_admin'] } }).lean();
    const adminNotifications = admins.map(a => ({ recipient: a._id, message: `Payment completed for registration ${payment.registration._id}`, type: 'payment', data: { registrationId: payment.registration._id, paymentId: payment._id } }));
    if (adminNotifications.length) await Notification.insertMany(adminNotifications);

    res.json({ message: 'Payment marked as completed. Awaiting admin verification.' });
  } catch (error) {
    next(error);
  }
};

// Simulate rejecting a payment
exports.rejectPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id).populate('registration');
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    if (payment.status === 'REJECTED') return res.json({ message: 'Already rejected' });

    payment.status = 'REJECTED';
    await payment.save();
    
    // Notify the user and admins that provider rejected the payment. Registration remains pending_payment so user may retry.
    await Notification.create({ recipient: payment.user, message: `Payment was rejected for registration ${payment.registration._id}. Please retry or contact support.`, type: 'payment', data: { registrationId: payment.registration._id, paymentId: payment._id } });

    const admins = await require('../models/User').find({ role: { $in: ['admin', 'sport_admin'] } }).lean();
    const adminNotifications = admins.map(a => ({ recipient: a._id, message: `Payment rejected for registration ${payment.registration._id}`, type: 'payment', data: { registrationId: payment.registration._id, paymentId: payment._id } }));
    if (adminNotifications.length) await Notification.insertMany(adminNotifications);

    res.json({ message: 'Payment marked as rejected' });
  } catch (error) {
    next(error);
  }
};
