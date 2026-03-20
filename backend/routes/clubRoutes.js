const express = require('express');
const router = express.Router();
const Club = require('../models/Club');

// Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await Club.find();
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new club
router.post('/', async (req, res) => {
  const club = new Club({
    name: req.body.name,
    description: req.body.description,
    mission: req.body.mission
  });
  try {
    const newClub = await club.save();
    res.status(201).json(newClub);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;