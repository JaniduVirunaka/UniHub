const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    res.status(201).json({ message: 'User created successfully!' });

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

    // 3. If successful, send back the user data (excluding the password)
    res.status(200).json({ 
      message: 'Login successful', 
      user: { id: user._id, name: user.name, email: user.email, role: user.role } 
    });

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
      // SCENARIO A: They exist! (Even if they originally signed up via email, we let them in)
      return res.status(200).json({ 
        message: 'Google Login successful', 
        user: { id: user._id, name: user.name, email: user.email, role: user.role } 
      });
    } else {
      // SCENARIO B: Brand new user! Create them silently.
      user = new User({
        name: name,
        email: email,
        authProvider: 'google'
        // Notice we DO NOT save a password here!
      });
      
      await user.save();
      return res.status(201).json({ 
        message: 'Google Signup successful', 
        user: { id: user._id, name: user.name, email: user.email, role: user.role } 
      });
    }
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({ message: "Failed to authenticate with Google." });
  }
});

module.exports = router;