const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User'); // We need the user model to fetch names

// Get all clubs 
router.get('/', async (req, res) => {
  try {
    // NEW: Added .populate('members') so we can filter "My Clubs" on the frontend
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

// Create a new club (STRICTLY FOR SUPERVISORS)
router.post('/', async (req, res) => {
  try {
    const { name, description, mission, membershipFee, supervisorId, presidentId } = req.body;

    const requestor = await User.findById(supervisorId);
    if (!requestor || requestor.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied: Only Supervisors can create clubs." });
    }

    // Upgrade the user to president ONLY if a presidentId was actually provided
    if (presidentId) {
      const assignedPresident = await User.findById(presidentId);
      if (assignedPresident && assignedPresident.role === 'student') {
        assignedPresident.role = 'president';
        await assignedPresident.save();
      }
    }

    const newClub = new Club({
      name,
      description,
      mission,
      membershipFee: membershipFee || 0,
      supervisor: supervisorId,
      president: presidentId || null // Leaves it empty if no president is assigned
    });
    
    await newClub.save();
    res.status(201).json({ message: "Club created successfully!", club: newClub });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a club (Edit details or change President)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, mission, presidentId, supervisorId } = req.body;
    
    const requestor = await User.findById(supervisorId);
    if (!requestor || requestor.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });

    // Handle President Change Logic
    if (presidentId !== club.president?.toString()) {
      // 1. Downgrade the OLD president back to a student
      if (club.president) {
        const oldPres = await User.findById(club.president);
        if (oldPres) {
          oldPres.role = 'student';
          await oldPres.save();
        }
      }
      // 2. Upgrade the NEW president
      if (presidentId) {
        const newPres = await User.findById(presidentId);
        if (newPres && newPres.role === 'student') {
          newPres.role = 'president';
          await newPres.save();
        }
      }
      club.president = presidentId || null;
    }

    // Update the text fields
    club.name = name || club.name;
    club.description = description || club.description;
    club.mission = mission || club.mission;

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

// President approves a student
router.post('/:id/approve', async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    const { studentId, presidentId } = req.body;

    // Security check: Make sure the person approving is actually the president
    if (club.president.toString() !== presidentId) {
      return res.status(403).json({ message: "Only the club president can approve members." });
    }

    // Move from pending to members
    club.pendingMembers = club.pendingMembers.filter(id => id.toString() !== studentId);
    club.members.push(studentId);
    
    await club.save();
    res.status(200).json({ message: "Student approved successfully!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// President drafts a new announcement
router.post('/:id/announcements', async (req, res) => {
  try {
    const { title, content, presidentId } = req.body;
    const club = await Club.findById(req.params.id);

    if (!club) return res.status(404).json({ message: "Club not found." });
    
    // Security check: Ensure the person posting is actually THIS club's president
    if (club.president?.toString() !== presidentId) {
      return res.status(403).json({ message: "Access Denied: Only the club president can post announcements." });
    }

    // Push the new announcement into the array. 
    // It defaults to isApproved: false based on our schema!
    club.announcements.push({ title, content });
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

// Supervisor REJECTS/DELETES an announcement
router.delete('/:clubId/announcements/:annId', async (req, res) => {
  try {
    const { supervisorId } = req.body; // In an axios delete, we pass this in the 'data' object
    const requestor = await User.findById(supervisorId);
    if (!requestor || requestor.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied." });
    }

    const club = await Club.findById(req.params.clubId);
    // Mongoose command to remove a sub-document by its ID
    club.announcements.pull(req.params.annId); 
    await club.save();
    
    res.status(200).json({ message: "Announcement rejected and removed." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assign a Board Member (President Only)
router.post('/:id/board', async (req, res) => {
  try {
    const { userId, role, presidentId } = req.body;
    const club = await Club.findById(req.params.id);

    if (club.president?.toString() !== presidentId) {
      return res.status(403).json({ message: "Only the president can assign board roles." });
    }

    // Check if the user is already on the board to prevent duplicates
    const alreadyOnBoard = club.topBoard.find(b => b.user.toString() === userId);
    if (alreadyOnBoard) {
      return res.status(400).json({ message: "This member is already on the board." });
    }

    club.topBoard.push({ user: userId, role });
    await club.save();
    
    res.status(200).json({ message: `${role} assigned successfully!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove a Board Member (President Only)
router.delete('/:id/board/:userId', async (req, res) => {
  try {
    const { presidentId } = req.body;
    const club = await Club.findById(req.params.id);

    if (club.president?.toString() !== presidentId) {
      return res.status(403).json({ message: "Only the president can remove board members." });
    }

    // Filter out the specific user from the topBoard array
    club.topBoard = club.topBoard.filter(b => b.user.toString() !== req.params.userId);
    await club.save();

    res.status(200).json({ message: "Board member removed." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 1. Top Board publishes a new Proposal (BULLETPROOF DB VERSION)
router.post('/:id/proposals', async (req, res) => {
  try {
    const { title, description, targetAmount, proposalDocumentUrl, userId } = req.body;
    
    // 1. Fetch the club just to verify permissions
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });

    const isPresident = club.president?.toString() === userId;
    const isBoardMember = club.topBoard && club.topBoard.some(b => b.user?.toString() === userId);
    
    if (!isPresident && !isBoardMember) {
      return res.status(403).json({ message: "Only the Top Board can publish proposals." });
    }

    // 2. The Native MongoDB $push command!
    // This forcefully injects the data into the database, ignoring local memory issues.
    await Club.findByIdAndUpdate(req.params.id, {
      $push: {
        proposals: {
          title,
          description,
          targetAmount,
          proposalDocumentUrl,
          isActive: true, // Explicitly forcing this to true so the frontend sees it
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

// 3. Top Board Accepts/Rejects a Pledge
router.put('/:clubId/proposals/:proposalId/pledge/:pledgeId', async (req, res) => {
  try {
    const { status, userId } = req.body; 
    const club = await Club.findById(req.params.clubId);

    const isPresident = club.president?.toString() === userId;
    const isBoardMember = club.topBoard && club.topBoard.some(b => b.user?.toString() === userId);
    
    if (!isPresident && !isBoardMember) {
      return res.status(403).json({ message: "Access Denied." });
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
// 1. Supervisor Creates a New Election 
router.post('/:id/elections', async (req, res) => {
  try {
    const { position, supervisorId } = req.body;
    
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found." });

    // Self-Healing: Assign supervisor if missing
    if (!club.supervisor) {
      club.supervisor = supervisorId;
    } else if (club.supervisor.toString() !== supervisorId) {
      return res.status(403).json({ message: "Access Denied: Only the assigned Club Supervisor can initiate elections." });
    }

    // Initialize array if it doesn't exist
    if (!club.elections) club.elections = [];

    // Use Mongoose to push so it automatically generates an _id!
    club.elections.push({
      position,
      isActive: false,
      isPublished: false,
      candidates: [],
      votedUsers: []
    });

    await club.save();
    res.status(200).json({ message: "Election initialized successfully." });
  } catch (err) {
    console.error("Election Creation Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 2. Supervisor Adds a Candidate to the Ballot
router.post('/:id/elections/:electionId/candidates', async (req, res) => {
  try {
    const { candidateUserId, manifesto, supervisorId } = req.body;
    const club = await Club.findById(req.params.id);

    if (club.supervisor?.toString() !== supervisorId) {
      return res.status(403).json({ message: "Access Denied." });
    }

    const election = club.elections.id(req.params.electionId);
    if (!election) return res.status(404).json({ message: "Election not found." });

    // Ensure the candidate isn't already on the ballot
    const alreadyNominated = election.candidates.find(c => c.user?.toString() === candidateUserId);
    if (alreadyNominated) return res.status(400).json({ message: "This student is already on the ballot." });

    election.candidates.push({ user: candidateUserId, manifesto, voteCount: 0 });
    await club.save();

    res.status(200).json({ message: "Candidate added to the ballot." });
  } catch (err) {
    console.error("Candidate Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// 3. Supervisor Toggles Election Status (Open Voting / Publish Results)
router.put('/:id/elections/:electionId/status', async (req, res) => {
  try {
    const { isActive, isPublished, supervisorId } = req.body;
    const club = await Club.findById(req.params.id);

    if (club.supervisor?.toString() !== supervisorId) {
      return res.status(403).json({ message: "Access Denied." });
    }

    const election = club.elections.id(req.params.electionId);
    if (isActive !== undefined) election.isActive = isActive;
    if (isPublished !== undefined) election.isPublished = isPublished;

    await club.save();
    res.status(200).json({ message: "Election status updated." });
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

module.exports = router;