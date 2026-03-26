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
      <div className="card" style={{ 
        textAlign: 'center', 
        padding: '5rem 2rem', 
        background: 'linear-gradient(135deg, var(--primary-color), #8B5CF6)', 
        color: 'white',
        border: 'none',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', color: 'white' }}>Welcome to UniHub</h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
          Discover events, join clubs, and connect with your campus community.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <Link to="/signup" className="btn" style={{ backgroundColor: 'white', color: 'var(--primary-color)' }}>
            Get Started
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ color: 'white', borderColor: 'white' }}>
            Log In
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginTop: '3rem' }}>
        
        {/* --- LEFT COLUMN: CLUBS --- */}
        <div style={{ flex: '1 1 60%' }}>
          <h2 style={{ color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span> Featured Campus Clubs
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '1.5rem' }}>
            {clubs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading campus clubs...</p>
            ) : (
              clubs.map(club => (
                <div key={club._id} className="card card-hover" style={{ marginBottom: '0', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginTop: '0', fontSize: '1.25rem' }}>{club.name}</h3>
                  <p style={{ color: 'var(--text-muted)', flex: 1, fontSize: '0.95rem' }}>{club.description.substring(0, 100)}...</p>
                </div>
              ))
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <Link to="/clubs" className="btn" style={{ backgroundColor: 'var(--text-secondary)' }}>
              View All Clubs Directory →
            </Link>
          </div>
        </div>

        {/* --- RIGHT COLUMN: EVENTS & ANNOUNCEMENTS --- */}
        <div style={{ flex: '1 1 35%', display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* Events Feature Scaffolding */}
          <div className="card card-hover" style={{ borderTop: '4px solid var(--warning)', marginBottom: 0 }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>📅 Upcoming Events</h3>
            {/* TODO: [Sakurani] - Map through actual events data here instead of hardcoding */}
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              <li style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <strong style={{ color: 'var(--text-main)' }}>Tech Symposium 2026</strong><br/>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tomorrow at 10:00 AM | Main Hall</span>
              </li>
              <li style={{ padding: '12px 0', borderBottom: 'none' }}>
                <strong style={{ color: 'var(--text-main)' }}>Photography Walk</strong><br/>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Friday at 4:00 PM | Campus Gardens</span>
              </li>
            </ul>
            <Link to="/events" style={{ display: 'block', textAlign: 'center', marginTop: '15px', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.9rem' }}>
              See all events →
            </Link>
          </div>

          {/* Quick Announcements Scaffolding */}
          <div className="card card-hover" style={{ borderTop: '4px solid var(--success)', marginBottom: 0 }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>📣 Campus News</h3>
             {/* TODO: [Chamod] - Pull global announcements here */}
            <div style={{ padding: '15px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem', fontStyle: 'italic' }}>
                Global announcements will display here once the backend is integrated.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Home;