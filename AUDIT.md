# UniHub — Code Audit & Module Migration Tracker

**Branch:** `Janidu---testing/ClubManagement`  
**Date:** 2026-04-08  
**Goal:** Audit code quality + prep this branch as the **Club Management Module** for merge with `sport-management` branch  
**Agents:** backend-api-expert · frontend-react-expert · tailwind-css-expert · database-expert · qa-expert · git-expert

---

## Section 1 — Branch Comparison

| Area | Club Branch (this) | Sport Branch |
|------|--------------------|--------------|
| File extension | `.js` → needs `.jsx` | Already `.jsx` ✅ |
| Auth | No JWT, trusts `req.body` | JWT + bcrypt ✅ |
| Protected routes | None — checks inside components | `<ProtectedRoute>` component ✅ |
| Auth context | None — raw `localStorage` | `AuthContext` + `useContext` ✅ |
| Backend structure | Routes only (no controllers) | Controllers + middleware ✅ |
| Google OAuth | Yes (frontend + backend) | No — local only |
| Roles | `student / president / supervisor` | `STUDENT / CAPTAIN / VICE_CAPTAIN / SPORT_ADMIN` |
| User model | Minimal (name, email, role, authProvider) | Rich (nic, regNo, phone, height, weight) |
| Entry point | Dual: `index.js` (empty) + `server.js` (real) | Single `server.js` ✅ |

---

## Section 2 — Merge Conflict Map

Issues affecting both branches — must be resolved at merge time:

| # | Conflict | Club Side | Sport Side | Resolution Needed |
|---|----------|-----------|------------|-------------------|
| X1 | User model roles | `student/president/supervisor` | `STUDENT/CAPTAIN/VICE_CAPTAIN/SPORT_ADMIN` | Expand unified enum or add `moduleRoles` field |
| X2 | User model fields | Minimal | Rich (nic, regNo, phone, height, weight) | Merge schema with optional sport-specific fields |
| X3 | Auth system | No JWT — trusts `req.body.userId` | JWT middleware on all protected routes | Club must adopt JWT (sport pattern is correct) |
| X4 | Google OAuth | Club has it, sport doesn't | N/A | Unified auth adds Google OAuth support |
| X5 | API base routes | `/api/clubs`, `/api/auth` | `/api/sports`, `/api/requests`, `/api/auth` | Keep module namespaces; merge `/api/auth` |
| X6 | Frontend auth state | Raw `localStorage.getItem('user')` | `AuthContext` with token | Club adopts AuthContext from sport branch |
| X7 | Protected routes | None | `<ProtectedRoute allowedRoles={[]}>` | Club adopts ProtectedRoute from sport branch |
| X8 | File uploads | `backend/uploads/` hardcoded | No file uploads | Make upload path configurable via `UPLOAD_DIR` env |

---

## Section 3 — Club Module Migration Checklist

### 3a. JS → JSX Rename
- [ ] `frontend/src/App.js` → `App.jsx`
- [ ] `frontend/src/index.js` → `index.jsx`
- [ ] `frontend/src/components/Navbar.js` → `Navbar.jsx`
- [ ] `frontend/src/components/ClubNavigation.js` → `ClubNavigation.jsx`
- [ ] `frontend/src/pages/Login.js` → `Login.jsx`
- [ ] `frontend/src/pages/Signup.js` → `Signup.jsx`
- [ ] `frontend/src/pages/Home.js` → `Home.jsx`
- [ ] `frontend/src/pages/Profile.js` → `Profile.jsx`
- [ ] `frontend/src/pages/ClubManagement.js` → `ClubManagement.jsx`
- [ ] `frontend/src/pages/ClubDetail.js` → `ClubDetail.jsx`
- [ ] `frontend/src/pages/ClubAbout.js` → `ClubAbout.jsx`
- [ ] `frontend/src/pages/ClubElections.js` → `ClubElections.jsx`
- [ ] `frontend/src/pages/ClubFinanceHub.js` → `ClubFinanceHub.jsx`
- [ ] `frontend/src/pages/AchievementShowcase.js` → `AchievementShowcase.jsx`
- [ ] `frontend/src/pages/Sponsorships.js` → `Sponsorships.jsx`
- [ ] `frontend/src/pages/GlobalAnalytics.js` → `GlobalAnalytics.jsx`
- [ ] `frontend/src/pages/Events.js` → `Events.jsx`
- [ ] Update all import statements after rename

### 3b. Remove Standalone App Concerns
These belong in the merged app root, not this module:
- [ ] Remove `Login.jsx` / `Signup.jsx` (auth is shared)
- [ ] Remove `Home.jsx` (shared home page)
- [ ] Remove `Profile.jsx` (shared profile)
- [ ] Remove `Navbar.jsx` (shared navbar)
- [ ] Remove `GoogleOAuthProvider` from `App.jsx` (move to merged app root)
- [ ] Rename `App.jsx` → `ClubManagementRoutes.jsx` (exports only `<Routes>` subtree, no providers)

### 3c. API Configuration
- [ ] Create `frontend/src/config/api.js` with `export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'`
- [ ] Replace all hardcoded `http://localhost:5000/api` URLs (10+ files)
- [ ] Add `REACT_APP_API_URL=http://localhost:5000/api` to `frontend/.env`
- [ ] Move Google OAuth clientId to `REACT_APP_GOOGLE_CLIENT_ID` in `.env`

### 3d. Backend Consolidation
- [ ] Merge `backend/index.js` + `backend/server.js` into single clean `backend/index.js`
- [ ] Delete `backend/server.js`
- [ ] Move Google OAuth clientId to `backend/.env` as `GOOGLE_CLIENT_ID`
- [ ] Reference `process.env.GOOGLE_CLIENT_ID` in `authRoutes.js` (lines 7, 88)
- [ ] Make upload path configurable via `UPLOAD_DIR` env var

### 3e. Auth — Adopt Sport Branch Pattern
- [ ] Implement JWT issuance on login/signup (ref: sport `controllers/authController.js`)
- [ ] Add `backend/middleware/authMiddleware.js` (ref: sport `middleware/authMiddleware.js`)
- [ ] Add `backend/middleware/roleMiddleware.js` (ref: sport `middleware/roleMiddleware.js`)
- [ ] Apply auth middleware to all protected club routes
- [ ] Stop trusting `req.body.userId` / `req.body.presidentId` etc.

### 3f. Code Quality
- [ ] Remove ~15 `console.log()` statements across all frontend pages
- [ ] Implement logout in `Profile.jsx` (currently a placeholder)
- [ ] Fix dead `/sports` nav link in `Navbar.jsx`
- [ ] Replace `window.confirm()` with modal dialogs (`ClubDetail`, `Sponsorships`)

---

## Section 4 — Per-File Audit Status

| # | File | Agent | Status | Issues Found |
|---|------|-------|--------|--------------|
| **BACKEND** | | | | |
| B1 | `backend/index.js` | backend-api-expert | ⬜ | — |
| B2 | `backend/server.js` | backend-api-expert | ⬜ | — |
| B3 | `backend/config/db.js` | backend-api-expert | ⬜ | — |
| B4 | `backend/models/User.js` | database-expert | ⬜ | — |
| B5 | `backend/models/Club.js` | database-expert | ⬜ | — |
| B6 | `backend/routes/authRoutes.js` | backend-api-expert | ⬜ | — |
| B7 | `backend/routes/clubRoutes.js` | backend-api-expert | ⬜ | — |
| **FRONTEND** | | | | |
| F1 | `frontend/src/App.js` | frontend-react-expert | ⬜ | — |
| F2 | `frontend/src/index.js` | frontend-react-expert | ⬜ | — |
| F3 | `frontend/src/App.css` | tailwind-css-expert | ⬜ | — |
| F4 | `frontend/src/components/Navbar.js` | frontend-react-expert | ⬜ | — |
| F5 | `frontend/src/components/ClubNavigation.js` | frontend-react-expert | ⬜ | — |
| F6 | `frontend/src/hooks/useScrollAnimation.js` | frontend-react-expert | ⬜ | — |
| F7 | `frontend/src/pages/Login.js` | frontend-react-expert | ⬜ | — |
| F8 | `frontend/src/pages/Signup.js` | frontend-react-expert | ⬜ | — |
| F9 | `frontend/src/pages/Home.js` | frontend-react-expert | ⬜ | — |
| F10 | `frontend/src/pages/Profile.js` | frontend-react-expert | ⬜ | — |
| F11 | `frontend/src/pages/ClubManagement.js` | frontend-react-expert | ⬜ | — |
| F12 | `frontend/src/pages/ClubDetail.js` | frontend-react-expert | ⬜ | — |
| F13 | `frontend/src/pages/ClubAbout.js` | frontend-react-expert | ⬜ | — |
| F14 | `frontend/src/pages/ClubElections.js` | frontend-react-expert | ⬜ | — |
| F15 | `frontend/src/pages/ClubFinanceHub.js` | frontend-react-expert | ⬜ | — |
| F16 | `frontend/src/pages/AchievementShowcase.js` | frontend-react-expert | ⬜ | — |
| F17 | `frontend/src/pages/Sponsorships.js` | frontend-react-expert | ⬜ | — |
| F18 | `frontend/src/pages/GlobalAnalytics.js` | frontend-react-expert | ⬜ | — |
| F19 | `frontend/src/pages/Events.js` | frontend-react-expert | ⬜ | — |

**Status legend:** ⬜ Not Started · 🔄 In Progress · ✅ Clean · ⚠️ Issues Found · 🔴 Critical Issue

---

## Section 5 — Issues Tracker

| ID | Sev | File | Line | Issue | Agent | Status |
|----|-----|------|------|-------|-------|--------|
| C001 | 🔴 CRITICAL | `backend/.env` + `server.js` | — | MongoDB Atlas credentials committed to repo & hardcoded in server.js | backend-api-expert | Open |
| C002 | 🔴 CRITICAL | `backend/routes/authRoutes.js` + `frontend/src/App.js` | 7, 88, 24 | Google OAuth Client ID hardcoded in source files | backend-api-expert | Open |
| C003 | 🔴 CRITICAL | `backend/routes/clubRoutes.js` | — | No JWT — routes trust `userId` from `req.body` (client-controlled, spoofable) | backend-api-expert | Open |
| C004 | 🔴 CRITICAL | `backend/routes/clubRoutes.js` | — | No auth middleware — any caller can act as any role | backend-api-expert | Open |
| H001 | 🟠 HIGH | `backend/routes/` | — | No input validation on any route (NoSQL injection risk) | backend-api-expert | Open |
| H002 | 🟠 HIGH | `backend/routes/clubRoutes.js` | 10–20 | Multer: no file type check, no size limit (arbitrary file upload) | backend-api-expert | Open |
| H003 | 🟠 HIGH | `frontend/src/App.js` | — | No protected routes — auth checks happen inside components only | frontend-react-expert | Open |
| H004 | 🟠 HIGH | All frontend pages (10+ files) | — | Hardcoded `http://localhost:5000/api/` — must be env-based for merge | frontend-react-expert | Open |
| H005 | 🟠 HIGH | `frontend/src/pages/Profile.js` | 39 | Logout not implemented — users cannot sign out | frontend-react-expert | Open |
| H006 | 🟠 HIGH | `backend/routes/authRoutes.js` | — | No rate limiting on auth endpoints (brute force risk) | backend-api-expert | Open |
| M001 | 🟡 MED | `backend/server.js` | — | Dead duplicate entry point with hardcoded credentials | backend-api-expert | Open |
| M002 | 🟡 MED | `backend/index.js` | — | Routes NOT mounted in index.js — is a non-functional entry point | backend-api-expert | Open |
| M003 | 🟡 MED | All frontend pages | — | 15+ `console.log()` statements left in production code | frontend-react-expert | Open |
| M004 | 🟡 MED | `frontend/src/App.js` | — | `GoogleOAuthProvider` wraps full app — must move to merged app root | frontend-react-expert | Open |
| M005 | 🟡 MED | `frontend/src/` | — | Login, Signup, Profile, Home, Navbar are shared concerns — remove from module | frontend-react-expert | Open |
| M006 | 🟡 MED | All frontend pages | — | Auth state from raw `localStorage.getItem('user')` — no context, collision risk in merged app | frontend-react-expert | Open |
| M007 | 🟡 MED | All `.js` React files | — | React component files use `.js` extension — rename to `.jsx` | frontend-react-expert | Open |
| M008 | 🟡 MED | `backend/index.js` / `server.js` | — | No CORS origin restriction — all origins allowed | backend-api-expert | Open |
| M009 | 🟡 MED | `backend/models/User.js` | — | Role enum conflicts with sport branch roles — needs unified User model | database-expert | Open |
| L001 | ⚪ LOW | `frontend/src/components/Navbar.js` | — | `/sports` nav link has no matching route in App.js | frontend-react-expert | Open |
| L002 | ⚪ LOW | `frontend/src/pages/Events.js` | — | Placeholder "Under Construction" component | frontend-react-expert | Open |
| L003 | ⚪ LOW | `backend/models/Club.js` | — | No indexes defined on frequently queried fields | database-expert | Open |
| L004 | ⚪ LOW | `frontend/src/pages/ClubDetail.js` | — | ~1300 line component — no memoization, candidate for splitting | frontend-react-expert | Open |

---

## Section 6 — Fix Log

| ID | File(s) Changed | Description | Commit |
|----|----------------|-------------|--------|
| — | — | No fixes applied yet | — |
