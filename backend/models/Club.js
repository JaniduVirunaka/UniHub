const mongoose = require('mongoose');

// We create a sub-schema specifically for announcements to track approval status
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false } // Requires Supervisor approval before students see it
});

const clubSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  description: { type: String, required: true },
  mission: { type: String, required: true },
  membershipFee: { type: Number, default: 0 }, // Managed by the President
  
  // Leadership & Access Control [cite: 63]
  supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The Lecturer in Charge
  president: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Assigned by the Supervisor
  topBoard: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, required: true } 
  }],
  
  // Membership Management [cite: 49]
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Approved students
  pendingMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Students waiting for approval
  
  // Club Operations
  announcements: [announcementSchema] // Uses the sub-schema defined above
});

module.exports = mongoose.model('Club', clubSchema);