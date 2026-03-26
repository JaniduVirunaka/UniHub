import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/unihub_logo.png'; 
import '../App.css'; 

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="UniHub Logo" className="logo-img" />
        </Link>
        <span className="brand-name">UniHub</span>
      </div>
      
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/clubs" className="nav-link">Clubs</Link>
        
        {/* Teammates' Tabs */}
        <Link to="/events" className="nav-link">Events</Link>
        <Link to="/profile" className="nav-link">Profile</Link>

        {/* Auth Buttons using the new App.css standard buttons */}
        <div style={{ borderLeft: '1px solid var(--border-color)', height: '24px', margin: '0 10px' }}></div>
        <Link to="/login" className="nav-link" style={{ fontWeight: '700' }}>Login</Link>
        <Link to="/signup" className="btn" style={{ padding: '0.5rem 1.25rem' }}>Sign Up</Link>
      </div>
    </nav>
  );
}

export default Navbar;