/**
 * Seed script — run once on a fresh database:
 *   node backend/seed.js
 */
require('dotenv').config();
const connectDB = require('./config/db');
const User  = require('./models/User');
const Event = require('./models/Event');

async function seedDefaultUsers() {
  const organizerEmail = 'organizer@unihub.test';
  const studentEmail   = 'student@unihub.test';

  if (!await User.findOne({ email: organizerEmail })) {
    await User.create({
      name:       'Default Organizer',
      email:      organizerEmail,
      password:   'Password123!',   // hashed by pre-save hook
      studentId:  'ORG-0001',
      department: 'Clubs & Events',
      year:       4,
      role:       'admin'
    });
    console.log('Seed organizer user created.');
  }

  if (!await User.findOne({ email: studentEmail })) {
    await User.create({
      name:       'Default Student',
      email:      studentEmail,
      password:   'Password123!',   // hashed by pre-save hook
      studentId:  'STU-1001',
      department: 'IT',
      year:       2,
      role:       'student'         // 'user' not in unified enum — use 'student'
    });
    console.log('Seed student user created.');
  }
}

async function seedDefaultEvents() {
  const count = await Event.countDocuments();
  if (count > 0) {
    console.log(`${count} events already exist — skipping event seed.`);
    return;
  }

  const organizer = await User.findOne({ email: 'organizer@unihub.test' }).lean();
  await Event.insertMany([
    {
      title:            'Campus Tech Fest',
      description:      'A day of tech talks, workshops, and networking.',
      eventType:        'event',
      date:             new Date(Date.now() + 7  * 24 * 60 * 60 * 1000),
      time:             '09:00',
      location:         'Main Auditorium',
      organizer:        organizer?._id,
      totalCapacity:    150,
      availableTickets: 150,
      ticketPrice:      0,
      bankAccount:      '1234567890',
      whatsappNumber:   '+94771234567'
    },
    {
      title:            'Robotics Club Launch',
      description:      'Join the robotics club and build competitive robots.',
      eventType:        'club',
      date:             new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      time:             '14:00',
      location:         'Engineering Lab',
      organizer:        organizer?._id,
      totalCapacity:    100,
      availableTickets: 100,
      ticketPrice:      0,
      bankAccount:      '1234567890',
      whatsappNumber:   '+94771234567'
    },
    {
      title:            'Battle of the Bands (Ticketed)',
      description:      'Live music night. Ticket required.',
      eventType:        'event',
      date:             new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      time:             '18:30',
      location:         'Open Air Theater',
      organizer:        organizer?._id,
      totalCapacity:    200,
      availableTickets: 200,
      ticketPrice:      500,
      bankAccount:      '001234567890',
      whatsappNumber:   '+94770001122'
    }
  ]);
  console.log('Seed events inserted.');
}

(async () => {
  await connectDB();
  await seedDefaultUsers();
  await seedDefaultEvents();
  console.log('Seeding complete.');
  process.exit(0);
})();
