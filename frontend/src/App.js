import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ClubManagement from './pages/ClubManagement';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ClubDetail from './pages/ClubDetail';
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
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;