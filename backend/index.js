const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
connectDB();

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

const clubRouter = require('./routes/clubRoutes');
const authRouter = require('./routes/authRoutes');
const sportRouter = require('./routes/sportRoutes');
const requestRouter = require('./routes/requestRoutes');

app.use('/api/auth', authRouter);
app.use('/api/clubs', clubRouter);
app.use('/api/sports', sportRouter);
app.use('/api/requests', requestRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
