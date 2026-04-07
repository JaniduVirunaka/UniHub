const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Club = require('../models/Club');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// All club routes require a valid JWT
router.use(protect);


// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Saves to the folder
  },
  filename: function (req, file, cb) {
    // Gives the file a unique timestamped name
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate('president', 'name')
      .populate('pendingMembers', 'name email')
      .populate('members', 'name email');
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GLOBAL SUPERVISOR MATRIX
router.get('/global/analytics', async (req, res) => {
  try {
    // 1. Add up all 'Paid' fees in all clubs
    const globalFees = await Club.aggregate([
      { $unwind: "$feeRecords" },
      { $match: { "feeRecords.status": "Paid" } },
      { $group: { _id: { month: { $month: "$feeRecords.lastUpdated" } }, total: { $sum: "$feeRecords.amountPaid" } } }
    ]);

    // 2. Add up all 'Accepted' pledges in all clbs
    const globalPledges = await Club.aggregate([
      { $unwind: "$proposals" },
      { $unwind: "$proposals.pledges" },
      { $match: { "proposals.pledges.status": "Accepted" } },
      { $group: { _id: { month: { $month: "$proposals.pledges.date" } }, total: { $sum: "$proposals.pledges.amount" } } }
    ]);

    // 3. Add up all expenses in all clubs
    const globalExpenses = await Club.aggregate([
      { $unwind: "$expenses" },
      { $match: { "expenses.isDeleted": { $ne: true } } },
      { $group: { _id: { month: { $month: "$expenses.date" } }, total: { $sum: "$expenses.amount" } } }
    ]);

    // 4. Add the totals in a monthly order
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let masterChart = months.map((month) => ({
      name: month,
      monthlyRevenue: 0,
      monthlyExpenses: 0
    }));

    globalFees.forEach(r => { masterChart[r._id.month - 1].monthlyRevenue += r.total; });
    globalPledges.forEach(r => { masterChart[r._id.month - 1].monthlyRevenue += r.total; });
    globalExpenses.forEach(r => { masterChart[r._id.month - 1].monthlyExpenses += r.total; });

    // Calculate Cumulative YTD for the Global Area Chart
    let ytdRev = 0;
    let ytdExp = 0;
    masterChart = masterChart.map(data => {
      ytdRev += data.monthlyRevenue;
      ytdExp += data.monthlyExpenses;
      return { ...data, ytdRevenue: ytdRev, ytdExpenses: ytdExp };
    });

    // 5. CALCULATE LEADERBOARD (Top Performing Clubs)
    const allClubs = await Club.find().populate('members');
    const leaderboard = allClubs.map(club => {
      let clubRev = 0;
      let clubExp = 0;

      // Calculate Revenue
      club.feeRecords.forEach(f => { if (f.status === 'Paid') clubRev += f.amountPaid; });
      club.proposals.forEach(p => p.pledges.forEach(pl => { if (pl.status === 'Accepted') clubRev += pl.amount; }));

      // Calculate Expenses
      if (club.expenses) {
        club.expenses.forEach(e => { clubExp += e.amount; });
      }

      return {
        id: club._id,
        name: club.name,
        totalRevenue: clubRev,
        totalExpenses: clubExp,
        memberCount: club.members.length
      };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5); // Get Top 5

    res.status(200).json({
      masterChart,
      leaderboard,
      totalClubs: allClubs.length,
      totalUniversityMembers: allClubs.reduce((acc, club) => acc + club.members.length, 0)
    });

  } catch (err) {
    console.error("Global Analytics Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Get a SINGLE club by ID
router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('president', 'name email')
      .populate('pendingMembers', 'name email')
      .populate('members', 'name email')
      .populate('topBoard.user', 'name email')
      .populate('feeRecords.user', 'name email'); // for the ledger to show names

    if (!club) return res.status(404).json({ message: "Club not found" });

    // failsafe : If this is an old club, force it to have the default category before sending it to the frontend!
    if (!club.paymentCategories || club.paymentCategories.length === 0) {
      club.paymentCategories = ['Membership Fee'];
    }

    res.json(club);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 1. Create a new club (SUPERVISOR ONLY)
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const { name, description, mission, membershipFee, supervisorId, presidentId, rulesAndRegulations } = req.body;

    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied: Only Supervisors can create clubs." });
    }

    if (presidentId) {   //upgrade assigned student to president role
      const assignedPresident = await User.findById(presidentId);
      if (assignedPresident && assignedPresident.role === 'student') {
        assignedPresident.role = 'president';
        await assignedPresident.save();
      }
    }

    // Capture the uploaded image URL if provided
    let logoUrl = '';
    if (req.file) {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    const newClub = new Club({
      name,
      description,
      mission,
      membershipFee: membershipFee || 0,
      rulesAndRegulations: rulesAndRegulations || 'Standard guidelines apply.',
      logoUrl,
      supervisor: supervisorId,
      president: presidentId || null
    });

    await newClub.save();
    res.status(201).json({ message: "Club created successfully!", club: newClub });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Update a club (SUPERVISOR ONLY)
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    // We explicitly extract membershipFee from req.body
    const { name, description, mission, presidentId, rulesAndRegulations, membershipFee } = req.body;

    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });

    // Handle President Change Logic
    if (presidentId !== undefined && presidentId !== club.president?.toString()) {
      if (club.president) {
        const oldPres = await User.findById(club.president);
        if (oldPres) { oldPres.role = 'student'; await oldPres.save(); }
      }
      if (presidentId) {
        const newPres = await User.findById(presidentId);
        if (newPres && newPres.role === 'student') {
          newPres.role = 'president'; await newPres.save();
        }
      }
      club.president = presidentId || null;
    }

    // Update the text fields
    club.name = name || club.name;
    club.description = description || club.description;
    club.mission = mission || club.mission;
    club.rulesAndRegulations = rulesAndRegulations || club.rulesAndRegulations;

    // Apply the membership fee update securely
    if (membershipFee !== undefined) {
      club.membershipFee = Number(membershipFee);
    }

    if (req.file) {
      club.logoUrl = `/uploads/${req.file.filename}`;
    }

    await club.save();
    res.status(200).json({ message: "Club updated successfully!", club });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a club
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }

    const club = await Club.findByIdAndDelete(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });

    // Downgrade the president back to a student since the club is gone
    if (club.president) {
      const oldPres = await User.findById(club.president);
      if (oldPres) {
        oldPres.role = 'student';
        await oldPres.save();
      }
    }

    res.status(200).json({ message: "Club deleted successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Student requests to join a club
router.post('/:id/request-join', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const userId = req.user._id;

    if (!club.members) club.members = [];
    if (!club.pendingMembers) club.pendingMembers = [];

    // Check if already a member or already requested
    if (club.members.includes(userId) || club.pendingMembers.includes(userId)) {
      return res.status(400).json({ message: "You are already a member or have a pending request." });
    }

    club.pendingMembers.push(userId);
    await club.save();
    res.status(200).json({ message: "Request sent to club president!" });
  } catch (err) {
    console.error("Join Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// President OR Vice President approves a student
router.post('/:id/approve', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const { studentId } = req.body;
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isVP = club.topBoard.some(b => b.user?.toString() === requestorId && b.role === 'Vice President');

    if (!isPres && !isVP) {
      return res.status(403).json({ message: "Only the President or Vice President can approve members." });
    }

    club.pendingMembers = club.pendingMembers.filter(id => id.toString() !== studentId);
    club.members.push(studentId);

    await club.save();
    res.status(200).json({ message: "Student approved successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// President OR Vice President rejects a student request
router.post('/:id/reject-request', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const { studentId } = req.body;
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isVP = club.topBoard.some(b => b.user?.toString() === requestorId && b.role === 'Vice President');

    if (!isPres && !isVP) {
      return res.status(403).json({ message: "Only the President or Vice President can reject requests." });
    }

    club.pendingMembers = club.pendingMembers.filter(id => id.toString() !== studentId);
    await club.save();
    res.status(200).json({ message: "Student request declined and removed." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 1. ADD an Achievement + Multiple Photos
router.post('/:id/achievements', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, dateAwarded } = req.body;
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isAuthorizedBoard = club.topBoard?.some(b => b.user?.toString() === requestorId && ['Vice President', 'Secretary', 'Assistant Secretary'].includes(b.role));

    if (!isPres && !isAuthorizedBoard) {
      return res.status(403).json({ message: "Access Denied: Only Exco can post achievements." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image file is required." });
    }

    // Map through ALL uploaded files and create an array of paths
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    club.achievements.push({ title, description, dateAwarded, imageUrls, addedBy: req.user._id });
    await club.save();

    res.status(200).json({ message: "Achievement added to the Trophy Room!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. EDIT an Achievement (Handles optional new images)
router.put('/:id/achievements/:achvId', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, dateAwarded } = req.body;
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isAuthorizedBoard = club.topBoard?.some(b => b.user?.toString() === requestorId && ['Vice President', 'Secretary', 'Assistant Secretary'].includes(b.role));

    if (!isPres && !isAuthorizedBoard) {
      return res.status(403).json({ message: "Access Denied." });
    }

    const achievement = club.achievements.id(req.params.achvId);
    if (!achievement) return res.status(404).json({ message: "Achievement not found." });

    achievement.title = title || achievement.title;
    achievement.description = description || achievement.description;
    achievement.dateAwarded = dateAwarded || achievement.dateAwarded;

    // If they uploaded NEW photos, overwrite the old array
    if (req.files && req.files.length > 0) {
      achievement.imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    }

    await club.save();
    res.status(200).json({ message: "Achievement updated!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. DELETE an Achievement
router.delete('/:id/achievements/:achvId', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isSupervisor = req.user.role === 'supervisor';
    const isPres = club.president?.toString() === requestorId;
    const isAuthorizedBoard = club.topBoard?.some(b => b.user?.toString() === requestorId && ['Vice President', 'Secretary', 'Assistant Secretary'].includes(b.role));

    if (!isSupervisor && !isPres && !isAuthorizedBoard) {
      return res.status(403).json({ message: "Access Denied." });
    }

    club.achievements.pull(req.params.achvId);
    await club.save();
    res.status(200).json({ message: "Achievement permanently deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- MEMBERSHIP FEE LEDGER ---
// 1. Fetch the Fee Ledger & Member List
router.get('/:id/fees', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('members', 'name email')
      .populate('president', 'name email')
      .populate('topBoard.user', 'name email')
      .populate('feeRecords.user', 'name email');

    if (!club) return res.status(404).json({ message: "Club not found." });

    // Send back the club's required fee, the list of members, and the ledger
    res.status(200).json({
      membershipFee: club.membershipFee,
      members: club.members,
      president: club.president,
      topBoard: club.topBoard,
      feeRecords: club.feeRecords
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Student Submits a Payment with receipt
router.post('/:id/fees/pay', upload.single('receipt'), async (req, res) => {
  try {
    const { amount, category } = req.body;
    const club = await Club.findById(req.params.id);

    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
    } else {
      return res.status(400).json({ message: "A bank transfer screenshot is required." });
    }

    // member can add multiple payments
    club.feeRecords.push({
      user: req.user._id,
      category: category || 'Membership Fee',
      receiptUrl: receiptUrl,
      status: 'Pending Verification',
      amountPaid: amount,
      lastUpdated: new Date()
    });

    await club.save();
    res.status(200).json({ message: "Payment submitted successfully! Waiting for Treasury verification." });
  } catch (err) {
    console.error("Payment Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// 3. Update a Specific Transaction (STRICTLY Treasury Only)
router.put('/:id/fees/update', async (req, res) => {
  try {
    //retrieves record ID, not student ID
    const { recordId, status, amountPaid } = req.body;
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isTreasury = club.topBoard.some(b => (b.user?._id?.toString() === requestorId || b.user?.toString() === requestorId) && ['Treasurer', 'Assistant Treasurer'].includes(b.role));

    if (!isPres && !isTreasury) {
      return res.status(403).json({ message: "Access Denied: Only the Treasury team can verify payments." });
    }

    const existingRecord = club.feeRecords.id(recordId);

    if (existingRecord) {
      existingRecord.status = status;
      existingRecord.amountPaid = amountPaid;
      existingRecord.lastUpdated = new Date();
      await club.save();
      res.status(200).json({ message: "Treasury verification complete." });
    } else {
      res.status(404).json({ message: "Transaction record not found." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ========ANNOUNCEMENT=========
// Exec Board drafts a new announcement (Pres, VP, Sec, Asst Sec)
router.post('/:id/announcements', async (req, res) => {
  try {
    const { title, content } = req.body;
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isVP = club.topBoard.some(b => b.user?.toString() === requestorId && b.role === 'Vice President');
    const isSec = club.topBoard.some(b => b.user?.toString() === requestorId && ['Secretary', 'Assistant Secretary'].includes(b.role));

    if (!isPres && !isVP && !isSec) {
      return res.status(403).json({ message: "Access Denied: You do not have permission to post announcements." });
    }

    club.announcements.push({ title, content , createdAt: new Date(), isDeleted: false });
    await club.save();
    res.status(200).json({ message: "Announcement submitted and pending Supervisor approval!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Supervisor APPROVES an announcement
router.put('/:clubId/announcements/:annId/approve', async (req, res) => {
  try {
    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }

    const club = await Club.findById(req.params.clubId);
    // Find the specific announcement inside the club's array
    const announcement = club.announcements.id(req.params.annId);

    if (!announcement) return res.status(404).json({ message: "Announcement not found." });

    announcement.isApproved = true; // Flip the flag!
    await club.save();

    res.status(200).json({ message: "Announcement approved and is now live!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Supervisor OR Exec Board EDITS an announcement
router.put('/:id/announcements/:annId/edit', async (req, res) => {
  try {
    const { title, content } = req.body;
    const requestorId = req.user._id.toString();

    const club = await Club.findById(req.params.id);

    // Strict RBAC: Supervisor, President, VP, Secretaries
    const isSupervisor = req.user.role === 'supervisor';
    const isPres = club.president?.toString() === requestorId;
    const isAuthorizedBoard = club.topBoard.some(b => b.user?.toString() === requestorId && ['Vice President', 'Secretary', 'Assistant Secretary'].includes(b.role));

    if (!isSupervisor && !isPres && !isAuthorizedBoard) {
      return res.status(403).json({ message: "Access Denied." });
    }

    const announcement = club.announcements.id(req.params.annId);
    if (!announcement) return res.status(404).json({ message: "Announcement not found." });

    // Update data
    announcement.title = title;
    announcement.content = content;

    // If a student edits it, it needs re-approval. If the Supervisor edits it, it stays approved!
    if (!isSupervisor) {
      announcement.isApproved = false;
    }

    await club.save();
    res.status(200).json({ message: "Announcement updated successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Supervisor OR Exec Board DELETES an announcement
router.delete('/:clubId/announcements/:annId', async (req, res) => {
  try {
    const requestorId = req.user._id.toString();

    const club = await Club.findById(req.params.clubId);

    const isSupervisor = req.user.role === 'supervisor';
    const isPres = club.president?.toString() === requestorId;
    const isAuthorizedBoard = club.topBoard.some(b => b.user?.toString() === requestorId && ['Vice President', 'Secretary', 'Assistant Secretary'].includes(b.role));

    if (!isSupervisor && !isPres && !isAuthorizedBoard) {
      return res.status(403).json({ message: "Access Denied." });
    }

    const announcement = club.announcements.id(req.params.annId);
    if (!announcement) return res.status(404).json({ message: "Announcement not found." });

    announcement.isDeleted = true; // Hides it from the UI but keeps the record
    await club.save();

    res.status(200).json({ message: "Announcement deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign a Board Member (President OR Vice President)
router.post('/:id/board', async (req, res) => {
  try {
    const { userId, role } = req.body;
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isVP = club.topBoard.some(b => b.user?.toString() === requestorId && b.role === 'Vice President');

    if (!isPres && !isVP) {
      return res.status(403).json({ message: "Only the President or Vice President can assign board roles." });
    }

    // Remove anyone currently holding this role, and strip this specific user of any old roles
    club.topBoard = club.topBoard.filter(b => b.role !== role);
    club.topBoard = club.topBoard.filter(b => b.user.toString() !== userId);

    club.topBoard.push({ user: userId, role });
    await club.save();

    res.status(200).json({ message: `${role} assigned successfully!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove a Board Member (President OR Vice President)
router.delete('/:id/board/:userId', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isVP = club.topBoard.some(b => b.user?.toString() === requestorId && b.role === 'Vice President');

    if (!isPres && !isVP) {
      return res.status(403).json({ message: "Only the President or Vice President can remove board members." });
    }

    club.topBoard = club.topBoard.filter(b => b.user.toString() !== req.params.userId);
    await club.save();
    res.status(200).json({ message: "Board member removed." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


//===========Sponsorships=================
// 1. Exec & Treasury publishes a new Proposal
router.post('/:id/proposals', async (req, res) => {
  try {
    const { title, description, targetAmount, proposalDocumentUrl } = req.body;

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });
    const requestorId = req.user._id.toString();

    // Strict RBAC: Only President, VP, Secretaries, and Treasurers
    const isPres = club.president?.toString() === requestorId;
    const allowedRoles = ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'];
    const isAuthorizedBoard = club.topBoard && club.topBoard.some(b => b.user?.toString() === requestorId && allowedRoles.includes(b.role));

    if (!isPres && !isAuthorizedBoard) {
      return res.status(403).json({ message: "Access Denied: Only Executive Officers and Treasurers can publish proposals." });
    }

    await Club.findByIdAndUpdate(req.params.id, {
      $push: {
        proposals: {
          title,
          description,
          targetAmount,
          proposalDocumentUrl,
          isActive: true,
          pledges: []
        }
      }
    });

    res.status(200).json({ message: "Proposal published successfully!" });
  } catch (err) {
    console.error("Proposal Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Edit a published proposal
router.put('/:id/proposals/:proposalId/edit', async (req, res) => {
  try {
    const { title, description, targetAmount, proposalDocumentUrl, isActive } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) return res.status(404).json({ message: "Club not found" });

    // Find the specific proposal inside the club's array
    const proposal = club.proposals.id(req.params.proposalId);
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });

    // Update the fields
    proposal.title = title || proposal.title;
    proposal.description = description || proposal.description;
    proposal.targetAmount = targetAmount || proposal.targetAmount;
    proposal.proposalDocumentUrl = proposalDocumentUrl || proposal.proposalDocumentUrl;

    // We explicitly check for undefined because isActive is a boolean (false is a valid state)
    if (isActive !== undefined) {
      proposal.isActive = isActive;
    }

    await club.save();
    res.json({ message: "Proposal updated successfully!" });
  } catch (error) {
    console.error("Error updating proposal:", error);
    res.status(500).json({ message: "Internal server error while updating proposal" });
  }
});

// Permanently delete a proposal
router.delete('/:id/proposals/:proposalId', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found" });

    // Remove the proposal from the array
    club.proposals.pull(req.params.proposalId);

    await club.save();
    res.json({ message: "Proposal deleted successfully." });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    res.status(500).json({ message: "Internal server error while deleting proposal" });
  }
});

// 2. Company submits a Pledge to a Proposal (Public Route)
router.post('/:clubId/proposals/:proposalId/pledge', async (req, res) => {
  try {
    const { companyName, contactEmail, amount, message } = req.body;
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: "Club not found." });

    const proposal = club.proposals.id(req.params.proposalId);
    if (!proposal || !proposal.isActive) {
      return res.status(400).json({ message: "This proposal is no longer active." });
    }

    proposal.pledges.push({ companyName, contactEmail, amount, message });
    await club.save();

    res.status(200).json({ message: "Pledge submitted successfully! The club will contact you soon." });
  } catch (err) {
    console.error("Pledge Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 3. Exec & Treasury Accepts/Rejects a Pledge
router.put('/:clubId/proposals/:proposalId/pledge/:pledgeId', async (req, res) => {
  try {
    const { status } = req.body;
    const club = await Club.findById(req.params.clubId);
    const requestorId = req.user._id.toString();

    // Strict RBAC: Only President, VP, Secretaries, and Treasurers
    const isPres = club.president?.toString() === requestorId;
    const allowedRoles = ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'];
    const isAuthorizedBoard = club.topBoard && club.topBoard.some(b => b.user?.toString() === requestorId && allowedRoles.includes(b.role));

    if (!isPres && !isAuthorizedBoard) {
      return res.status(403).json({ message: "Access Denied: You do not have permission to manage financial pledges." });
    }

    const proposal = club.proposals.id(req.params.proposalId);
    const pledge = proposal.pledges.id(req.params.pledgeId);

    pledge.status = status;
    await club.save();

    res.status(200).json({ message: `Pledge marked as ${status}.` });
  } catch (err) {
    console.error("Pledge Status Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// =============Voting Functionality===============
// 1. Supervisor Creates Election & Ballot ALL AT ONCE
router.post('/:id/elections', async (req, res) => {
  try {
    const { position, candidates } = req.body;
    const club = await Club.findById(req.params.id);

    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }
    if (!club.elections) club.elections = [];

    // Map the incoming candidates to ensure voteCount starts securely at 0
    const formattedCandidates = candidates.map(c => ({
      user: c.candidateUserId,
      manifesto: c.manifesto,
      voteCount: 0
    }));

    club.elections.push({
      position,
      isActive: false,
      isPublished: false,
      candidates: formattedCandidates,
      votedUsers: []
    });

    await club.save();
    res.status(200).json({ message: "Election and Ballot initialized successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Supervisor Edits Entire Election
router.put('/:id/elections/:electionId/edit', async (req, res) => {
  try {
    const { position, candidates } = req.body;

    // 1. Authenticate Request
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });

    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }

    // 2. Validate Election State
    const election = club.elections.id(req.params.electionId);
    if (!election) return res.status(404).json({ message: "Election not found." });

    if (election.isActive || election.isPublished || election.votedUsers.length > 0) {
      return res.status(400).json({ message: "Cannot edit an election after voting has started." });
    }

    // 3. Format Array strictly for DB injection
    const formattedCandidates = candidates.map(c => ({
      user: c.candidateUserId || c.user,
      manifesto: c.manifesto,
      voteCount: 0
    }));

    // We use a direct DB query to cleanly overwrite the nested array, bypassing memory limits
    // The `$` targets the exact election matched in the query.
    await Club.updateOne(
      { _id: req.params.id, "elections._id": req.params.electionId },
      {
        $set: {
          "elections.$.position": position,
          "elections.$.candidates": formattedCandidates
        }
      }
    );

    res.status(200).json({ message: "Election updated successfully." });
  } catch (err) {
    console.error("Election Edit Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// Auto assign election winners to the board when results are published
router.put('/:id/elections/:electionId/status', async (req, res) => {
  try {
    const { isActive, isPublished } = req.body;
    const club = await Club.findById(req.params.id);

    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }

    const election = club.elections.id(req.params.electionId);
    if (isActive !== undefined) election.isActive = isActive;

    // --- SMART AUTO-ASSIGNMENT LOGIC (With Strict Overwrite) ---
    // If the Supervisor is revealing the results for the first time,
    // automatically calculate the winner and assign them to the Top Board.
    if (isPublished === true && election.isPublished === false) {
      let winningCandidate = null;
      let maxVotes = -1;

      // Tally the votes to find the highest score
      election.candidates.forEach(candidate => {
        if (candidate.voteCount > maxVotes) {
          maxVotes = candidate.voteCount;
          winningCandidate = candidate.user;
        }
      });

      if (winningCandidate) {
        // 1. Evict whoever currently holds this position
        club.topBoard = club.topBoard.filter(b => b.role !== election.position);
        // 2. Strip the winner of any lesser roles they currently hold
        club.topBoard = club.topBoard.filter(b => b.user?.toString() !== winningCandidate.toString());

        // 3. Crown the winner
        club.topBoard.push({ user: winningCandidate, role: election.position });
      }
    }

    if (isPublished !== undefined) election.isPublished = isPublished;

    await club.save();
    res.status(200).json({ message: "Election status updated and winner processed." });
  } catch (err) {
    console.error("Election Status Error:", err);
    res.status(500).json({ message: err.message });
  }
});


// 4. Approved Member Casts a Secure Vote
router.post('/:id/elections/:electionId/vote', async (req, res) => {
  try {
    const { candidateId } = req.body;
    const userId = req.user._id;
    const club = await Club.findById(req.params.id);

    // 1. Is the election actually open?
    const election = club.elections.id(req.params.electionId);
    if (!election || !election.isActive) {
      return res.status(400).json({ message: "Voting is currently closed." });
    }

    // 2. Is the user actually an approved member? (Top Board & President are also members)
    const isMember = club.members.includes(userId);
    const isPresident = club.president?.toString() === userId.toString();
    const isTopBoard = club.topBoard.some(b => b.user?.toString() === userId.toString());

    if (!isMember && !isPresident && !isTopBoard) {
      return res.status(403).json({ message: "Only approved club members can vote." });
    }

    // 3. ANTI-FRAUD: Has this user already voted?
    if (election.votedUsers.includes(userId)) {
      return res.status(400).json({ message: "You have already cast your vote in this election." });
    }

    // 4. Record the vote securely
    const candidate = election.candidates.id(candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found." });

    candidate.voteCount += 1;
    election.votedUsers.push(userId); // Lock them out from ever voting again

    await club.save();
    res.status(200).json({ message: "Vote cast successfully! Your vote is secure." });

  } catch (err) {
    console.error("Voting Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 5. Supervisor Deletes an Old Election
router.delete('/:id/elections/:electionId', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (req.user.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }

    club.elections.pull(req.params.electionId);
    await club.save();

    res.status(200).json({ message: "Election permanently deleted." });
  } catch (err) {
    console.error("Election Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// --- MANAGE PAYMENT CATEGORIES (TREASURY & PRESIDENT) ---
router.post('/:id/categories', async (req, res) => {
  try {
    const { newCategory } = req.body;
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isTreasury = club.topBoard?.some(b => (b.user?._id?.toString() === requestorId || b.user?.toString() === requestorId) && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
    if (!isPres && !isTreasury) return res.status(403).json({ message: "Access Denied: You do not have treasury permissions." });

    if (!club.paymentCategories) club.paymentCategories = ['Membership Fee'];

    // Prevent duplicates
    if (!club.paymentCategories.includes(newCategory)) {
      club.paymentCategories.push(newCategory);
      await club.save();
      return res.status(200).json({ message: "Category added successfully." });
    } else {
      return res.status(400).json({ message: "That category already exists." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// EDIT a category
router.put('/:id/categories', async (req, res) => {
  try {
    const { oldCategory, newCategory } = req.body;
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isTreasury = club.topBoard?.some(b => (b.user?._id?.toString() === requestorId || b.user?.toString() === requestorId) && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
    if (!isPres && !isTreasury) return res.status(403).json({ message: "Access Denied." });

    if (oldCategory === 'Membership Fee') return res.status(400).json({ message: "Cannot rename the default category." });

    const catIndex = club.paymentCategories.indexOf(oldCategory);
    if (catIndex > -1) {
      club.paymentCategories[catIndex] = newCategory;
      // Update all past transactions that used the old category name!
      club.feeRecords.forEach(record => {
        if (record.category === oldCategory) record.category = newCategory;
      });
      await club.save();
      res.status(200).json({ message: "Category renamed successfully!" });
    } else {
      res.status(404).json({ message: "Category not found." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE a category
router.delete('/:id/categories/:categoryName', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isPres = club.president?.toString() === requestorId;
    const isTreasury = club.topBoard?.some(b => (b.user?._id?.toString() === requestorId || b.user?.toString() === requestorId) && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
    if (!isPres && !isTreasury) return res.status(403).json({ message: "Access Denied." });

    if (req.params.categoryName === 'Membership Fee') return res.status(400).json({ message: "Cannot delete the default category." });

    club.paymentCategories = club.paymentCategories.filter(c => c !== req.params.categoryName);
    await club.save();
    res.status(200).json({ message: "Category deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// --- MANAGE EXPENSES (TREASURY ONLY) ---
// 1. ADD EXPENSE
router.post('/:id/expenses', upload.single('receipt'), async (req, res) => {
  try {
    const { title, amount, description, date } = req.body;
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isTreasury = club.topBoard?.some(b => (b.user?._id?.toString() === requestorId || b.user?.toString() === requestorId) && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
    if (!isTreasury) return res.status(403).json({ message: "Access Denied: Only Treasury can log expenses." });

    if (!club.expenses) club.expenses = [];

    let receiptUrl = '';
    if (req.file) receiptUrl = `/uploads/${req.file.filename}`;

    club.expenses.push({
      title,
      amount: Number(amount),
      description,
      date: date || new Date(),
      loggedBy: req.user._id,
      receiptUrl
    });

    await club.save();
    res.status(200).json({ message: "Expense logged successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. EDIT EXPENSE (Flags it as edited)
router.put('/:id/expenses/:expenseId', upload.single('receipt'), async (req, res) => {
  try {
    const { title, amount, description, date } = req.body;
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isTreasury = club.topBoard?.some(b => (b.user?._id?.toString() === requestorId || b.user?.toString() === requestorId) && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
    if (!isTreasury) return res.status(403).json({ message: "Access Denied." });

    const expense = club.expenses.id(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found." });

    expense.title = title || expense.title;
    expense.amount = amount ? Number(amount) : expense.amount;
    expense.description = description || expense.description;
    expense.date = date || expense.date;
    expense.isEdited = true; // FLAG IT!

    if (req.file) expense.receiptUrl = `/uploads/${req.file.filename}`;

    await club.save();
    res.status(200).json({ message: "Expense updated and flagged." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. DELETE EXPENSE (Soft Delete)
router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const requestorId = req.user._id.toString();

    const isTreasury = club.topBoard?.some(b => (b.user?._id?.toString() === requestorId || b.user?.toString() === requestorId) && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
    if (!isTreasury) return res.status(403).json({ message: "Access Denied." });

    const expense = club.expenses.id(req.params.expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found." });

    // SOFT DELETE: Don't pull it, just hide it!
    expense.isDeleted = true;
    await club.save();

    res.status(200).json({ message: "Expense soft-deleted and archived." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. Single club FINANCIAL ANALYTICS ALGORITHM
router.get('/:id/analytics', async (req, res) => {
  try {
    const clubId = new mongoose.Types.ObjectId(req.params.id);
    const club = await Club.findById(clubId);
    if (!club) return res.status(404).json({ message: "Club not found." });

    // A. Fetch All 3 Revenue/Expense Streams (fees/pledges/expense)
    const feeAnalytics = await Club.aggregate([
      { $match: { _id: clubId } }, { $unwind: "$feeRecords" }, { $match: { "feeRecords.status": "Paid" } },
      { $group: { _id: { month: { $month: "$feeRecords.lastUpdated" } }, total: { $sum: "$feeRecords.amountPaid" } } }
    ]);

    const pledgeAnalytics = await Club.aggregate([
      { $match: { _id: clubId } }, { $unwind: "$proposals" }, { $unwind: "$proposals.pledges" }, { $match: { "proposals.pledges.status": "Accepted" } },
      { $group: { _id: { month: { $month: "$proposals.pledges.date" } }, total: { $sum: "$proposals.pledges.amount" } } }
    ]);

   const expenseAnalytics = await Club.aggregate([
      { $match: { _id: clubId } },
      { $unwind: "$expenses" },
      { $match: { "expenses.isDeleted": { $ne: true } } }, // THE FIX: Only count active expenses!
      { $group: { _id: { month: { $month: "$expenses.date" } }, total: { $sum: "$expenses.amount" } } }
    ]);

    // B. Build the 12-Month Segmented Array
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let chartData = months.map((month) => ({
      name: month,
      monthlyFees: 0,
      monthlySponsorships: 0,
      monthlyExpenses: 0
    }));

    // Inject exact monthly data into their specific buckets
    feeAnalytics.forEach(r => { chartData[r._id.month - 1].monthlyFees += r.total; });
    pledgeAnalytics.forEach(r => { chartData[r._id.month - 1].monthlySponsorships += r.total; });
    expenseAnalytics.forEach(r => { chartData[r._id.month - 1].monthlyExpenses += r.total; });

    // C. Process Cumulative YTD Totals for the Area Chart
    let ytdFees = 0;
    let ytdSponsorships = 0;
    let ytdExpenses = 0;

    chartData = chartData.map(data => {
      ytdFees += data.monthlyFees;
      ytdSponsorships += data.monthlySponsorships;
      ytdExpenses += data.monthlyExpenses;

      return {
        ...data,
        ytdFees,
        ytdSponsorships,
        ytdExpenses,
        ytdRevenue: ytdFees + ytdSponsorships, // Kept for the PDF Generator
      };
    });

    res.status(200).json({ chartData, expenses: club.expenses });
  } catch (err) {
    console.error("Analytics Pipeline Error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
