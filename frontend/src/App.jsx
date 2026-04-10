import React from 'react';
import { Routes, Route, Link, Navigate, useLocation, NavLink as RRNavLink } from 'react-router-dom';
import { LogIn, UserPlus, LogOut, Users, Trophy, Calendar, User, ShieldCheck } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Shared pages
import HomePage from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';

// Sport pages — auth
import Register from './pages/auth/Register';

// Club module
import ClubManagement from './pages/clubs/ClubManagement';
import ClubDetail from './pages/clubs/ClubDetail';
import ClubAbout from './pages/clubs/ClubAbout';
import ClubElections from './pages/clubs/ClubElections';
import ClubFinanceHub from './pages/clubs/ClubFinanceHub';
import AchievementShowcase from './pages/clubs/AchievementShowcase';
import Sponsorships from './pages/clubs/Sponsorships';
import GlobalAnalytics from './pages/clubs/GlobalAnalytics';

// Sports module — public
import PublicSports from './pages/sports/PublicSports';

// Sports module — admin
import AdminDashboard from './pages/sports/admin/AdminDashboard';
import CreateSport    from './pages/sports/admin/CreateSport';
import ManageSports   from './pages/sports/admin/ManageSports';
import ManageRequests from './pages/sports/admin/ManageRequests';
import ManageTeam     from './pages/sports/admin/ManageTeam';

// Sports module — captain
import CaptainDashboard from './pages/sports/captain/CaptainDashboard';
import CaptainRequests  from './pages/sports/captain/CaptainRequests';

// Sports module — vice captain
import ViceCaptainDashboard from './pages/sports/viceCaptain/ViceCaptainDashboard';
import ViceCaptainRequests  from './pages/sports/viceCaptain/ViceCaptainRequests';

// Sports module — student
import StudentDashboard from './pages/sports/student/StudentDashboard';
import SportsList       from './pages/sports/student/SportsList';
import SportDetails     from './pages/sports/student/SportDetails';
import MyRequests       from './pages/sports/student/MyRequests';

// Event module
import EventsLayout from './pages/events/EventsLayout';
import Events from './pages/events/Events';
import { AdminDashboard as EventAdminDashboard } from './pages/events/EventAdminDashboard';
import { Cart }          from './pages/events/Cart';
import { Checkout }      from './pages/events/Checkout';
import { MyEvents }      from './pages/events/MyEvents';
import { Register as EventRegister } from './pages/events/EventRegister';
import { UserDashboard } from './pages/events/UserDashboard';

import './App.css';

const SPORT_ROLES = ['sport_admin', 'captain', 'vice_captain'];

function getDashboardPath(user) {
  if (!user) return '/login';
  switch (user.role) {
    case 'sport_admin':  return '/admin';
    case 'captain':      return '/captain';
    case 'vice_captain': return '/vice-captain';
    case 'admin':        return '/events/admin';
    default:             return '/clubs';
  }
}

// Returns the correct Sports section URL for each role
function getSportsPath(user) {
  switch (user.role) {
    case 'sport_admin':  return '/admin';
    case 'captain':      return '/captain';
    case 'vice_captain': return '/vice-captain';
    case 'student':      return '/student/sports';
    default:             return '/sports'; // president, supervisor → public listing
  }
}

function NavLink({ to, icon, children, end = false }) {
  const location = useLocation();
  const active = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-emerald-400 text-slate-950'
          : 'bg-white/5 text-slate-200 hover:bg-white/10'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function AppNav() {
  const { user, logout } = useAuth();
  const sportNavRoles = [...SPORT_ROLES, 'student', 'president'];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <Link to="/home" className="text-lg font-bold tracking-wide text-white no-underline">
          UniHub
          <span className="ml-2 text-xs font-normal text-slate-400">Clubs · Sports · Events</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {/* ── GUEST NAV ── */}
          {!user && (
            <>
              <NavLink to="/clubs"  icon={<Users size={16} />}>Clubs</NavLink>
              <NavLink to="/events" icon={<Calendar size={16} />} end>Events</NavLink>
              <NavLink to="/sports" icon={<Trophy size={16} />}>Sports</NavLink>
              <NavLink to="/login"  icon={<LogIn size={16} />}>Login</NavLink>
              <NavLink to="/signup" icon={<UserPlus size={16} />}>Sign Up</NavLink>
            </>
          )}

          {/* ── AUTHENTICATED NAV ── */}
          {user && (
            <>
              {/* Clubs — everyone except event admin */}
              {user.role !== 'admin' && (
                <NavLink to="/clubs" icon={<Users size={16} />}>Clubs</NavLink>
              )}

              {/* Events — everyone */}
              <NavLink to="/events" icon={<Calendar size={16} />} end>Events</NavLink>

              {/* Sports — roles that use sports module (including club presidents) */}
              {sportNavRoles.includes(user.role) && (
                <NavLink to={getSportsPath(user)} icon={<Trophy size={16} />}>Sports</NavLink>
              )}

              {/* Admin shortcut — event admin only */}
              {user.role === 'admin' && (
                <NavLink to="/events/admin" icon={<ShieldCheck size={16} />}>Admin</NavLink>
              )}

              {/* Profile — everyone */}
              <NavLink to="/profile" icon={<User size={16} />}>Profile</NavLink>

              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <AppNav />

      <Routes>
        {/* ── Root: guests see home, authenticated users go to their dashboard ── */}
        <Route
          path="/"
          element={user ? <Navigate to={getDashboardPath(user)} replace /> : <HomePage />}
        />
        {/* ── /home always renders the landing page regardless of auth state ── */}
        <Route path="/home" element={<HomePage />} />

        {/* ── Auth routes ── */}
        <Route path="/login"    element={user ? <Navigate to={getDashboardPath(user)} replace /> : <Login />} />
        <Route path="/signup"   element={user ? <Navigate to={getDashboardPath(user)} replace /> : <Signup />} />
        <Route path="/register" element={user ? <Navigate to={getDashboardPath(user)} replace /> : <Register />} />
        <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* ── Club module (public listing, protected detail pages) ── */}
        <Route path="/clubs" element={<ClubManagement />} />
        <Route path="/clubs/:id"               element={<ProtectedRoute><ClubDetail /></ProtectedRoute>} />
        <Route path="/clubs/:id/about"         element={<ProtectedRoute><ClubAbout /></ProtectedRoute>} />
        <Route path="/clubs/:id/elections"     element={<ProtectedRoute><ClubElections /></ProtectedRoute>} />
        <Route path="/clubs/:id/finance"       element={<ProtectedRoute><ClubFinanceHub /></ProtectedRoute>} />
        <Route path="/clubs/:id/achievements"  element={<ProtectedRoute><AchievementShowcase /></ProtectedRoute>} />
        <Route path="/clubs/:id/sponsorships"  element={<ProtectedRoute><Sponsorships /></ProtectedRoute>} />
        <Route path="/supervisor/analytics"    element={
          <ProtectedRoute allowedRoles={['supervisor']}><GlobalAnalytics /></ProtectedRoute>
        } />

        {/* ── Sports module — public listing ── */}
        <Route path="/sports" element={<PublicSports />} />

        {/* ── Sports module — admin ── */}
        <Route path="/admin"               element={<ProtectedRoute allowedRoles={['sport_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/create-sport"  element={<ProtectedRoute allowedRoles={['sport_admin']}><CreateSport /></ProtectedRoute>} />
        <Route path="/admin/manage-sports" element={<ProtectedRoute allowedRoles={['sport_admin']}><ManageSports /></ProtectedRoute>} />
        <Route path="/admin/requests"      element={<ProtectedRoute allowedRoles={['sport_admin']}><ManageRequests /></ProtectedRoute>} />
        <Route path="/admin/team"          element={<ProtectedRoute allowedRoles={['sport_admin']}><ManageTeam /></ProtectedRoute>} />

        {/* ── Sports module — captain ── */}
        <Route path="/captain"          element={<ProtectedRoute allowedRoles={['captain']}><CaptainDashboard /></ProtectedRoute>} />
        <Route path="/captain/requests" element={<ProtectedRoute allowedRoles={['captain']}><CaptainRequests /></ProtectedRoute>} />

        {/* ── Sports module — vice captain ── */}
        <Route path="/vice-captain"          element={<ProtectedRoute allowedRoles={['vice_captain']}><ViceCaptainDashboard /></ProtectedRoute>} />
        <Route path="/vice-captain/requests" element={<ProtectedRoute allowedRoles={['vice_captain']}><ViceCaptainRequests /></ProtectedRoute>} />

        {/* ── Sports module — student ── */}
        <Route path="/student"                element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/sports"         element={<ProtectedRoute allowedRoles={['student']}><SportsList /></ProtectedRoute>} />
        <Route path="/student/sports/:id"     element={<ProtectedRoute allowedRoles={['student']}><SportDetails /></ProtectedRoute>} />
        <Route path="/student/my-requests"    element={<ProtectedRoute allowedRoles={['student']}><MyRequests /></ProtectedRoute>} />

        {/* ── Event module (nested under EventsLayout for sub-navbar) ── */}
        <Route path="/events" element={<EventsLayout />}>
          <Route index element={<Events />} />
          <Route path="register" element={user ? <Navigate to={getDashboardPath(user)} replace /> : <EventRegister />} />
          <Route path="dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
          <Route path="cart"      element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="checkout"  element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="admin"     element={<ProtectedRoute allowedRoles={['admin']}><EventAdminDashboard /></ProtectedRoute>} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
