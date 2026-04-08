const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // Password optional — Google OAuth users don't have one
  password: { type: String },

  // Unified role enum covering club, sport, and event modules
  role: {
    type: String,
    enum: ['student', 'president', 'supervisor', 'sport_admin', 'captain', 'vice_captain', 'admin'],
    default: 'student'
  },

  // How the account was created
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },

  // Event-module fields (optional — only set for event/registration users)
  studentId:      { type: String, unique: true, sparse: true },
  department:     { type: String },
  year:           { type: Number },
  profilePicture: { type: String },
  registeredAt:   { type: Date, default: Date.now },

  // Sport-module fields (optional — only set for sport participants)
  nic:                { type: String },
  registrationNumber: { type: String },
  phone:              { type: String },
  height:             { type: Number },
  weight:             { type: Number },
  extraSkills:        { type: String },
  sport:              { type: mongoose.Schema.Types.ObjectId, ref: 'Sport' }
});

// Hash password before saving — guard for Google OAuth users who have no password
// Mongoose 7+: async hooks don't receive next(); just return to signal completion
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await require('bcryptjs').hash(this.password, 10);
});

userSchema.methods.comparePassword = function (password) {
  return require('bcryptjs').compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
