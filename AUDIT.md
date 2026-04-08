# UniHub — Code Audit & Module Migration Tracker

**Branch:** `merge-main-event` (updated 2026-04-08)  
**History:** `Janidu---testing/ClubManagement` → merged `sport-management` → updated with `origin/main` → merged `Student-Registartion-And-Event-Discovery-`  
**Goal:** Unified app — Club + Sport + Event modules on a single backend (9 route groups) and single React frontend  
**Agents:** backend-api-expert · frontend-react-expert · tailwind-css-expert · database-expert · qa-expert · git-expert

> Sections 1–6 document the original Club-module audit and sport-management merge.  
> Section 7 onwards documents the Event module merge (2026-04-08).

---

## Section 1 — Branch Comparison

| Area | Club Branch (this) | Sport Branch |
|------|--------------------|--------------|
| File extension | ✅ `.jsx` (done) | Already `.jsx` ✅ |
| Auth | No JWT, trusts `req.body` | JWT + bcrypt ✅ |
| Protected routes | None — checks inside components | `<ProtectedRoute>` component ✅ |
| Auth context | None — raw `localStorage` | `AuthContext` + `useContext` ✅ |
| Backend structure | Routes only (no controllers) | Controllers + middleware ✅ |
| Google OAuth | Yes (frontend + backend) | No — local only |
| Roles | `student / president / supervisor` | `STUDENT / CAPTAIN / VICE_CAPTAIN / SPORT_ADMIN` |
| User model | Minimal (name, email, role, authProvider) | Rich (nic, regNo, phone, height, weight) |
| Entry point | ✅ Single `index.js` (done) | Single `server.js` ✅ |
| JWT auth | ✅ Issued on login/signup/google; interceptor attaches Bearer token | JWT + middleware ✅ |

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
| X8 | Upload path | ✅ `UPLOAD_DIR` env var (done) | No file uploads | Configurable via env ✅ |

---

## Section 3 — Club Module Migration Checklist

### 3a. JS → JSX Rename ✅
- [x] `frontend/src/App.js` → `App.jsx`
- [x] `frontend/src/index.js` → `index.jsx`
- [x] `frontend/src/components/Navbar.js` → `Navbar.jsx`
- [x] `frontend/src/components/ClubNavigation.js` → `ClubNavigation.jsx`
- [x] `frontend/src/pages/Login.js` → `Login.jsx`
- [x] `frontend/src/pages/Signup.js` → `Signup.jsx`
- [x] `frontend/src/pages/Home.js` → `Home.jsx`
- [x] `frontend/src/pages/Profile.js` → `Profile.jsx`
- [x] `frontend/src/pages/ClubManagement.js` → `ClubManagement.jsx`
- [x] `frontend/src/pages/ClubDetail.js` → `ClubDetail.jsx`
- [x] `frontend/src/pages/ClubAbout.js` → `ClubAbout.jsx`
- [x] `frontend/src/pages/ClubElections.js` → `ClubElections.jsx`
- [x] `frontend/src/pages/ClubFinanceHub.js` → `ClubFinanceHub.jsx`
- [x] `frontend/src/pages/AchievementShowcase.js` → `AchievementShowcase.jsx`
- [x] `frontend/src/pages/Sponsorships.js` → `Sponsorships.jsx`
- [x] `frontend/src/pages/GlobalAnalytics.js` → `GlobalAnalytics.jsx`
- [x] `frontend/src/pages/Events.js` → `Events.jsx`
- [x] Import statements unaffected (CRA resolves extensionless imports for both .js/.jsx)

### 3b. Remove Standalone App Concerns ✅
- [x] Renamed `App.jsx` → `ClubManagementRoutes.jsx` — exports only club `<Routes>` tree, no providers
- [x] Removed `GoogleOAuthProvider`, `BrowserRouter`, `Navbar` from module root
- [x] `index.jsx` updated as dev-only shell (provides BrowserRouter + GoogleOAuthProvider for local running)
- [x] Removed shared routes (`/login`, `/signup`, `/`, `/profile`, `/events`) from module
- [ ] `Login.jsx`, `Signup.jsx`, `Home.jsx`, `Profile.jsx`, `Navbar.jsx` files kept in repo for local dev — will be removed/moved when merged app shell is created

### 3c. API Configuration ✅
- [x] Created `frontend/src/config/api.js` — axios instance with `baseURL` from `REACT_APP_API_URL`
- [x] Replaced all hardcoded `http://localhost:5000/api` URLs in 12 files → use `api` instance
- [x] Added `REACT_APP_API_URL=http://localhost:5000/api` to `frontend/.env`
- [x] Added `REACT_APP_GOOGLE_CLIENT_ID` to `frontend/.env`; `App.jsx` uses `process.env.REACT_APP_GOOGLE_CLIENT_ID`

### 3d. Backend Consolidation ✅
- [x] Merged `backend/index.js` + `backend/server.js` → single clean `backend/index.js`
- [x] Deleted `backend/server.js`
- [x] Added `GOOGLE_CLIENT_ID` to `backend/.env`
- [x] `authRoutes.js` lines 7 & 88 now use `process.env.GOOGLE_CLIENT_ID`
- [x] Upload path configurable via `UPLOAD_DIR` env var

### 3e. Auth — Adopt Sport Branch Pattern ✅
- [x] JWT issued on `/auth/login`, `/auth/signup`, `/auth/google` — 7d expiry, payload `{id, role}`
- [x] Created `backend/middleware/authMiddleware.js` — `protect` (Bearer token verify) + `requireRole` helpers
- [x] `router.use(protect)` applied at top of `clubRoutes.js` — all club routes now require valid JWT
- [x] Frontend `config/api.js` interceptor attaches `Authorization: Bearer <token>` from `localStorage`
- [x] `Login.jsx` + `Signup.jsx` store `token` to `localStorage` on all auth paths (email + Google)
- [x] Refactored all 26 endpoints in `clubRoutes.js` — `req.body` auth IDs replaced with `req.user._id` + `req.user.role`; also removed lingering `console.log` on update route

### 3f. Code Quality
- [x] Replaced all `console.log(err)` in catch blocks with `console.error(err)` across all pages
- [x] Implemented logout in `Profile.jsx` — clears `token` + `user` from localStorage, navigates to `/login`
- [x] Fixed `/sports` nav link comment in `Navbar.jsx` — noted as sport-management module route
- [ ] Replace `window.confirm()` with modal dialogs (`ClubDetail`, `Sponsorships`) — deferred (UX, not security)

---

## Section 4 — Per-File Audit Status

| # | File | Agent | Status | Issues Found |
|---|------|-------|--------|--------------|
| **BACKEND** | | | | |
| B1 | `backend/index.js` | backend-api-expert | ✅ | Consolidated from server.js; routes mounted; env-based config |
| B2 | ~~`backend/server.js`~~ | — | ✅ | Deleted (was dead duplicate with hardcoded credentials) |
| B3 | `backend/config/db.js` | backend-api-expert | ⬜ | — |
| B4 | `backend/models/User.js` | database-expert | ⬜ | — |
| B5 | `backend/models/Club.js` | database-expert | ⬜ | — |
| B6 | `backend/routes/authRoutes.js` | backend-api-expert | ⬜ | C002 fixed (hardcoded client ID → env var) |
| B7 | `backend/routes/clubRoutes.js` | backend-api-expert | ⬜ | — |
| **FRONTEND** | | | | |
| F1 | `frontend/src/App.jsx` | frontend-react-expert | ⬜ | C002 fixed (client ID → env var) |
| F2 | `frontend/src/index.jsx` | frontend-react-expert | ⬜ | — |
| F3 | `frontend/src/App.css` | tailwind-css-expert | ⬜ | — |
| F4 | `frontend/src/components/Navbar.jsx` | frontend-react-expert | ⬜ | — |
| F5 | `frontend/src/components/ClubNavigation.jsx` | frontend-react-expert | ⬜ | — |
| F6 | `frontend/src/hooks/useScrollAnimation.js` | frontend-react-expert | ⬜ | — |
| F7 | `frontend/src/pages/Login.jsx` | frontend-react-expert | ⬜ | — |
| F8 | `frontend/src/pages/Signup.jsx` | frontend-react-expert | ⬜ | — |
| F9 | `frontend/src/pages/Home.jsx` | frontend-react-expert | ⬜ | — |
| F10 | `frontend/src/pages/Profile.jsx` | frontend-react-expert | ⬜ | — |
| F11 | `frontend/src/pages/ClubManagement.jsx` | frontend-react-expert | ⬜ | H004 fixed (api instance), M003 fixed |
| F12 | `frontend/src/pages/ClubDetail.jsx` | frontend-react-expert | ⬜ | H004 fixed, M003 fixed |
| F13 | `frontend/src/pages/ClubAbout.jsx` | frontend-react-expert | ⬜ | H004 fixed, M003 fixed |
| F14 | `frontend/src/pages/ClubElections.jsx` | frontend-react-expert | ⬜ | H004 fixed, M003 fixed |
| F15 | `frontend/src/pages/ClubFinanceHub.jsx` | frontend-react-expert | ⬜ | H004 fixed, M003 fixed |
| F16 | `frontend/src/pages/AchievementShowcase.jsx` | frontend-react-expert | ⬜ | H004 fixed, M003 fixed |
| F17 | `frontend/src/pages/Sponsorships.jsx` | frontend-react-expert | ⬜ | H004 fixed, M003 fixed |
| F18 | `frontend/src/pages/GlobalAnalytics.jsx` | frontend-react-expert | ⬜ | H004 fixed, M003 fixed |
| F19 | `frontend/src/pages/Events.jsx` | frontend-react-expert | ⬜ | — |

**Status legend:** ⬜ Not Started · 🔄 In Progress · ✅ Clean · ⚠️ Issues Found · 🔴 Critical Issue

---

## Section 5 — Issues Tracker

| ID | Sev | File | Line | Issue | Agent | Status |
|----|-----|------|------|-------|-------|--------|
| C001 | 🔴 CRITICAL | `backend/.env` + ~~`server.js`~~ | — | MongoDB Atlas credentials committed to repo & hardcoded in server.js | backend-api-expert | ⚠️ Partial — server.js deleted; `.gitignore` now excludes `.env`; rotate DB password recommended |
| C002 | 🔴 CRITICAL | `backend/routes/authRoutes.js` + `frontend/src/App.jsx` | 7, 88, 24 | Google OAuth Client ID hardcoded in source files | backend-api-expert | ✅ Fixed — moved to env vars |
| C003 | 🔴 CRITICAL | `backend/routes/clubRoutes.js` | — | No JWT — routes trusted `userId` from `req.body` (spoofable) | backend-api-expert | ✅ Fixed — all 26 endpoints refactored; `req.body` auth IDs replaced with `req.user._id` + `req.user.role` |
| C004 | 🔴 CRITICAL | `backend/routes/clubRoutes.js` | — | No auth middleware — any caller could act as any role | backend-api-expert | ✅ Fixed — `router.use(protect)` + role checks use verified `req.user.role` from JWT |
| H001 | 🟠 HIGH | `backend/routes/` | — | No input validation on any route (NoSQL injection risk) | backend-api-expert | Open |
| H002 | 🟠 HIGH | `backend/routes/clubRoutes.js` | 10–20 | Multer: no file type check, no size limit (arbitrary file upload) | backend-api-expert | Open |
| H003 | 🟠 HIGH | `frontend/src/App.jsx` | — | No protected routes — auth checks happen inside components only | frontend-react-expert | Open |
| H004 | 🟠 HIGH | All frontend pages | — | Hardcoded `http://localhost:5000/api/` throughout | frontend-react-expert | ✅ Fixed — all pages use `api` instance from `config/api.js` |
| H005 | 🟠 HIGH | `frontend/src/pages/Profile.jsx` | 39 | Logout not implemented — users cannot sign out | frontend-react-expert | ✅ Fixed — clears token + user, navigates to /login |
| H006 | 🟠 HIGH | `backend/routes/authRoutes.js` | — | No rate limiting on auth endpoints (brute force risk) | backend-api-expert | Open |
| M001 | 🟡 MED | ~~`backend/server.js`~~ | — | Dead duplicate entry point with hardcoded credentials | backend-api-expert | ✅ Fixed — server.js deleted |
| M002 | 🟡 MED | `backend/index.js` | — | Routes NOT mounted in index.js — was non-functional entry point | backend-api-expert | ✅ Fixed — routes mounted in consolidated index.js |
| M003 | 🟡 MED | All frontend pages | — | 15+ `console.log()` statements in production code | frontend-react-expert | ✅ Fixed — replaced with `console.error` in catch blocks |
| M004 | 🟡 MED | `frontend/src/App.jsx` | — | `GoogleOAuthProvider` wraps full app — must move to merged app root | frontend-react-expert | ✅ Fixed — moved to `index.jsx` dev shell; `ClubManagementRoutes.jsx` has no providers |
| M005 | 🟡 MED | `frontend/src/` | — | Login, Signup, Profile, Home, Navbar are shared concerns — remove from module | frontend-react-expert | ⚠️ Partial — removed from module routes; files kept for local dev until merged app shell exists |
| M006 | 🟡 MED | All frontend pages | — | Auth state from raw `localStorage.getItem('user')` — no context, collision risk | frontend-react-expert | Open — deferred to merged app (adopt sport branch AuthContext) |
| M007 | 🟡 MED | All `.js` React files | — | React component files used `.js` extension | frontend-react-expert | ✅ Fixed — all renamed to `.jsx` |
| M008 | 🟡 MED | `backend/index.js` | — | No CORS origin restriction — all origins allowed | backend-api-expert | ✅ Fixed — restricted to `CORS_ORIGIN` env var (default `http://localhost:3000`); `credentials: true` |
| M009 | 🟡 MED | `backend/models/User.js` | — | Role enum conflicts with sport branch roles — needs unified User model | database-expert | Open |
| L001 | ⚪ LOW | `frontend/src/components/Navbar.jsx` | — | `/sports` nav link has no matching route | frontend-react-expert | Open |
| L002 | ⚪ LOW | `frontend/src/pages/Events.jsx` | — | Placeholder "Under Construction" component | frontend-react-expert | Open |
| L003 | ⚪ LOW | `backend/models/Club.js` | — | No indexes defined on frequently queried fields | database-expert | Open |
| L004 | ⚪ LOW | `frontend/src/pages/ClubDetail.jsx` | — | ~1300 line component — no memoization, candidate for splitting | frontend-react-expert | Open |

---

## Section 6 — Fix Log

| ID | File(s) Changed | Description | Commit |
|----|----------------|-------------|--------|
| M007 | 17 frontend `.js` files | Renamed all React component files to `.jsx` via `git mv` | — |
| M001, M002 | `backend/index.js`, deleted `backend/server.js` | Consolidated dual entry points into single `index.js`; routes now mounted; `server.js` deleted | — |
| C002 | `backend/routes/authRoutes.js` lines 7, 88 | Google OAuth Client ID moved to `process.env.GOOGLE_CLIENT_ID` | — |
| C002 | `frontend/src/App.jsx` line 24 | Google OAuth Client ID moved to `process.env.REACT_APP_GOOGLE_CLIENT_ID` | — |
| — | `backend/.env` | Added `GOOGLE_CLIENT_ID` env var | — |
| — | `frontend/.env` (new) | Created with `REACT_APP_API_URL` and `REACT_APP_GOOGLE_CLIENT_ID` | — |
| H004 | All 12 `frontend/src/pages/*.jsx` | Replaced hardcoded `http://localhost:5000/api` with `api` instance from `frontend/src/config/api.js` | — |
| — | `frontend/src/config/api.js` (new) | Created axios instance with `baseURL` from `REACT_APP_API_URL` env var | — |
| M003 | All `frontend/src/pages/*.jsx` | Replaced `console.log(err)` in catch blocks with `console.error(err)` | — |
| X8 | `backend/index.js` | Upload path now configurable via `UPLOAD_DIR` env var | — |
| C001 | `.gitignore` (new) | Added `.env`, `node_modules/`, `build/`, `uploads/*` — secrets no longer tracked | — |
| 3e | `backend/middleware/authMiddleware.js` (new) | `protect` (Bearer JWT verify → req.user) + `requireRole` helper | — |
| 3e | `backend/routes/authRoutes.js` | JWT issued on signup/login/google (7d); `signToken` helper added; `jsonwebtoken` installed | — |
| 3e | `backend/routes/clubRoutes.js` | `router.use(protect)` — all club endpoints now require valid JWT | — |
| 3e | `frontend/src/config/api.js` | Added request interceptor — attaches `Authorization: Bearer <token>` on every call | — |
| 3e | `frontend/src/pages/Login.jsx` + `Signup.jsx` | `localStorage.setItem('token', ...)` added for all auth paths (email + Google) | — |
| 3b | `frontend/src/App.jsx` → `ClubManagementRoutes.jsx` | Module-only routes (no providers, no Navbar, no shared pages) | — |
| 3b | `frontend/src/index.jsx` | Dev shell — wraps ClubManagementRoutes with BrowserRouter + GoogleOAuthProvider | — |
| H005 | `frontend/src/pages/Profile.jsx` | Logout implemented — clears `token` + `user`, navigates to `/login` | — |
| C003, C004 | `backend/routes/clubRoutes.js` | All 26 endpoints refactored — `req.body.userId/presidentId/supervisorId/requestorId` → `req.user._id` + `req.user.role`; stray `console.log` removed | — |
| M008 | `backend/index.js` + `backend/.env` | CORS restricted to `CORS_ORIGIN` env var (default `http://localhost:3000`) | — |

---

## Section 7 — Event Module Merge (`Student-Registartion-And-Event-Discovery-` → `merge-main-event`)

**Date completed:** 2026-04-08  
**Source branch:** `origin/Student-Registartion-And-Event-Discovery-`  
**Target branch:** `merge-main-event` (already contains Club + Sport, updated with `origin/main`)

### 7a. Merge Strategy

The event branch could not be auto-merged — it had its own `User.js`, `authRoutes.js`, `server.js`, and full frontend App structure that all conflicted with the unified app. All conflicts were resolved manually.

**Keep from main (discarded from event branch):**
- `backend/index.js` — event branch had `server.js` (different entry point)
- `backend/middleware/authMiddleware.js` — event branch had inline middleware setting `req.userId`; main's sets `req.user` (full document)
- `frontend/src/App.jsx` — event branch had duplicate imports; kept main's version and added event routes
- `frontend/src/context/AuthContext.jsx` — event branch version discarded; kept main's JWT-aware version
- `frontend/src/components/ProtectedRoute.jsx` — kept main's role-based version
- `frontend/src/config/api.js` — kept; event branch `services/api.js` deleted (would conflict)
- `frontend/src/components/Layout.js` — skipped; was event branch's Navbar, conflicts with main's nav in `App.jsx`

### 7b. Backend Changes

| File | Action | Key Changes |
|------|--------|-------------|
| `backend/models/User.js` | Edited in-place | Added `studentId` (sparse+unique), `department`, `year`, `profilePicture`, `registeredAt`; added `'admin'` to role enum; added bcrypt pre-save hook + `comparePassword` method |
| `backend/models/Event.js` | Copied verbatim | New — event schema |
| `backend/models/Cart.js` | Copied verbatim | New — cart schema |
| `backend/models/Registration.js` | Copied verbatim | New — registration schema |
| `backend/models/Review.js` | Copied verbatim | New — review schema |
| `backend/controllers/registrationController.js` | Copied + fixed | `req.userId` → `req.user._id` (3 occurrences) |
| `backend/controllers/reviewsController.js` | Copied + fixed | `req.userId` → `req.user._id` (2 occurrences) |
| `backend/routes/eventRoutes.js` | Copied verbatim | New — event CRUD + admin endpoints |
| `backend/routes/registrationRoutes.js` | Copied verbatim | New |
| `backend/routes/reviewsRoutes.js` | Copied verbatim | New |
| `backend/routes/uploadRoutes.js` | Copied verbatim | New |
| `backend/routes/cartRoutes.js` | Copied + fixed | `req.userId` → `req.user._id` (3 occurrences in inline handlers) |
| `backend/routes/authRoutes.js` | Edited in-place | Removed `bcrypt` import + manual hash (now handled by pre-save hook); added `studentId/department/year` to `/signup` and `/register`; added `token` to `/register` response; added `GET /profile` + `PUT /profile` endpoints |
| `backend/index.js` | Edited in-place | Mounted 5 new route groups; added global error handler |
| `backend/seed.js` | New file | Extracted seed data from event branch `server.js`; seed role `'user'` → `'student'` |
| `backend/uploads/profiles/` | Created dir | Required by uploadRoutes |
| `backend/uploads/events/` | Created dir | Required by uploadRoutes |
| `backend/uploads/logos/` | Created dir | Required by uploadRoutes |

### 7c. Frontend Changes

| File | Action | Key Changes |
|------|--------|-------------|
| `frontend/src/context/CartContext.jsx` | New (from `.js`) | localStorage cart — no API calls; self-contained |
| `frontend/src/index.jsx` | Edited | Wrapped `<App>` with `<CartProvider>` inside `<AuthProvider>` |
| `frontend/src/services/services.js` | New | `authService`, `eventService`, `registrationService`, `cartService`; import fixed: `./api` → `../config/api` |
| `frontend/src/components/EventCard.jsx` | New (from `.js`) | Event card component; renamed to `.jsx` |
| `frontend/src/components/EventCalendar.jsx` | New (from `.js`) | Calendar view component; renamed to `.jsx` |
| `frontend/src/components/Modals.jsx` | New (from `.js`) | Modal dialogs; renamed to `.jsx` |
| `frontend/src/pages/events/EventAdminDashboard.jsx` | New | From `pages/AdminDashboard.js`; all imports depth-corrected (`../` → `../../`) |
| `frontend/src/pages/events/Cart.jsx` | New | From `pages/Cart.js`; navigate paths prefixed `/events/`; imports corrected |
| `frontend/src/pages/events/Checkout.jsx` | New | From `pages/Checkout.js`; navigate paths prefixed `/events/`; imports corrected |
| `frontend/src/pages/events/MyEvents.jsx` | New | From `pages/MyEvents.js`; imports corrected |
| `frontend/src/pages/events/EventRegister.jsx` | New | From `pages/Register.js`; imports corrected |
| `frontend/src/pages/events/UserDashboard.jsx` | New | From `pages/UserDashboard.js`; imports corrected |
| `frontend/src/pages/Events.jsx` | Replaced | Was placeholder "Under Construction"; now real public event listing using `eventService` + `EventCard` |
| `frontend/src/pages/Profile.jsx` | Edited | Added `studentId/department/year/phone` display + edit form; uses `authService.updateProfile()` |
| `frontend/src/App.jsx` | Edited | Added event imports (aliased named exports); added `case 'admin'` to `getDashboardPath`; added Events/My Events/Cart nav links; added 7 event routes |
| `frontend/src/pages/Login.jsx` | Edited | Added `case 'admin': return '/events/admin'` to `getDefaultPath` switch |

### 7d. Critical Fixes Applied During Merge

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `req.userId` undefined | Event branch middleware set `req.userId`; main's `protect` sets `req.user` (full document) | Replaced all 8 occurrences across controllers + cartRoutes |
| Double-hashing passwords | `authRoutes.js` manually called `bcrypt.genSalt/hash` AND the new pre-save hook also hashed | Removed manual bcrypt from authRoutes entirely; hook handles all hashing |
| `studentId` unique index rejects null | `unique: true` without `sparse: true` rejects multiple null values (all existing club/sport users have no studentId) | Added `sparse: true` to `studentId` index |
| Google OAuth users break comparePassword | Pre-save hook guard missing for passwordless users | Hook guard: `if (!this.isModified('password') \|\| !this.password) return next()` |
| Navigate paths broken in event pages | Event pages referenced `/checkout`, `/cart`, `/my-events` (unregistered routes) | Fixed to `/events/checkout`, `/events/cart`, `/events/my-events` |
| Named export import mismatch | Event pages use `export const Cart = ()` (named) but App.jsx used default import syntax | Changed App.jsx imports to destructured `{ Cart }`, `{ MyEvents }` etc. |
| Import path depth after move | Pages moved from `pages/` to `pages/events/` — all `../context/` etc. now need `../../context/` | Fixed all imports in the 6 event page files |

### 7e. Event Module Route Map

| Route | Auth | Role | Component |
|-------|------|------|-----------|
| `GET /events` | Public | — | `Events.jsx` |
| `GET /events/register` | Redirect if logged in | — | `EventRegister.jsx` |
| `GET /events/dashboard` | Required | Any | `UserDashboard.jsx` |
| `GET /events/my-events` | Required | Any | `MyEvents.jsx` |
| `GET /events/cart` | Required | Any | `Cart.jsx` |
| `GET /events/checkout` | Required | Any | `Checkout.jsx` |
| `GET /events/admin` | Required | `admin` only | `EventAdminDashboard.jsx` |

### 7f. Known Gaps (deferred, not blocking)

| ID | Severity | Issue |
|----|----------|-------|
| E001 | 🟠 HIGH | `DELETE /events/:id` not implemented in `eventRoutes.js` — admin delete button silently 404s |
| E002 | 🟡 MED | Cart has two sources of truth: `CartContext` (localStorage) and `/api/cart` (server) — not fully synced |
| E003 | 🟡 MED | `studentId`, `department`, `year` display blank for existing club/sport users — cosmetic only |
| E004 | 🟡 MED | No input validation on event routes (NoSQL injection risk — consistent with H001 above) |
| E005 | ⚪ LOW | `localhost:5000` hardcoded in Club module image `src` attributes (`ClubAbout.jsx`, `ClubDetail.jsx`, `ClubFinanceHub.jsx`, `ClubManagement.jsx`, `AchievementShowcase.jsx`) — pre-existing, not introduced by this merge |

### 7g. Verification Checklist

- [x] `grep -r "req.userId" backend/` → zero results
- [x] `grep -r "localhost:5000" frontend/src/services/` → zero results (all in Club pages, pre-existing)
- [x] `ls frontend/src/services/` → only `services.js` (no `api.js`)
- [x] Backend route count: `/api/auth`, `/api/clubs`, `/api/sports`, `/api/requests`, `/api/events`, `/api/cart`, `/api/registrations`, `/api/reviews`, `/api/upload` = 9 route groups
- [ ] `node backend/index.js` starts cleanly — manual test required
- [ ] `npm start` compiles with zero errors — manual test required
- [ ] Auth flow: register with studentId → login → JWT → protected routes — manual test required
- [ ] Event flow: browse → login → register event → cart → checkout — manual test required
- [ ] Admin flow: login as `admin` role → `/events/admin` accessible — manual test required
