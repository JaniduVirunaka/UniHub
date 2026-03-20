import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [clubs, setClubs] = useState([]);

  // Fetch a preview of clubs to show public visitors
  useEffect(() => {
    axios.get('http://localhost:5000/api/clubs')
      .then(res => setClubs(res.data.slice(0, 3))) // Only show the first 3 as a preview
      .catch(err => console.log(err));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--primary-color)', color: 'white' }}>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 1rem 0' }}>Welcome to UniHub</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', opacity: 0.9 }}>
          Discover events, join clubs, and connect with your campus community.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <Link to="/signup">
            <button className="btn" style={{ backgroundColor: 'white', color: 'var(--primary-color)' }}>Get Started</button>
          </Link>
          <Link to="/login">
            <button className="btn" style={{ border: '2px solid white', backgroundColor: 'transparent' }}>Log In</button>
          </Link>
        </div>
      </div>

      {/* Public Club Preview Section */}
      <div style={{ marginTop: '2rem' }}>
        <h2 style={{ color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
          Featured Campus Clubs
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '1rem' }}>
          {clubs.length === 0 ? (
            <p>Loading campus clubs...</p>
          ) : (
            clubs.map(club => (
              <div key={club._id} className="card" style={{ marginBottom: '0' }}>
                <h3 style={{ color: 'var(--primary-color)', marginTop: '0' }}>{club.name}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{club.description}</p>
              </div>
            ))
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>Want to see more or manage a club?</p>
          <Link to="/login">
             <button className="btn">Log in to view full directory</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;