const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  eventType: {
    type: String,
    enum: ['event', 'club'],
    required: true
  },
  thumbnail: String,
  posterImage: String,
  ticketImage: String,
  date: Date,
  time: String,
  location: String,
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  totalCapacity: {
    type: Number,
    required: true
  },
  availableTickets: {
    type: Number,
    required: true
  },
  isTicketed: {
    type: Boolean,
    default: false
  },
  ticketPrice: {
    type: Number,
    default: 0
  },
  ticketPriceOptions: {
    type: [Number],
    default: []
  },
  tickets: {
    type: [{
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 }
    }],
    default: []
  },
  bankAccount: String,
  whatsappNumber: String,
  paymentMessage: {
    type: String,
    default: 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);
