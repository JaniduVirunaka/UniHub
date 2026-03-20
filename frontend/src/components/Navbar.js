import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png'; 
import '../App.css'; 

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <img src={logo} alt="UniHub Logo" className="logo-img" />
        </Link>
        <span className="brand-name">UniHub</span>
      </div>
      <div className="navbar-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/clubs" className="nav-link">Clubs</Link>
        <Link to="/login" className="nav-link" style={{ marginLeft: '40px', fontWeight: 'bold' }}>Login</Link>
        <Link to="/signup" className="btn" style={{ marginLeft: '15px', textDecoration: 'none' }}>Sign Up</Link>
      </div>
    </nav>
  );
}

export default Navbar;