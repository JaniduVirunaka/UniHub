const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();  //emails must be lowercase
    const { name, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // 2. Hash the password with salt value
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create and save the new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await newUser.save();
    const token = signToken(newUser);
    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    // 1. Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // 2. Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // 3. If successful, issue JWT and return user data
    const token = signToken(user);
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL USERS (For the Supervisor to assign roles)
router.get('/users', async (req, res) => {
  try {
    // .select('-password') ensures we never send passwords to the frontend
    const users = await User.find().select('-password'); 
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- NEW: GOOGLE OAUTH ROUTE ---
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    // 1. Verify the VIP ticket with Google's servers
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    // Extract their payload (Name and Email) from the verified ticket
    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();
    const name = payload.name;

    // 2. Check if this person already exists in our database
    let user = await User.findOne({ email });

    if (user) {
      // SCENARIO A: They exist — issue token and return user
      const token = signToken(user);
      return res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } else {
      // SCENARIO B: Brand new user — create silently then issue token
      user = new User({ name, email, authProvider: 'google' });
      await user.save();
      const token = signToken(user);
      return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ message: "Failed to authenticate with Google." });
  }
});

// Alias for sport-module frontend which calls /auth/register
router.post('/register', async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const { name, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;