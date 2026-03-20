const express = require('express');
const router = express.Router();
const Club = require('../models/Club');
const User = require('../models/User'); // We need the user model to fetch names

// Get all clubs (and populate the president's name so we can display it)
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find().populate('president', 'name').populate('pendingMembers', 'name email');
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new club (STRICTLY FOR SUPERVISORS)
router.post('/', async (req, res) => {
  try {
    const { name, description, mission, membershipFee, supervisorId, presidentId } = req.body;

    // 1. Security Check: Is the person requesting this actually a Supervisor?
    const requestor = await User.findById(supervisorId);
    if (!requestor || requestor.role !== 'supervisor') {
      return res.status(403).json({ message: "Access Denied: Only Supervisors can create clubs." });
    }

    // 2. Find the student who is being promoted
    const assignedPresident = await User.findById(presidentId);
    if (!assignedPresident) {
      return res.status(400).json({ message: "The assigned president does not exist in the system." });
    }

    // 3. Upgrade their role in the database!
    if (assignedPresident.role === 'student') {
      assignedPresident.role = 'president';
      await assignedPresident.save();
    }

    // 4. Create the new club with the relationships linked
    const newClub = new Club({
      name,
      description,
      mission,
      membershipFee: membershipFee || 0,
      supervisor: supervisorId,
      president: presidentId
    });
    
    await newClub.save();
    res.status(201).json({ message: "Club created and President assigned successfully!", club: newClub });

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

module.exports = router;