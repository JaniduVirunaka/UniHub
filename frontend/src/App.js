import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ClubManagement from './pages/ClubManagement';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ClubDetail from './pages/ClubDetail';
import Sponsorships from './pages/Sponsorships';
import MembershipFees from './pages/MembershipFees';
import AchievementShowcase from './pages/AchievementShowcase';
import ClubAbout from './pages/ClubAbout';
import ClubElections from './pages/ClubElections'; 
import Events from './pages/Events';
import Profile from './pages/Profile';

import './App.css';

function App() {
  return (
    <Router>
      <Navbar /> 
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          
          <Route path="/clubs" element={<ClubManagement />} />
          <Route path="/clubs/:id" element={<ClubDetail />} />
          <Route path="/clubs/:id/sponsorships" element={<Sponsorships />} />
          <Route path="/clubs/:id/achievements" element={<AchievementShowcase />} />
          <Route path="/clubs/:id/fees" element={<MembershipFees />} />
          <Route path="/clubs/:id/about" element={<ClubAbout />} />
          <Route path="/clubs/:id/elections" element={<ClubElections />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        
          <Route path="/events" element={<Events />} />
          <Route path="/profile" element={<Profile />} />
      
        </Routes>
      </div>
    </Router>
  );
}

export default App;