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

const clubRouter    = require('./routes/clubRoutes');
const authRouter    = require('./routes/authRoutes');
const sportRouter   = require('./routes/sportRoutes');
const requestRouter = require('./routes/requestRoutes');
const eventRouter   = require('./routes/eventRoutes');
const cartRouter    = require('./routes/cartRoutes');
const regRouter     = require('./routes/registrationRoutes');
const reviewsRouter = require('./routes/reviewsRoutes');
const uploadRouter  = require('./routes/uploadRoutes');

app.use('/api/auth',          authRouter);
app.use('/api/clubs',         clubRouter);
app.use('/api/sports',        sportRouter);
app.use('/api/requests',      requestRouter);
app.use('/api/events',        eventRouter);
app.use('/api/cart',          cartRouter);
app.use('/api/registrations', regRouter);
app.use('/api/reviews',       reviewsRouter);
app.use('/api/upload',        uploadRouter);

// Global error handler (used by event controllers that call next(error))
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
