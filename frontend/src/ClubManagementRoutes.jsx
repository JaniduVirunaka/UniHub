import React from 'react';
import { Routes, Route } from 'react-router-dom';

import ClubManagement from './pages/ClubManagement';
import ClubDetail from './pages/ClubDetail';
import ClubAbout from './pages/ClubAbout';
import ClubElections from './pages/ClubElections';
import ClubFinanceHub from './pages/ClubFinanceHub';
import AchievementShowcase from './pages/AchievementShowcase';
import Sponsorships from './pages/Sponsorships';
import GlobalAnalytics from './pages/GlobalAnalytics';

import './App.css';

/**
 * Club Management Module Routes
 *
 * Mount these routes inside your app's <Router> and <Routes> tree.
 * The parent app is responsible for:
 *   - BrowserRouter / MemoryRouter
 *   - GoogleOAuthProvider
 *   - Shared Navbar
 *   - Auth routes (/login, /signup)
 *   - Shared pages (/, /profile)
 */
function ClubManagementRoutes() {
  return (
    <Routes>
      <Route path="/clubs" element={<ClubManagement />} />
      <Route path="/clubs/:id" element={<ClubDetail />} />
      <Route path="/clubs/:id/about" element={<ClubAbout />} />
      <Route path="/clubs/:id/elections" element={<ClubElections />} />
      <Route path="/clubs/:id/finance" element={<ClubFinanceHub />} />
      <Route path="/clubs/:id/achievements" element={<AchievementShowcase />} />
      <Route path="/clubs/:id/sponsorships" element={<Sponsorships />} />
      <Route path="/supervisor/analytics" element={<GlobalAnalytics />} />
    </Routes>
  );
}

export default ClubManagementRoutes;