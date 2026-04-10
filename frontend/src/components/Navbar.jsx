import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/unihub_logo.png';
import '../App.css';

function Navbar() {
  const [isDark, setIsDark] = useState(false);

  // On mount: restore saved preference or respect OS setting
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);

    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsDark(true);
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
      setIsDark(false);
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
        <Link to="/events" className="nav-link">Events</Link>
        <Link to="/sports" className="nav-link">Sports</Link>
        <Link to="/profile" className="nav-link">Profile</Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to night mode'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem',
            padding: '5px', borderRadius: '50%', display: 'flex', alignItems: 'center'
          }}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <div className="nav-divider"></div>
        <Link to="/login" className="nav-link" style={{ fontWeight: '700' }}>Login</Link>
        <Link to="/signup" className="btn" style={{ padding: '0.5rem 1.25rem' }}>Sign Up</Link>
      </div>
    </nav>
  );
}

export default Navbar;