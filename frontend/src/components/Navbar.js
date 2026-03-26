import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/unihub_logo.png'; 
import '../App.css'; 

function Navbar() {
  // Read from local storage so the theme persists when you refresh!
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Every time the theme state changes, update the HTML tag and save to storage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

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

        {/* --- THEME TOGGLE BUTTON --- */}
        <button 
          onClick={toggleTheme} 
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', 
            padding: '5px', marginLeft: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center' 
          }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {/* Auth Buttons */}
        <div style={{ borderLeft: '1px solid var(--border-color)', height: '24px', margin: '0 5px' }}></div>
        <Link to="/login" className="nav-link" style={{ fontWeight: '700' }}>Login</Link>
        <Link to="/signup" className="btn" style={{ padding: '0.5rem 1.25rem' }}>Sign Up</Link>
      </div>
    </nav>
  );
}

export default Navbar;