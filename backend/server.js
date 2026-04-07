const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    await seedDefaultUsers();
    await seedDefaultEvents();
  })
  .catch(err => console.log('MongoDB connection error:', err));

const Event = require('./models/Event');
const User = require('./models/User');

async function seedDefaultEvents() {
  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      console.log('No events found. Seeding default events...');
      const organizer = await User.findOne({ email: 'organizer@unihub.test' }).lean();
      await Event.insertMany([
        {
          title: 'Campus Tech Fest',
          description: 'A day of tech talks, workshops, and networking.',
          eventType: 'event',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          time: '09:00',
          location: 'Main Auditorium',
          organizer: organizer?._id,
          totalCapacity: 150,
          availableTickets: 150,
          ticketPrice: 0,
          bankAccount: '1234567890',
          whatsappNumber: '+94771234567'
        },
        {
          title: 'Robotics Club Launch',
          description: 'Join the robotics club and build competitive robots.',
          eventType: 'club',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          time: '14:00',
          location: 'Engineering Lab',
          organizer: organizer?._id,
          totalCapacity: 100,
          availableTickets: 100,
          ticketPrice: 0,
          bankAccount: '1234567890',
          whatsappNumber: '+94771234567'
        },
        {
          title: 'Battle of the Bands (Ticketed)',
          description: 'Live music night. Ticket required.',
          eventType: 'event',
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          time: '18:30',
          location: 'Open Air Theater',
          organizer: organizer?._id,
          totalCapacity: 200,
          availableTickets: 200,
          ticketPrice: 500,
          bankAccount: '001234567890',
          whatsappNumber: '+94770001122'
        }
      ]);
      console.log('Seed data inserted.');
    } else {
      console.log(`${count} events already exist.`);
    }
  } catch (error) {
    console.error('Error seeding events:', error);
  }
}

async function seedDefaultUsers() {
  try {
    const organizerEmail = 'organizer@unihub.test';
    const studentEmail = 'student@unihub.test';

    const organizer = await User.findOne({ email: organizerEmail });
    if (!organizer) {
      await User.create({
        name: 'Default Organizer',
        email: organizerEmail,
        password: 'Password123!',
        studentId: 'ORG-0001',
        department: 'Clubs & Events',
        year: 4,
        role: 'admin'
      });
      console.log('Seed organizer user created.');
    }

    const student = await User.findOne({ email: studentEmail });
    if (!student) {
      await User.create({
        name: 'Default Student',
        email: studentEmail,
        password: 'Password123!',
        studentId: 'STU-1001',
        department: 'IT',
        year: 2,
        role: 'user'
      });
      console.log('Seed student user created.');
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

// Routes (to be added)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/reviews', require('./routes/reviewsRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
