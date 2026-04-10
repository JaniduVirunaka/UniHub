const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Cart = require('../models/Cart');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// POST /api/cart/add - Add items to cart (ticketed events only)
router.post('/add', authMiddleware.protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { eventId, quantity } = req.body;

    const qty = Math.max(1, parseInt(quantity || 1, 10));
    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.ticketPrice || event.ticketPrice <= 0) {
      return res.status(400).json({ message: 'This event does not require a ticket' });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId },
      { $setOnInsert: { userId }, $set: { updatedAt: new Date() } },
      { new: true, upsert: true }
    );

    const idx = cart.items.findIndex((i) => String(i.eventId) === String(eventId));
    if (idx >= 0) {
      cart.items[idx].quantity += qty;
    } else {
      cart.items.push({ eventId, quantity: qty });
    }
    cart.updatedAt = new Date();
    await cart.save();

    res.status(201).json({ message: 'Added to cart', cart });
  } catch (error) {
    next(error);
  }
});

// GET /api/cart - Get cart contents
router.get('/', authMiddleware.protect, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId }).populate('items.eventId').lean();
    res.json(cart || { userId, items: [] });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart/checkout - Reserve tickets + return bank/WhatsApp details
router.post('/checkout', authMiddleware.protect, async (req, res, next) => {
  try {
    const userId = req.user._id;

    const requestItems = Array.isArray(req.body?.items) ? req.body.items : null;

    let cart = null;
    let cartItems = [];

    if (requestItems && requestItems.length > 0) {
      cartItems = requestItems.map((i) => ({ eventId: i.eventId, quantity: Math.max(1, parseInt(i.quantity || 1, 10)) }));
    } else {
      cart = await Cart.findOne({ userId }).populate('items.eventId');
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }
      cartItems = cart.items.map((i) => ({ eventId: i.eventId?._id || i.eventId, quantity: i.quantity }));
    }

    const hydratedItems = [];
    // Validate availability first
    for (const item of cartItems) {
      const event = await Event.findById(item.eventId);
      if (!event) return res.status(400).json({ message: 'Invalid event in cart' });
      if (!event.ticketPrice || event.ticketPrice <= 0) {
        return res.status(400).json({ message: `Event "${event.title}" is not ticketed` });
      }
      if (event.availableTickets < item.quantity) {
        return res.status(400).json({ message: `Not enough tickets available for "${event.title}"` });
      }
      hydratedItems.push({ event, quantity: item.quantity });
    }

    const checkoutItems = [];

    // Reserve tickets by creating pending registrations
    for (const item of hydratedItems) {
      const event = item.event;

      const existing = await Registration.findOne({
        userId,
        eventId: event._id,
        status: { $in: ['registered', 'pending_payment'] }
      });
      if (existing) {
        return res.status(400).json({ message: `You already have a booking for "${event.title}"` });
      }

      // Atomic decrement — only succeeds if enough tickets remain
      const updatedEvent = await Event.findOneAndUpdate(
        { _id: event._id, availableTickets: { $gte: item.quantity } },
        { $inc: { availableTickets: -item.quantity } },
        { new: true }
      );
      if (!updatedEvent) {
        return res.status(400).json({ message: `Not enough tickets available for "${event.title}"` });
      }

      const registration = await Registration.create({
        userId,
        eventId: event._id,
        status: 'pending_payment',
        ticketsBooked: item.quantity
      });

      checkoutItems.push({
        eventId: event._id,
        title: event.title,
        quantity: item.quantity,
        unitPrice: event.ticketPrice,
        totalPrice: event.ticketPrice * item.quantity,
        bankAccount: event.bankAccount,
        whatsappNumber: event.whatsappNumber,
        paymentMessage:
          event.paymentMessage ||
          'Pay the payment for this bank account number and send the receipt for this WhatsApp number.',
        registrationId: registration._id
      });
    }

    if (cart) {
      cart.items = [];
      cart.updatedAt = new Date();
      await cart.save();
    } else {
      await Cart.findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId }, $set: { items: [], updatedAt: new Date() } },
        { upsert: true }
      );
    }

    const grandTotal = checkoutItems.reduce((sum, i) => sum + i.totalPrice, 0);

    res.json({
      message: 'Checkout created. Complete payment and send receipt via WhatsApp.',
      note:
        'Pay the payment for this bank account number and send the receipt for this WhatsApp number.',
      items: checkoutItems,
      grandTotal
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
