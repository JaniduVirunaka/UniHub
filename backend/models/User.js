const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Password optional — Google OAuth users don't have one
  password: { type: String },

  // Unified role enum covering both club and sport modules
  role: {
    type: String,
    enum: ['student', 'president', 'supervisor', 'sport_admin', 'captain', 'vice_captain'],
    default: 'student'
  },

  // How the account was created
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },

  // Sport-module fields (optional — only set for sport participants)
  nic: { type: String },
  registrationNumber: { type: String },
  phone: { type: String },
  height: { type: Number },
  weight: { type: Number },
  extraSkills: { type: String },
  sport: { type: mongoose.Schema.Types.ObjectId, ref: 'Sport' }
});

module.exports = mongoose.model('User', userSchema);