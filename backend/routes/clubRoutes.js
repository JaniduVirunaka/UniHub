const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Club = require('../models/Club');
const User = require('../models/User'); // We need the user model to fetch names


// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Saves to the folder we created
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

// Get a SINGLE club by ID
router.get('/:id', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('president', 'name email')
      .populate('pendingMembers', 'name email')
      .populate('members', 'name email')
      .populate('topBoard.user', 'name email');
      
    if (!club) return res.status(404).json({ message: "Club not found" });
    res.json(club);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 1. Create a new club (SUPERVISOR ONLY - Now supports Logo Upload)
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const { name, description, mission, membershipFee, supervisorId, presidentId, rulesAndRegulations } = req.body;

    const requestor = await User.findById(supervisorId);
    if (!requestor || requestor.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied: Only Supervisors can create clubs." });
    }

    if (presidentId) {
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

// 2. Update a club (SUPERVISOR ONLY - Edit details or change Logo)
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const { name, description, mission, presidentId, supervisorId, rulesAndRegulations } = req.body;
    
    const requestor = await User.findById(supervisorId);
    if (!requestor || requestor.role !== 'supervisor') {
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

    // Update the logo only if a new file was uploaded
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
    const { supervisorId } = req.body; 
    
    const requestor = await User.findById(supervisorId);
    if (!requestor || requestor.role !== 'supervisor') {
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
    const { userId } = req.body;

    // SAFEGUARD: Ensure the arrays exist (for clubs created before the schema update)
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
    // Log the exact error to the backend terminal to help us debug
    console.error("Join Error:", err); 
    res.status(500).json({ message: err.message });
  }
});

// President OR Vice President approves a student
router.post('/:id/approve', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const { studentId, presidentId } = req.body; // 'presidentId' is the ID of the user making the request

    const isPres = club.president?.toString() === presidentId;
    const isVP = club.topBoard.some(b => b.user?.toString() === presidentId && b.role === 'Vice President');

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
    const { studentId, presidentId } = req.body;

    const isPres = club.president?.toString() === presidentId;
    const isVP = club.topBoard.some(b => b.user?.toString() === presidentId && b.role === 'Vice President');

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
// CHANGE: upload.single('image') becomes upload.array('images', 10) (Max 10 photos)
router.post('/:id/achievements', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, dateAwarded, userId } = req.body;
    const club = await Club.findById(req.params.id);

    const isPres = club.president?.toString() === userId;
    const isAuthorizedBoard = club.topBoard?.some(b => b.user?.toString() === userId && ['Vice President', 'Secretary', 'Assistant Secretary'].includes(b.role));

    if (!isPres && !isAuthorizedBoard) {
      return res.status(403).json({ message: "Access Denied: Only Exco can post achievements." });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image file is required." });
    }

    // Map through ALL uploaded files and create an array of paths
    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

    club.achievements.push({ title, description, dateAwarded, imageUrls, addedBy: userId });
    await club.save();

    res.status(200).json({ message: "Achievement added to the Trophy Room!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. EDIT an Achievement (Handles optional new images)
router.put('/:id/achievements/:achvId', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, dateAwarded, userId } = req.body;
    const club = await Club.findById(req.params.id);

    const isPres = club.president?.toString() === userId;
    const isAuthorizedBoard = club.topBoard?.some(b => b.user?.toString() === userId && ['Vice President', 'Secretary', 'Assistant Secretary'].includes(b.role));

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
    const { requestorId } = req.body; // Can be Supervisor or Exco
    const club = await Club.findById(req.params.id);

    const isSupervisor = club.supervisor?.toString() === requestorId;
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

// --- MEMBERSHIP FEE LEDGER ROUTES ---
// 1. Fetch the Fee Ledger & Member List
router.get('/:id/fees', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('members', 'name email')
      .populate('feeRecords.user', 'name email');

    if (!club) return res.status(404).json({ message: "Club not found." });
    
    // Send back the club's required fee, the list of members, and the ledger
    res.status(200).json({ 
      membershipFee: club.membershipFee, 
      members: club.members, 
      feeRecords: club.feeRecords 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Student Submits a Payment (Simulated Gateway)
router.post('/:id/fees/pay', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const club = await Club.findById(req.params.id);

    // Look for their record
    const existingRecord = club.feeRecords.find(f => f.user?.toString() === userId);

    if (existingRecord) {
      existingRecord.status = 'Pending Verification'; // Flips status so Treasury knows to check!
      existingRecord.amountPaid = amount;
      existingRecord.lastUpdated = new Date();
    } else {
      club.feeRecords.push({
        user: userId,
        status: 'Pending Verification',
        amountPaid: amount,
        lastUpdated: new Date()
      });
    }

    await club.save();
    res.status(200).json({ message: "Payment submitted successfully! Waiting for Treasury verification." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Update a Member's Fee Status (STRICTLY Treasury Only)
router.put('/:id/fees/update', async (req, res) => {
  try {
    const { studentId, status, amountPaid, requestorId } = req.body;
    const club = await Club.findById(req.params.id);

    // STRICT RBAC: Only President and Treasurers! (Secretaries are locked out)
    const isPres = club.president?.toString() === requestorId;
    const isTreasury = club.topBoard.some(b => b.user?.toString() === requestorId && ['Treasurer', 'Assistant Treasurer'].includes(b.role));

    if (!isPres && !isTreasury) {
      return res.status(403).json({ message: "Access Denied: Only the Treasury team can verify payments." });
    }

    const existingRecord = club.feeRecords.find(f => f.user?.toString() === studentId);

    if (existingRecord) {
      existingRecord.status = status;
      existingRecord.amountPaid = amountPaid;
      existingRecord.lastUpdated = new Date();
    } else {
      club.feeRecords.push({ user: studentId, status, amountPaid, lastUpdated: new Date() });
    }

    await club.save();
    res.status(200).json({ message: "Treasury verification complete." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Exec Board drafts a new announcement (Pres, VP, Sec, Asst Sec)
router.post('/:id/announcements', async (req, res) => {
  try {
    const { title, content, presidentId } = req.body;
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });
    
    const isPres = club.president?.toString() === presidentId;
    const isVP = club.topBoard.some(b => b.user?.toString() === presidentId && b.role === 'Vice President');
    const isSec = club.topBoard.some(b => b.user?.toString() === presidentId && ['Secretary', 'Assistant Secretary'].includes(b.role));

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
    const { supervisorId } = req.body;
    const requestor = await User.findById(supervisorId);
    if (!requestor || requestor.role !== 'supervisor') {
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
    // Look for userId (from students) OR supervisorId (from admins)
    const { title, content, userId, supervisorId } = req.body;
    const requestorId = userId || supervisorId; 

    const club = await Club.findById(req.params.id);

    // Strict RBAC: Supervisor, President, VP, Secretaries
    const isSupervisor = club.supervisor?.toString() === requestorId;
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
    // Check for either supervisorId (from Global Dash) or userId (from Club Hub)
    const { supervisorId, userId } = req.body; 
    const requestorId = supervisorId || userId;
    
    const club = await Club.findById(req.params.clubId);

    const isSupervisor = club.supervisor?.toString() === requestorId;
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
    const { userId, role, presidentId } = req.body;
    const club = await Club.findById(req.params.id);

    const isPres = club.president?.toString() === presidentId;
    const isVP = club.topBoard.some(b => b.user?.toString() === presidentId && b.role === 'Vice President');

    if (!isPres && !isVP) {
      return res.status(403).json({ message: "Only the President or Vice President can assign board roles." });
    }

    club.topBoard = club.topBoard.filter(b => b.role !== role);
    club.topBoard = club.topBoard.filter(b => b.user.toString() !== userId);
    
    club.topBoard.push({ user: userId, role });
    await club.save();
    
    res.status(200).json({ message: `${role} assigned successfully!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Auto assign election winners to the board when results are published
router.put('/:id/elections/:electionId/status', async (req, res) => {
  try {
    const { isActive, isPublished, supervisorId } = req.body;
    const club = await Club.findById(req.params.id);

    if (club.supervisor?.toString() !== supervisorId) {
      return res.status(403).json({ message: "Access Denied." });
    }

    const election = club.elections.id(req.params.electionId);
    if (isActive !== undefined) election.isActive = isActive;
    
    // --- SMART AUTO-ASSIGNMENT LOGIC (With Strict Overwrite) ---
    if (isPublished === true && election.isPublished === false) {
      let winningCandidate = null;
      let maxVotes = -1;
      
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

// Remove a Board Member (President OR Vice President)
router.delete('/:id/board/:userId', async (req, res) => {
  try {
    const { presidentId } = req.body;
    const club = await Club.findById(req.params.id);

    const isPres = club.president?.toString() === presidentId;
    const isVP = club.topBoard.some(b => b.user?.toString() === presidentId && b.role === 'Vice President');

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

// 1. Exec & Treasury publishes a new Proposal (BULLETPROOF DB VERSION)
router.post('/:id/proposals', async (req, res) => {
  try {
    const { title, description, targetAmount, proposalDocumentUrl, userId } = req.body;
    
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });

    // Strict RBAC: Only President, VP, Secretaries, and Treasurers
    const isPres = club.president?.toString() === userId;
    const allowedRoles = ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'];
    const isAuthorizedBoard = club.topBoard && club.topBoard.some(b => b.user?.toString() === userId && allowedRoles.includes(b.role));
    
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
    const { status, userId } = req.body; 
    const club = await Club.findById(req.params.clubId);

    // Strict RBAC: Only President, VP, Secretaries, and Treasurers
    const isPres = club.president?.toString() === userId;
    const allowedRoles = ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'];
    const isAuthorizedBoard = club.topBoard && club.topBoard.some(b => b.user?.toString() === userId && allowedRoles.includes(b.role));
    
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


// Voting Functionality
// 1. Supervisor Creates Election & Ballot ALL AT ONCE
router.post('/:id/elections', async (req, res) => {
  try {
    const { position, candidates, supervisorId } = req.body;
    const club = await Club.findById(req.params.id);

    if (club.supervisor?.toString() !== supervisorId) {
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

// 2. Supervisor Edits Entire Election (THE NATIVE DB OVERWRITE)
router.put('/:id/elections/:electionId/edit', async (req, res) => {
  try {
    const { position, candidates, supervisorId } = req.body;
    
    // 1. Authenticate Request
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });

    if (club.supervisor?.toString() !== supervisorId) {
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

    // 4. THE FIX: Force a raw database write, completely bypassing Mongoose's memory cache.
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

// 3. Supervisor Toggles Election Status 
router.put('/:id/elections/:electionId/status', async (req, res) => {
  try {
    const { isActive, isPublished, supervisorId } = req.body;
    const club = await Club.findById(req.params.id);

    if (club.supervisor?.toString() !== supervisorId) {
      return res.status(403).json({ message: "Access Denied." });
    }

    const election = club.elections.id(req.params.electionId);
    
    // Update the basic statuses
    if (isActive !== undefined) election.isActive = isActive;
    
    // auto assignment
    // If the Supervisor is publishing the results for the first time...
    if (isPublished === true && election.isPublished === false) {
      
      // 1. Find the candidate with the highest votes
      let winningCandidate = null;
      let maxVotes = -1;
      
      election.candidates.forEach(candidate => {
        if (candidate.voteCount > maxVotes) {
          maxVotes = candidate.voteCount;
          winningCandidate = candidate.user;
        }
      });

      // 2. If we found a winner, automatically promote them to the Top Board!
      if (winningCandidate) {
        const alreadyOnBoard = club.topBoard.find(b => b.user?.toString() === winningCandidate.toString());
        
        if (!alreadyOnBoard) {
          // Add them to the board with the title of the election (e.g., "Secretary 2026/2027")
          club.topBoard.push({ user: winningCandidate, role: election.position });
        } else {
          // If they were already on the board in a lesser role, upgrade their title
          alreadyOnBoard.role = election.position;
        }
      }
    }

    // Set the published status AFTER our logic runs
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
    const { userId, candidateId } = req.body;
    const club = await Club.findById(req.params.id);

    // 1. Is the election actually open?
    const election = club.elections.id(req.params.electionId);
    if (!election || !election.isActive) {
      return res.status(400).json({ message: "Voting is currently closed." });
    }

    // 2. Is the user actually an approved member? (Top Board & President are also members)
    const isMember = club.members.includes(userId);
    const isPresident = club.president?.toString() === userId;
    const isTopBoard = club.topBoard.some(b => b.user?.toString() === userId);

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
    const { supervisorId } = req.body; // Sent via axios data payload
    const club = await Club.findById(req.params.id);

    if (club.supervisor?.toString() !== supervisorId) {
      return res.status(403).json({ message: "Access Denied." });
    }

    // Mongoose command to safely remove a sub-document
    club.elections.pull(req.params.electionId);
    await club.save();

    res.status(200).json({ message: "Election permanently deleted." });
  } catch (err) {
    console.error("Election Delete Error:", err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;