import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [clubs, setClubs] = useState([]);
  
  // TODO: [Teammate Name] - Add state for events here (e.g., const [events, setEvents] = useState([]))

  useEffect(() => {
    // Fetch a preview of clubs
    axios.get('http://localhost:5000/api/clubs')
      .then(res => setClubs(res.data.slice(0, 3)))
      .catch(err => console.log(err));

    // TODO: [Teammate Name] - Fetch a preview of events here to populate the Events section below
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

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '2rem' }}>
        
        {/* --- LEFT COLUMN: CLUBS (Your Feature) --- */}
        <div style={{ flex: '1 1 60%' }}>
          <h2 style={{ color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
            Featured Campus Clubs
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '1rem' }}>
            {clubs.length === 0 ? (
              <p>Loading campus clubs...</p>
            ) : (
              clubs.map(club => (
                <div key={club._id} className="card" style={{ marginBottom: '0' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginTop: '0' }}>{club.name}</h3>
                  <p style={{ color: 'var(--text-muted)' }}>{club.description.substring(0, 80)}...</p>
                </div>
              ))
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/clubs">
              <button className="btn" style={{ backgroundColor: '#6b7280' }}>View All Clubs</button>
            </Link>
          </div>
        </div>

        {/* --- RIGHT COLUMN: EVENTS & ANNOUNCEMENTS (Teammates' Features) --- */}
        <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Events Feature Scaffolding */}
          <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
            <h3 style={{ marginTop: 0 }}>📅 Upcoming Events</h3>
            {/* TODO: [Sakurani] - Map through actual events data here instead of hardcoding */}
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <strong>Tech Symposium 2026</strong><br/>
                <small style={{ color: 'var(--text-muted)' }}>Tomorrow at 10:00 AM | Main Hall</small>
              </li>
              <li style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <strong>Photography Walk</strong><br/>
                <small style={{ color: 'var(--text-muted)' }}>Friday at 4:00 PM | Campus Gardens</small>
              </li>
            </ul>
            <Link to="/events" style={{ display: 'block', textAlign: 'center', marginTop: '10px', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: 'bold' }}>
              See all events →
            </Link>
          </div>

          {/* Quick Profile/Announcements Scaffolding */}
          <div className="card" style={{ borderTop: '4px solid #10b981' }}>
            <h3 style={{ marginTop: 0 }}>📣 Campus News - Chamod</h3>
             {/* TODO: [Chamod] - Pull global announcements here */}
            <p style={{ color: 'var(--text-muted)' }}>
              <em>Feature pending backend integration. Global announcements will display here.</em>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;