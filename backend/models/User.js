const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  
  // THE FIX: Password is no longer 'required: true' because Google users won't have one!
  password: { type: String }, 
  
  role: { 
    type: String, 
    enum: ['student', 'president', 'supervisor'], 
    default: 'student'
  },

  // NEW: We add an authProvider tag so we know how they created their account
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  }
});

module.exports = mongoose.model('User', userSchema);