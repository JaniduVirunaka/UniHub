const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, //bcrypt-hashed password
  role: { 
    type: String, 
    enum: ['student', 'president', 'supervisor'], 
    default: 'student' // All new signups default to normal students
  }
});

module.exports = mongoose.model('User', userSchema);