# UniHub - University Event & Club Management System

## Project Overview

**UniHub** is a comprehensive university event and club management platform built with the **MERN stack** (MongoDB, Express, React, Node.js). This system allows students to discover events, register for clubs, and purchase tickets seamlessly.

### Your Assigned Module
- **Event Discovery & Registration**
- Your part focuses on event listing and detail pages, the one-click registration flow, ticket/cart support, and backend event APIs for availability and registration.
- This description helps you continue work from a new VS Code window and reconnect with the project quickly.

## Complete Project Structure Created ✓

```
campusproject/
├── backend/                      # Node.js/Express Server
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js          # Student profiles with password hashing
│   │   │   ├── Event.js         # Events/Clubs with ticket management
│   │   │   └── Registration.js  # Event registration tracking
│   │   ├── routes/
│   │   │   ├── authRoutes.js    # /api/auth/*
│   │   │   ├── eventRoutes.js   # /api/events/*
│   │   │   ├── registrationRoutes.js  # /api/registrations/*
│   │   │   └── cartRoutes.js    # /api/cart/*
│   │   ├── controllers/         # (To be implemented)
│   │   ├── middleware/          # (To be implemented)
│   │   ├── utils/               # (To be implemented)
│   │   └── server.js            # Express server setup
│   ├── package.json             # Backend dependencies
│   ├── .env.example             # Environment config template
│   └── .gitignore
│
├── frontend/                     # React App with Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── EventCard.js     # Event display card component
│   │   │   ├── Modals.js        # Confirmation & Alert modals
│   │   │   └── Layout.js        # Navbar & Footer
│   │   ├── pages/
│   │   │   ├── Home.js          # Event listing page
│   │   │   ├── MyEvents.js      # User's registered events
│   │   │   └── Cart.js          # Shopping cart
│   │   ├── context/
│   │   │   ├── AuthContext.js   # User authentication state
│   │   │   └── CartContext.js   # Shopping cart state
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance with JWT auto-attach
│   │   │   └── services.js      # API call functions
│   │   ├── App.js               # Main app with routing
│   │   └── index.js
│   ├── public/
│   │   └── index.html           # React entry point
│   ├── package.json             # Frontend dependencies
│   ├── tailwind.config.js       # Tailwind CSS configuration
│   ├── .env.example
│   └── .gitignore
│
├── instructions.md              # Your project requirements
├── SETUP_GUIDE.md              # Complete setup instructions
└── ROADMAP.md                  # Development phases
```

## Key Features Implemented

### ✅ Backend (Node.js + Express)
- **Authentication:** Secure registration/login with JWT & bcryptjs
- **Database Models:** User, Event, Registration schemas
- **API Routes:** All endpoints structured (ready for controllers)
- **Middleware:** CORS, JSON parsing configured
- **Async Ready:** node-cron installed for 24-hour notifications

### ✅ Frontend (React + Tailwind CSS)
- **No Plain HTML/CSS:** Uses Tailwind utility classes for all styling
- **Reusable Components:** EventCard, Modals, Layout components
- **State Management:** React Context API for Auth & Cart
- **API Service Layer:** Centralized Axios service with JWT auto-attach
- **Routing:** React Router v6 configured
- **Responsive Design:** Mobile-first with Tailwind breakpoints

### ✅ Tech Stack
```
Backend:
  - Express.js (API Server)
  - MongoDB & Mongoose (Database)
  - JWT & bcryptjs (Security)
  - node-cron (Scheduled Tasks)
  - express-validator (Validation)

Frontend:
  - React 18 (UI Library)
  - React Router v6 (Navigation)
  - Tailwind CSS (Styling - no plain HTML/CSS!)
  - Axios (HTTP Client)
  - React Icons (Icon Library)
```

## Quick Start

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB connection & JWT secret
npm run dev  # Runs on localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm start    # Runs on localhost:3000
```

## Project Features (From instructions.md)

### 1. Student Authentication ✓
- Registration and Login system
- Secure password storage

### 2. One-Click Event Registration ✓ (Ready to implement)
- Auto-fill student data
- Confirmation modal popup
- Yes/No confirmation flow

### 3. Ticket Purchasing System ✓ (Ready to implement)
- Real-time availability check
- Shopping cart mechanism
- Manual payment flow with bank details
- WhatsApp receipt confirmation

### 4. Student Dashboard ✓ (Ready to implement)
- Events listing page
- "My Events" calendar/list view

### 5. Automated Notifications ✓ (Ready to implement)
- 24-hour event reminders via cron job

## Architecture Overview

```
Frontend (React)
    ↓
Context API (Auth, Cart)
    ↓
Axios Service Layer
    ↓
Backend API (Express)
    ↓
Controllers (Business Logic)
    ↓
MongoDB Schemas
```

## What's Ready to Implement

1. **Controllers** - Add business logic in `backend/src/controllers/`
2. **Page Components** - Build registration, event details, dashboard pages in `frontend/src/pages/`
3. **API Integration** - Connect frontend services to backend APIs
4. **Styling** - Use Tailwind CSS classes (no plain HTML/CSS needed!)

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/unihub
JWT_SECRET=your_jwt_secret_key_here
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## Dependencies Included

**Backend:**
- express, mongoose, bcryptjs, jsonwebtoken, cors, node-cron, dotenv, express-validator

**Frontend:**
- react, react-dom, react-router-dom, axios, tailwindcss, react-icons

## Next Steps

1. ✅ Project structure created
2. ✅ Configuration files ready
3. ⏭️ Implement controllers (business logic)
4. ⏭️ Create frontend pages
5. ⏭️ Connect APIs
6. ⏭️ Add 24-hour notification scheduler
7. ⏭️ Test entire workflow

---

**All project files are ready! You can now run:**
- `npm run dev` in backend folder
- `npm start` in frontend folder

Your project follows MERN stack best practices with modern styling (Tailwind CSS) and no plain HTML/CSS! 🎉
