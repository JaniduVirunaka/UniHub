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

module.exports = router;