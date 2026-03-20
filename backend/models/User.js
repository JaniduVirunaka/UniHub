const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student', 'club_admin', 'event_admin', 'super_admin'], 
    default: 'student' // Anyone signing up normally is just a student
  }
});

module.exports = mongoose.model('User', userSchema);