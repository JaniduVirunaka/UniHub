import { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, LogOut, Users, Trophy, Calendar, User, ShieldCheck, Sun, Moon, Menu, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { pageTransition, slideDown } from './hooks/animationVariants';
import { useScrollProgress } from './hooks/useScrollProgress';

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

function getSportsPath(user) {
  switch (user.role) {
    case 'sport_admin':  return '/admin';
    case 'captain':      return '/captain';
    case 'vice_captain': return '/vice-captain';
    case 'student':      return '/student/sports';
    default:             return '/sports';
  }
}

function NavLink({ to, icon, children, end = false, onClick }) {
  const location = useLocation();
  const active = end
    ? location.pathname === to
    : location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
          : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-white/10'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function AppNav({ isDark, toggleTheme }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const sportNavRoles = [...SPORT_ROLES, 'student', 'president'];
  const [menuOpen, setMenuOpen] = useState(false);
  const scaleX = useScrollProgress();

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const navLinks = (
    <>
      {!user && (
        <>
          <NavLink to="/clubs"  icon={<Users size={16} />} onClick={() => setMenuOpen(false)}>Clubs</NavLink>
          <NavLink to="/events" icon={<Calendar size={16} />} end onClick={() => setMenuOpen(false)}>Events</NavLink>
          <NavLink to="/sports" icon={<Trophy size={16} />} onClick={() => setMenuOpen(false)}>Sports</NavLink>
          <NavLink to="/login"  icon={<LogIn size={16} />} onClick={() => setMenuOpen(false)}>Login</NavLink>
          <NavLink to="/signup" icon={<UserPlus size={16} />} onClick={() => setMenuOpen(false)}>Sign Up</NavLink>
        </>
      )}
      {user && (
        <>
          {user.role !== 'admin' && (
            <NavLink to="/clubs" icon={<Users size={16} />} onClick={() => setMenuOpen(false)}>Clubs</NavLink>
          )}
          <NavLink to="/events" icon={<Calendar size={16} />} end onClick={() => setMenuOpen(false)}>Events</NavLink>
          {sportNavRoles.includes(user.role) && (
            <NavLink to={getSportsPath(user)} icon={<Trophy size={16} />} onClick={() => setMenuOpen(false)}>Sports</NavLink>
          )}
          {user.role === 'admin' && (
            <NavLink to="/events/admin" icon={<ShieldCheck size={16} />} onClick={() => setMenuOpen(false)}>Admin</NavLink>
          )}
          <NavLink to="/profile" icon={<User size={16} />} onClick={() => setMenuOpen(false)}>Profile</NavLink>
          <button
            type="button"
            onClick={() => { logout(); setMenuOpen(false); }}
            className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            <LogOut size={16} />
            Logout
          </button>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70 dark:backdrop-blur-xl">
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX, transformOrigin: 'left' }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 dark:bg-indigo-400"
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        {/* Logo */}
        <Link to="/home" className="text-lg font-bold tracking-wide text-slate-900 no-underline dark:text-white">
          <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent dark:from-indigo-400 dark:to-emerald-400">
            UniHub
          </span>
          <span className="ml-2 hidden text-xs font-normal text-slate-400 sm:inline">Clubs · Sports · Events</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-2 md:flex" aria-label="Main navigation">
          {navLinks}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to night mode'}
            className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 transition hover:bg-slate-100/80 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to night mode'}
            className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 transition hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:bg-white/10"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(p => !p)}
            className="inline-flex items-center justify-center rounded-full p-2 text-slate-700 transition hover:bg-slate-100/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-menu"
            key="mobile-menu"
            variants={slideDown}
            initial="hidden"
            animate="visible"
            exit="exit"
            aria-label="Mobile navigation"
            className="overflow-hidden border-t border-slate-200/60 dark:border-white/10 md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function App() {
  const { user } = useAuth();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  // Restore theme preference on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const nowDark = !isDark;
    if (nowDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
    setIsDark(nowDark);
  };

  return (
    <>
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[100] focus-visible:rounded-xl focus-visible:bg-indigo-600 focus-visible:px-4 focus-visible:py-2.5 focus-visible:text-white focus-visible:shadow-lg focus-visible:ring-2 focus-visible:ring-white"
      >
        Skip to main content
      </a>

      <div className="min-h-screen">
        <AppNav isDark={isDark} toggleTheme={toggleTheme} />

        <main id="main-content">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
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
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}

export default App;
