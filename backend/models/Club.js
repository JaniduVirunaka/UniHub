const mongoose = require('mongoose');

// 1. Announcements
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false } 
});

// 2. Incoming Company Offers (NEW)
const pledgeSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  message: { type: String },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  date: { type: Date, default: Date.now }
});

// 3. Official Club Request (NEW)
const proposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  proposalDocumentUrl: { type: String }, 
  isActive: { type: Boolean, default: true },
  pledges: [pledgeSchema] 
});

const clubSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  description: { type: String, required: true },
  mission: { type: String, required: true },
  membershipFee: { type: Number, default: 0 }, 
  
  // Leadership & Access Control 
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  president: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  topBoard: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, required: true } 
  }],
  
  // Membership Management 
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  pendingMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 
  
  // Club Operations
  announcements: [announcementSchema],
  proposals: [proposalSchema] 
});

module.exports = mongoose.model('Club', clubSchema);