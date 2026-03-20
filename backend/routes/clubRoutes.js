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

// Create a new club (Only allows users marked as 'club_admin' from the frontend)
router.post('/', async (req, res) => {
  const { name, description, mission, userId } = req.body;
  
  const club = new Club({
    name,
    description,
    mission,
    president: userId // The user creating the club becomes the president
  });
  
  try {
    const newClub = await club.save();
    res.status(201).json(newClub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Student requests to join a club
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