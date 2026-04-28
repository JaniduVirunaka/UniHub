const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['manual', 'paypal'], default: 'manual' },
  status: { type: String, enum: ['CREATED', 'APPROVED', 'REJECTED'], default: 'CREATED' },
  providerData: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
