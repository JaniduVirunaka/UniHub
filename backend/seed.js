/**
 * Seed script — run once on a fresh database:
 *   node backend/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const connectDB = require('./config/db');
const User        = require('./models/User');
const Event       = require('./models/Event');
const Club        = require('./models/Club');
const Sport       = require('./models/Sport');
const JoinRequest    = require('./models/JoinRequest');
const Registration   = require('./models/Registration');

// ─── Helpers ────────────────────────────────────────────────────────────────

async function upsertUser(data) {
  if (!await User.findOne({ email: data.email })) {
    const user = await User.create(data);
    console.log(`  Created: ${data.email} (${data.role})`);
    return user;
  }
  return User.findOne({ email: data.email });
}

// ─── Users ───────────────────────────────────────────────────────────────────

async function seedDefaultUsers() {
  console.log('\n[Users]');

  // Event organiser (admin)
  await upsertUser({
    name: 'Default Organizer', email: 'organizer@unihub.test',
    password: 'Password123!', studentId: 'ORG-0001',
    department: 'Clubs & Events', year: 4, role: 'admin'
  });

  // Club supervisor
  await upsertUser({
    name: 'Dr. Supervisor', email: 'supervisor@unihub.test',
    password: 'Password123!', role: 'supervisor'
  });

  // Club president
  await upsertUser({
    name: 'Alice President', email: 'president@unihub.test',
    password: 'Password123!', studentId: 'STU-2001',
    department: 'IT', year: 3, role: 'president'
  });

  // General students (club members)
  await upsertUser({
    name: 'Bob Member', email: 'member1@unihub.test',
    password: 'Password123!', studentId: 'STU-2002',
    department: 'IT', year: 2, role: 'student'
  });
  await upsertUser({
    name: 'Carol Member', email: 'member2@unihub.test',
    password: 'Password123!', studentId: 'STU-2003',
    department: 'SE', year: 2, role: 'student'
  });

  // Default student (event module)
  await upsertUser({
    name: 'Default Student', email: 'student@unihub.test',
    password: 'Password123!', studentId: 'STU-1001',
    department: 'IT', year: 2, role: 'student'
  });

  // Sport roles
  await upsertUser({
    name: 'Sport Admin', email: 'sportadmin@unihub.test',
    password: 'Password123!', role: 'sport_admin'
  });
  await upsertUser({
    name: 'Team Captain', email: 'captain@unihub.test',
    password: 'Password123!', studentId: 'STU-3001',
    department: 'SE', year: 4, role: 'captain'
  });
  await upsertUser({
    name: 'Vice Captain', email: 'vicecaptain@unihub.test',
    password: 'Password123!', studentId: 'STU-3002',
    department: 'SE', year: 3, role: 'vice_captain'
  });
}

// ─── Events ──────────────────────────────────────────────────────────────────

async function seedDefaultEvents() {
  console.log('\n[Events]');
  const count = await Event.countDocuments();
  if (count > 0) {
    console.log(`  ${count} events already exist — skipping.`);
    return;
  }

  const organizer = await User.findOne({ email: 'organizer@unihub.test' }).lean();
  await Event.insertMany([
    {
      title: 'Campus Tech Fest',
      description: 'A day of tech talks, workshops, and networking.',
      eventType: 'event',
      date: new Date(Date.now() + 7  * 24 * 60 * 60 * 1000),
      time: '09:00', location: 'Main Auditorium',
      organizer: organizer?._id,
      totalCapacity: 150, availableTickets: 150, ticketPrice: 0,
      bankAccount: '1234567890', whatsappNumber: '+94771234567'
    },
    {
      title: 'Robotics Club Launch',
      description: 'Join the robotics club and build competitive robots.',
      eventType: 'club',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      time: '14:00', location: 'Engineering Lab',
      organizer: organizer?._id,
      totalCapacity: 100, availableTickets: 100, ticketPrice: 0,
      bankAccount: '1234567890', whatsappNumber: '+94771234567'
    },
    {
      title: 'Battle of the Bands (Ticketed)',
      description: 'Live music night. Ticket required.',
      eventType: 'event',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      time: '18:30', location: 'Open Air Theater',
      organizer: organizer?._id,
      totalCapacity: 200, availableTickets: 200, ticketPrice: 500,
      bankAccount: '001234567890', whatsappNumber: '+94770001122'
    }
  ]);
  console.log('  3 events inserted.');
}

// ─── Clubs ───────────────────────────────────────────────────────────────────

async function seedClubs() {
  console.log('\n[Clubs]');
  const count = await Club.countDocuments();
  if (count > 0) {
    console.log(`  ${count} clubs already exist — skipping.`);
    return;
  }

  const supervisor = await User.findOne({ email: 'supervisor@unihub.test' }).lean();
  const president  = await User.findOne({ email: 'president@unihub.test' }).lean();
  const member1    = await User.findOne({ email: 'member1@unihub.test' }).lean();
  const member2    = await User.findOne({ email: 'member2@unihub.test' }).lean();
  const student    = await User.findOne({ email: 'student@unihub.test' }).lean();

  const now = new Date();

  // ── Club 1: Computer Science Society ──────────────────────────────────────
  await Club.create({
    name: 'SLIIT Computer Science Society',
    description: 'A community for CS enthusiasts to collaborate, learn, and compete in hackathons and coding challenges.',
    mission: 'Empower SLIIT students with technical skills through peer learning, industry talks, and competitive programming.',
    membershipFee: 1000,
    rulesAndRegulations: 'Members must attend at least 50% of sessions. Respectful conduct is mandatory at all times.',
    logoUrl: '',

    supervisor:    supervisor._id,
    president:     president._id,
    topBoard: [
      { user: member1._id, role: 'Vice President' },
      { user: member2._id, role: 'Secretary' },
    ],
    members:        [president._id, member1._id, member2._id, student._id],
    pendingMembers: [],

    paymentCategories: ['Membership Fee', 'Workshop Fee', 'Hackathon Registration'],

    feeRecords: [
      {
        user: member1._id, category: 'Membership Fee',
        status: 'Paid', amountPaid: 1000, lastUpdated: now
      },
      {
        user: member2._id, category: 'Membership Fee',
        status: 'Pending Verification', amountPaid: 1000, lastUpdated: now
      },
      {
        user: student._id, category: 'Membership Fee',
        status: 'Pending', amountPaid: 0, lastUpdated: now
      },
    ],

    announcements: [
      {
        title: 'Welcome to the 2025/2026 Academic Year!',
        content: 'We are excited to welcome all new and returning members. Our first general meeting will be held on April 20th at 3:00 PM in the IT Lab.',
        isApproved: true,
        isDeleted: false,
        date: new Date(now - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Hackathon Team Registration Open',
        content: 'Register your 4-person team for the National University Hackathon by April 30th. Prize pool: LKR 250,000.',
        isApproved: false,
        isDeleted: false,
        date: new Date(now - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
    ],

    achievements: [
      {
        title: 'Winners — Inter-University Code Sprint 2024',
        description: 'Our team of 4 won first place at the national code sprint, outperforming 32 other universities.',
        dateAwarded: 'November 2024',
        imageUrls: [],
        addedBy: president._id,
        createdAt: new Date(now - 60 * 24 * 60 * 60 * 1000),
      },
    ],

    proposals: [
      {
        title: 'Tech Fest 2025 Corporate Sponsorship',
        description: 'Seeking sponsors for our annual tech festival featuring workshops, speaker sessions, and a hackathon.',
        targetAmount: 500000,
        isActive: true,
        pledges: [
          {
            companyName: 'TechCorp Lanka',
            contactEmail: 'partnerships@techcorp.lk',
            amount: 150000,
            message: 'Happy to support SLIIT students!',
            status: 'Accepted',
            date: new Date(now - 10 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    ],

    elections: [
      {
        position: 'President 2026/2027',
        isActive: false,
        isPublished: false,
        candidates: [
          { user: member1._id, manifesto: 'I will bring more industry partnerships and double our workshop frequency.', voteCount: 0 },
          { user: member2._id, manifesto: 'My focus is on inclusivity — ensuring every member has a role in the club.', voteCount: 0 },
        ],
        votedUsers: [],
      },
    ],

    expenses: [
      {
        title: 'Projector Rental — Annual General Meeting',
        amount: 5000,
        description: 'Hired projector and screen for AGM held in the main auditorium.',
        receiptUrl: '',
        date: new Date(now - 5 * 24 * 60 * 60 * 1000),
        loggedBy: president._id,
        isDeleted: false,
        isEdited: false,
      },
      {
        title: 'Printed Banners (duplicate — void)',
        amount: 3500,
        description: 'Duplicate entry — voided.',
        receiptUrl: '',
        date: new Date(now - 4 * 24 * 60 * 60 * 1000),
        loggedBy: member1._id,
        isDeleted: true,
        isEdited: false,
      },
    ],
  });
  console.log('  Created: SLIIT Computer Science Society');

  // ── Club 2: Photography Club ───────────────────────────────────────────────
  await Club.create({
    name: 'SLIIT Photography Club',
    description: 'Celebrating visual storytelling through photography, photo walks, and exhibitions.',
    mission: 'Nurture photographic talent at SLIIT and showcase student work to the wider community.',
    membershipFee: 500,
    rulesAndRegulations: 'Handle all club equipment with care. Return borrowed gear within 48 hours.',
    logoUrl: '',

    supervisor: supervisor._id,
    president:  president._id,
    topBoard: [
      { user: member2._id, role: 'Vice President' },
    ],
    members:        [president._id, member1._id, student._id],
    pendingMembers: [member2._id],

    paymentCategories: ['Membership Fee'],

    feeRecords: [
      {
        user: member1._id, category: 'Membership Fee',
        status: 'Paid', amountPaid: 500, lastUpdated: now
      },
      {
        user: student._id, category: 'Membership Fee',
        status: 'Pending', amountPaid: 0, lastUpdated: now
      },
    ],

    announcements: [
      {
        title: 'Photo Walk — Colombo Fort, April 19th',
        content: 'Join us for a guided photo walk around Colombo Fort. Meet at the main gate at 7:00 AM. Bring your camera or smartphone!',
        isApproved: true,
        isDeleted: false,
        date: new Date(now - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      },
    ],

    achievements: [
      {
        title: 'Best Photography Club — SLIIT Awards 2024',
        description: 'Recognised by SLIIT management for outstanding contribution to student cultural life.',
        dateAwarded: 'December 2024',
        imageUrls: [],
        addedBy: president._id,
        createdAt: new Date(now - 90 * 24 * 60 * 60 * 1000),
      },
      {
        title: '2nd Place — National University Photo Contest',
        description: 'Our entry "Monsoon Light" placed second in the landscape category.',
        dateAwarded: 'October 2024',
        imageUrls: [],
        addedBy: member1._id,
        createdAt: new Date(now - 150 * 24 * 60 * 60 * 1000),
      },
    ],

    proposals: [],
    elections: [],
    expenses: [
      {
        title: 'SD Cards & Memory (Batch Purchase)',
        amount: 12000,
        description: 'Bulk purchase of 4x 64GB SD cards for club camera kit.',
        receiptUrl: '',
        date: new Date(now - 20 * 24 * 60 * 60 * 1000),
        loggedBy: president._id,
        isDeleted: false,
        isEdited: false,
      },
    ],
  });
  console.log('  Created: SLIIT Photography Club');

  // ── Club 3: Debate Society ─────────────────────────────────────────────────
  await Club.create({
    name: 'SLIIT Debate Society',
    description: 'Sharpening critical thinking and public speaking skills through competitive debate.',
    mission: 'Train SLIIT students to articulate ideas confidently and compete at national debate championships.',
    membershipFee: 0,
    rulesAndRegulations: 'Standard club guidelines apply.',
    logoUrl: '',

    supervisor:     supervisor._id,
    president:      president._id,
    topBoard:       [],
    members:        [president._id],
    pendingMembers: [member1._id, student._id],

    paymentCategories: ['Membership Fee'],
    feeRecords:    [],
    announcements: [],
    achievements:  [],
    proposals:     [],
    elections:     [],
    expenses:      [],
  });
  console.log('  Created: SLIIT Debate Society');
}

// ─── Sports ──────────────────────────────────────────────────────────────────

async function seedSports() {
  console.log('\n[Sports]');
  const count = await Sport.countDocuments();
  if (count > 0) {
    console.log(`  ${count} sports already exist — skipping.`);
    return;
  }

  const sportAdmin  = await User.findOne({ email: 'sportadmin@unihub.test' }).lean();
  const captain     = await User.findOne({ email: 'captain@unihub.test' }).lean();
  const viceCaptain = await User.findOne({ email: 'vicecaptain@unihub.test' }).lean();
  const student     = await User.findOne({ email: 'student@unihub.test' }).lean();
  const member1     = await User.findOne({ email: 'member1@unihub.test' }).lean();
  const member2     = await User.findOne({ email: 'member2@unihub.test' }).lean();

  // ── Sport 1: Football — fully populated ───────────────────────────────────
  const football = await Sport.create({
    name: 'Football',
    description: 'University-level football team competing in inter-university tournaments.',
    category: 'Team Sport',
    captain:    captain._id,
    viceCaptain: viceCaptain._id,
    members:    [captain._id, viceCaptain._id, student._id, member1._id],
    createdBy:  sportAdmin._id,
  });

  // Update captain and vice-captain user records to reference this sport
  await User.findByIdAndUpdate(captain._id,    { sport: football._id });
  await User.findByIdAndUpdate(viceCaptain._id, { sport: football._id });
  await User.findByIdAndUpdate(student._id,     { sport: football._id });
  await User.findByIdAndUpdate(member1._id,     { sport: football._id });
  console.log('  Created: Football');

  // ── Sport 2: Badminton — no captain assigned yet ───────────────────────────
  const badminton = await Sport.create({
    name: 'Badminton',
    description: 'Singles and doubles badminton for competitive and recreational players.',
    category: 'Racket Sport',
    captain:    null,
    viceCaptain: null,
    members:    [student._id],
    createdBy:  sportAdmin._id,
  });
  console.log('  Created: Badminton');

  // ── Sport 3: Swimming — empty, tests empty-state UI ───────────────────────
  await Sport.create({
    name: 'Swimming',
    description: 'Competitive swimming across freestyle, backstroke, and butterfly disciplines.',
    category: 'Aquatic Sport',
    captain:    null,
    viceCaptain: null,
    members:    [],
    createdBy:  sportAdmin._id,
  });
  console.log('  Created: Swimming');

  // ── JoinRequests — test all three statuses ────────────────────────────────
  const reqCount = await JoinRequest.countDocuments();
  if (reqCount === 0) {
    // PENDING — member2 wants to join Football
    await JoinRequest.create({
      sport:              football._id,
      student:            member2._id,
      nic:                '987654321V',
      name:               'Carol Member',
      registrationNumber: 'STU-2003',
      email:              'member2@unihub.test',
      phone:              '+94772223344',
      height:             165,
      weight:             60,
      extraSkills:        'Goalkeeper experience',
      status:             'PENDING',
    });

    // APPROVED — student already in Football (approved by captain)
    await JoinRequest.create({
      sport:              football._id,
      student:            student._id,
      nic:                '123456789V',
      name:               'Default Student',
      registrationNumber: 'STU-1001',
      email:              'student@unihub.test',
      phone:              '+94771112233',
      height:             175,
      weight:             70,
      extraSkills:        'Midfielder, 3 years experience',
      status:             'APPROVED',
      approvedBy:         captain._id,
    });

    // REJECTED — member2 tried Badminton previously
    await JoinRequest.create({
      sport:              badminton._id,
      student:            member2._id,
      nic:                '987654321V',
      name:               'Carol Member',
      registrationNumber: 'STU-2003',
      email:              'member2@unihub.test',
      phone:              '+94772223344',
      height:             165,
      weight:             60,
      extraSkills:        '',
      status:             'REJECTED',
      approvedBy:         sportAdmin._id,
    });

    console.log('  Created: 3 join requests (PENDING, APPROVED, REJECTED)');
  }
}

// ─── Registrations ───────────────────────────────────────────────────────────

async function seedRegistrations() {
  console.log('\n[Registrations]');
  const count = await Registration.countDocuments();
  if (count > 0) {
    console.log(`  ${count} registrations already exist — skipping.`);
    return;
  }

  const student  = await User.findOne({ email: 'student@unihub.test' }).lean();
  const member1  = await User.findOne({ email: 'member1@unihub.test' }).lean();
  const techFest = await Event.findOne({ title: 'Campus Tech Fest' }).lean();
  const bands    = await Event.findOne({ title: 'Battle of the Bands (Ticketed)' }).lean();
  const robotics = await Event.findOne({ title: 'Robotics Club Launch' }).lean();

  // student registered for free event
  await Registration.create({
    userId: student._id,
    eventId: techFest._id,
    status: 'registered',
    ticketsBooked: 1,
  });
  await Event.findByIdAndUpdate(techFest._id, { $inc: { availableTickets: -1 } });

  // student pending payment for ticketed event (2 tickets)
  await Registration.create({
    userId: student._id,
    eventId: bands._id,
    status: 'pending_payment',
    ticketsBooked: 2,
  });
  await Event.findByIdAndUpdate(bands._id, { $inc: { availableTickets: -2 } });

  // member1 cancelled registration
  await Registration.create({
    userId: member1._id,
    eventId: robotics._id,
    status: 'cancelled',
    ticketsBooked: 1,
  });

  console.log('  Created: 3 registrations (registered, pending_payment, cancelled)');
}

// ─── Entry point ─────────────────────────────────────────────────────────────

(async () => {
  await connectDB();
  await seedDefaultUsers();
  await seedDefaultEvents();
  await seedClubs();
  await seedRegistrations();
  await seedSports();
  console.log('\nSeeding complete.');
  process.exit(0);
})();
