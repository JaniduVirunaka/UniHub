# UniHub - Project Setup Guide

## Project Structure

```
campusproject/
├── backend/                 # Node.js/Express Backend
│   ├── src/
│   │   ├── models/         # MongoDB Schemas
│   │   ├── routes/         # API Routes
│   │   ├── controllers/    # Business Logic
│   │   ├── middleware/     # Custom Middleware
│   │   ├── utils/          # Utilities
│   │   └── server.js       # Express Server
│   ├── package.json
│   └── .env.example
│
└── frontend/                # React Frontend
    ├── src/
    │   ├── components/     # Reusable Components (using Tailwind CSS)
    │   ├── pages/          # Page Components
    │   ├── context/        # React Context (Auth, Cart)
    │   ├── services/       # API Services
    │   ├── App.js
    │   └── index.js
    ├── public/
    │   └── index.html
    ├── package.json
    └── .env.example
```

## Backend Setup

### Prerequisites
- Node.js (v14+)
- MongoDB running locally or remote connection string

### Installation

```bash
cd backend
npm install
```

### Configuration
1. Copy `.env.example` to `.env`
2. Update environment variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/unihub
   JWT_SECRET=your_secret_key
   FRONTEND_URL=http://localhost:3000
   ```

### Running the Backend

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Backend will run on `http://localhost:5000`

## Frontend Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Configuration
1. Copy `.env.example` to `.env`
2. Update API URL if needed:
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

### Running the Frontend

```bash
npm start
```

Frontend will run on `http://localhost:3000`

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT + bcryptjs
- **Notifications:** node-cron (for scheduled tasks)
- **Validation:** express-validator

### Frontend
- **Library:** React 18
- **Routing:** React Router v6
- **Styling:** Tailwind CSS (modern, no plain HTML/CSS)
- **HTTP Client:** Axios
- **Icons:** React Icons
- **State Management:** React Context API

## Key Features Implemented

### Backend Models
- **User:** Student account management with password hashing
- **Event:** Event/Club details with ticket management
- **Registration:** Event registration tracking

### Frontend Components
- **EventCard:** Reusable event display component
- **Modals:** Confirmation and Alert popups
- **Layout:** Navbar and Footer components
- **Context:** Authentication and Cart state management

### API Routes (To be implemented)
- `/api/auth/*` - Authentication
- `/api/events/*` - Event management
- `/api/registrations/*` - Event registrations
- `/api/cart/*` - Shopping cart

## Development Workflow

1. Start MongoDB service
2. Run backend: `cd backend && npm run dev`
3. Run frontend: `cd frontend && npm start`
4. Implement features following the architecture

## Next Steps

1. Implement authentication endpoints (registration, login)
2. Implement event listing and filtering
3. Create event registration logic
4. Build ticket purchasing system
5. Implement "My Events" dashboard
6. Add automated notifications (24-hour reminders)
7. Connect all frontend pages to backend APIs

## Notes

- Use Tailwind CSS classes for styling (no plain HTML/CSS)
- Keep components reusable and modular
- Follow RESTful API design principles
- Implement proper error handling and validation
- Use React Context for global state management
- Store JWT tokens securely in localStorage (consider httpOnly cookies for production)
