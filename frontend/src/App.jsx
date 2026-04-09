import React from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, LogIn, UserPlus, LayoutDashboard, LogOut, Users, Trophy, Calendar, Ticket, ShoppingCart, User } from 'lucide-react';
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

// Sport module — admin
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateSport from './pages/admin/CreateSport';
import ManageSports from './pages/admin/ManageSports';
import ManageRequests from './pages/admin/ManageRequests';
import ManageTeam from './pages/admin/ManageTeam';

// Sport module — captain
import CaptainDashboard from './pages/captain/CaptainDashboard';
import CaptainRequests from './pages/captain/CaptainRequests';

// Sport module — vice captain
import ViceCaptainDashboard from './pages/viceCaptain/ViceCaptainDashboard';
import ViceCaptainRequests from './pages/viceCaptain/ViceCaptainRequests';

// Sport module — student
import StudentDashboard from './pages/student/StudentDashboard';
import SportsList from './pages/student/SportsList';
import SportDetails from './pages/student/SportDetails';
import MyRequests from './pages/student/MyRequests';

// Event module
import Events from './pages/Events';
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
    case 'admin':        return '/events/admin';   // event organiser
    default:             return '/clubs'; // student, president, supervisor
  }
}

function NavLink({ to, icon, children }) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
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
  const isEventUser = user && ['student', 'admin', 'president', 'supervisor'].includes(user.role);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
        <Link to="/" className="text-lg font-bold tracking-wide text-white no-underline">
          UniHub
          <span className="ml-2 text-xs font-normal text-slate-400">Clubs · Sports · Events</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {!user && (
            <>
              <NavLink to="/events"  icon={<Calendar size={16} />}>Events</NavLink>
              <NavLink to="/login"   icon={<LogIn size={16} />}>Login</NavLink>
              <NavLink to="/signup"  icon={<UserPlus size={16} />}>Sign Up</NavLink>
            </>
          )}

          {user && (
            <>
              {/* Club module */}
              {user.role !== 'admin' && (
                <NavLink to="/clubs" icon={<Users size={16} />}>Clubs</NavLink>
              )}

              {/* Sport module */}
              {SPORT_ROLES.includes(user.role) && (
                <NavLink to={getDashboardPath(user)} icon={<Trophy size={16} />}>Sports</NavLink>
              )}
              {user.role === 'student' && (
                <NavLink to="/student" icon={<Trophy size={16} />}>Sports</NavLink>
              )}

              {/* Event module */}
              <NavLink to="/events" icon={<Calendar size={16} />}>Events</NavLink>
              {isEventUser && (
                <>
                  <NavLink to="/events/my-events" icon={<Ticket size={16} />}>My Events</NavLink>
                  <NavLink to="/events/cart" icon={<ShoppingCart size={16} />}>Cart</NavLink>
                </>
              )}

              <NavLink to={getDashboardPath(user)} icon={<LayoutDashboard size={16} />}>Dashboard</NavLink>
              <NavLink to="/profile" icon={<User size={16} />}>Profile</NavLink>

              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
                {user.name} · {user.role}
              </div>

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
        {/* Root: landing page for guests, dashboard redirect for authenticated users */}
        <Route
          path="/"
          element={user ? <Navigate to={getDashboardPath(user)} replace /> : <HomePage />}
        />

        {/* Auth routes */}
        <Route path="/login"    element={user ? <Navigate to={getDashboardPath(user)} replace /> : <Login />} />
        <Route path="/signup"   element={user ? <Navigate to={getDashboardPath(user)} replace /> : <Signup />} />
        <Route path="/register" element={user ? <Navigate to={getDashboardPath(user)} replace /> : <Register />} />
        <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* ─── Club Module ─── */}
        <Route path="/clubs" element={<ProtectedRoute><ClubManagement /></ProtectedRoute>} />
        <Route path="/clubs/:id" element={<ProtectedRoute><ClubDetail /></ProtectedRoute>} />
        <Route path="/clubs/:id/about" element={<ProtectedRoute><ClubAbout /></ProtectedRoute>} />
        <Route path="/clubs/:id/elections" element={<ProtectedRoute><ClubElections /></ProtectedRoute>} />
        <Route path="/clubs/:id/finance" element={<ProtectedRoute><ClubFinanceHub /></ProtectedRoute>} />
        <Route path="/clubs/:id/achievements" element={<ProtectedRoute><AchievementShowcase /></ProtectedRoute>} />
        <Route path="/clubs/:id/sponsorships" element={<ProtectedRoute><Sponsorships /></ProtectedRoute>} />
        <Route path="/supervisor/analytics" element={
          <ProtectedRoute allowedRoles={['supervisor']}><GlobalAnalytics /></ProtectedRoute>
        } />

        {/* ─── Sport Module — Admin ─── */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['sport_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/create-sport" element={<ProtectedRoute allowedRoles={['sport_admin']}><CreateSport /></ProtectedRoute>} />
        <Route path="/admin/manage-sports" element={<ProtectedRoute allowedRoles={['sport_admin']}><ManageSports /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute allowedRoles={['sport_admin']}><ManageRequests /></ProtectedRoute>} />
        <Route path="/admin/team" element={<ProtectedRoute allowedRoles={['sport_admin']}><ManageTeam /></ProtectedRoute>} />

        {/* ─── Sport Module — Captain ─── */}
        <Route path="/captain" element={<ProtectedRoute allowedRoles={['captain']}><CaptainDashboard /></ProtectedRoute>} />
        <Route path="/captain/requests" element={<ProtectedRoute allowedRoles={['captain']}><CaptainRequests /></ProtectedRoute>} />

        {/* ─── Sport Module — Vice Captain ─── */}
        <Route path="/vice-captain" element={<ProtectedRoute allowedRoles={['vice_captain']}><ViceCaptainDashboard /></ProtectedRoute>} />
        <Route path="/vice-captain/requests" element={<ProtectedRoute allowedRoles={['vice_captain']}><ViceCaptainRequests /></ProtectedRoute>} />

        {/* ─── Sport Module — Student ─── */}
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/student/sports" element={<ProtectedRoute allowedRoles={['student']}><SportsList /></ProtectedRoute>} />
        <Route path="/student/sports/:id" element={<ProtectedRoute allowedRoles={['student']}><SportDetails /></ProtectedRoute>} />
        <Route path="/student/my-requests" element={<ProtectedRoute allowedRoles={['student']}><MyRequests /></ProtectedRoute>} />

        {/* ─── Event Module — Public ─── */}
        <Route path="/events" element={<Events />} />
        <Route path="/events/register" element={
          user ? <Navigate to={getDashboardPath(user)} replace /> : <EventRegister />
        } />

        {/* ─── Event Module — All authenticated ─── */}
        <Route path="/events/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
        <Route path="/events/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
        <Route path="/events/cart"      element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/events/checkout"  element={<ProtectedRoute><Checkout /></ProtectedRoute>} />

        {/* ─── Event Module — Admin (event organiser) ─── */}
        <Route path="/events/admin" element={
          <ProtectedRoute allowedRoles={['admin']}><EventAdminDashboard /></ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
