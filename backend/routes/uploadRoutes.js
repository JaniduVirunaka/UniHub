const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'profilePicture') {
      cb(null, 'uploads/profiles/');
    } else if (file.fieldname === 'posterImage') {
      cb(null, 'uploads/events/');
    } else if (file.fieldname === 'logo') {
      cb(null, 'uploads/logos/');
    } else {
      cb(null, 'uploads/');
    }
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
router.post('/profile-picture', protect, upload.single('profilePicture'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ message: 'Profile picture uploaded', filename: req.file.filename });
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