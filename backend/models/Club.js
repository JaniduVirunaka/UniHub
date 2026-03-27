const mongoose = require('mongoose');

// 1. Announcements
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false }, //supervisors review announcement before publishing
  isDeleted: { type: Boolean, default: false }, // hide announcements from UI, but keeps track for pdfs
  createdAt: { type: Date, default: Date.now }
});

// 2. Incoming Company Offers 
const pledgeSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactEmail: { type: String, required: true },
  amount: { type: Number, required: true },
  message: { type: String },
  status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending' },
  date: { type: Date, default: Date.now }
});

// 2.5 Official Club Request 
const proposalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  proposalDocumentUrl: { type: String }, 
  isActive: { type: Boolean, default: true },
  pledges: [pledgeSchema] //shoes company pledges per proposal
});

// 3. Club Expenses 
const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  receiptUrl: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isDeleted: { type: Boolean, default: false }, //soft delete
  isEdited: { type: Boolean, default: false } //audit track
});

// 4. Election System 
const candidateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  manifesto: { type: String, required: true },
  voteCount: { type: Number, default: 0 } // Mathematically secure tally
});

const electionSchema = new mongoose.Schema({
  position: { type: String, required: true }, // e.g., "President 2026/2027"
  isActive: { type: Boolean, default: false }, // Supervisor turns this on when voting begins
  isPublished: { type: Boolean, default: false }, // Supervisor turns this on to reveal results
  candidates: [candidateSchema],
  votedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Prevents double-voting!
});

//===MAIN CLUB SCHEMA===
const clubSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  description: { type: String, required: true },
  mission: { type: String, required: true },
  membershipFee: { type: Number, default: 0 }, 
  logoUrl: { type: String, default: '' }, 
  rulesAndRegulations: { type: String, default: 'Standard club guidelines apply.' },

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
  
 // Dynamic Payment Categories (Managed by Treasury)
  paymentCategories: [{ type: String, default: 'Membership Fee' }],

  // Ledger (Tracks individual student payments)
  feeRecords: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, required: true, default: 'Membership Fee' },
    receiptUrl: { type: String }, // Stores the path to the uploaded screenshot
    status: { type: String, enum: ['Pending', 'Pending Verification', 'Paid', 'Rejected', 'Exempt'], default: 'Pending' },
    amountPaid: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
  }],

  // Unified Achievement Showcase (Trophies + Photos)
  achievements: [{
    title: { type: String, required: true },
    description: { type: String },
    dateAwarded: { type: String }, 
    imageUrls: [{ type: String }], //Multiple photos
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Club Operations
  announcements: [announcementSchema],
  proposals: [proposalSchema],
  elections: [electionSchema],
  expenses: [expenseSchema]
});



module.exports = mongoose.model('Club', clubSchema);