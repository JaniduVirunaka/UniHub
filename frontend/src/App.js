import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Components
import Navbar from './components/Navbar';

// Auth Pages
import Login from './pages/Login';

import Register from './pages/Register';

// General Pages
import Home from './pages/Home';
import Profile from './pages/Profile';

// Dashboards
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

// User Features
import MyEvents from './pages/MyEvents';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

// Club System Pages
import ClubManagement from './pages/ClubManagement';
import ClubDetail from './pages/ClubDetail';
import Sponsorships from './pages/Sponsorships';
import ClubFinanceHub from './pages/ClubFinanceHub';
import GlobalAnalytics from './pages/GlobalAnalytics';
import AchievementShowcase from './pages/AchievementShowcase';
import ClubAbout from './pages/ClubAbout';
import ClubElections from './pages/ClubElections';

// Events
import Events from './pages/Events';
import Profile from './pages/Profile';

import './App.css';

// 🔐 Main App Content with Auth Logic
const AppContent = () => {
  const { user, loading } = useAuth();

  // Loading Screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container">
        <Routes>

          {/* 🌐 PUBLIC ROUTES */}
          {!user ? (
            <>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/register" element={<Register />} />

              <Route path="/events" element={<Events />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              {/* 👤 USER ROUTES */}
              {user.role !== 'admin' ? (
                <>
                  <Route path="/" element={<UserDashboard />} />
                  <Route path="/my-events" element={<MyEvents />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/events" element={<Events />} />

                  {/* Club Features */}
                  <Route path="/clubs" element={<ClubManagement />} />
                  <Route path="/clubs/:id" element={<ClubDetail />} />
                  <Route path="/clubs/:id/sponsorships" element={<Sponsorships />} />
                  <Route path="/clubs/:id/achievements" element={<AchievementShowcase />} />
                  <Route path="/clubs/:id/about" element={<ClubAbout />} />
                  <Route path="/clubs/:id/elections" element={<ClubElections />} />
                  <Route path="/clubs/:id/finance" element={<ClubFinanceHub />} />

                  <Route path="/profile" element={<Profile />} />
                </>
              ) : (
                /* 🛠 ADMIN ROUTES */
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="/supervisor/analytics" element={<GlobalAnalytics />} />
                  <Route path="/profile" element={<Profile />} />
                </>
              )}

              {/* 🔒 BLOCK AUTH PAGES AFTER LOGIN */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/signup" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}

        </Routes>
      </div>
    </>
  );
};

// 🚀 ROOT APP
function App() {
  return (
    <GoogleOAuthProvider clientId="565636881036-t3jicm0kuom2b1o9b5avkf62ijbpjo6n.apps.googleusercontent.com">
      <Router>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;