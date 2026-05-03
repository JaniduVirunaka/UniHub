const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dir;
    if (file.fieldname === 'profilePicture') {
      dir = 'uploads/profiles/';
    } else if (file.fieldname === 'posterImage') {
      dir = 'uploads/events/';
    } else if (file.fieldname === 'logo') {
      dir = 'uploads/logos/';
    } else {
      dir = 'uploads/';
    }
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      // ignore mkdir errors and let multer surface if something else fails
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

// Routes
router.post('/profile-picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const filename = req.file.filename;
    const user = await User.findByIdAndUpdate(req.user._id, { profilePicture: filename }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile picture uploaded', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/event-poster', protect, upload.single('posterImage'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ message: 'Poster uploaded', filename: req.file.filename });
});

router.post('/logo', protect, upload.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ message: 'Logo uploaded', filename: req.file.filename });
});

module.exports = router;