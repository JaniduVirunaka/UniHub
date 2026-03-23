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

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;