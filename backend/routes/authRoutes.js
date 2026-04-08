const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const { name, password, studentId, department, year } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Pre-save hook handles hashing — do NOT hash manually here
    const newUser = new User({
      name,
      email,
      password,
      ...(studentId  && { studentId }),
      ...(department && { department }),
      ...(year       && { year: parseInt(year) })
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
    const { password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Google OAuth users have no password
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please use Google to log in.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET ALL USERS (supervisor use)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GOOGLE OAUTH ROUTE
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email.toLowerCase();
    const name = payload.name;

    let user = await User.findOne({ email });

    if (user) {
      const token = signToken(user);
      return res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } else {
      user = new User({ name, email, authProvider: 'google' });
      await user.save();
      const token = signToken(user);
      return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    }
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ message: 'Failed to authenticate with Google.' });
  }
});

// REGISTER — alias used by sport module + event module (supports studentId/department/year)
router.post('/register', async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    const { name, password, studentId, department, year } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Pre-save hook handles hashing
    const newUser = new User({
      name,
      email,
      password,
      ...(studentId  && { studentId }),
      ...(department && { department }),
      ...(year       && { year: parseInt(year) })
    });

    await newUser.save();
    const token = signToken(newUser);
    res.status(201).json({ token, message: 'User registered successfully', user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /auth/profile — returns the authenticated user's profile
router.get('/profile', protect, async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /auth/profile — updates name, department, year, phone
router.put('/profile', protect, async (req, res) => {
  try {
    const fields = ['name', 'department', 'year', 'phone'];
    const updates = Object.fromEntries(
      fields.filter(f => req.body[f] !== undefined).map(f => [f, req.body[f]])
    );
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
