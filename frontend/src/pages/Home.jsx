import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../config/api';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

function Home() {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);

  const [heroRef, heroVisible] = useScrollAnimation();
  const [metricsRef, metricsVisible] = useScrollAnimation();
  const [clubsRef, clubsVisible] = useScrollAnimation();
  const [eventsRef, eventsVisible] = useScrollAnimation();

  useEffect(() => {
    api.get('/clubs')
      .then(res => setClubs(res.data.slice(0, 3)))
      .catch(err => console.error(err));
    api.get('/events')
      .then(res => setEvents(res.data.slice(0, 2)))
      .catch(err => console.error(err));
  }, []);

 return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* 1. HERO SECTION */}
      <div 
        ref={heroRef} 
        className={`card fade-in-section ${heroVisible ? 'is-visible' : ''}`}
        style={{ 
          textAlign: 'center', padding: '6rem 2rem', background: 'linear-gradient(135deg, var(--primary-color), #8B5CF6)', 
          color: 'white', border: 'none', boxShadow: 'var(--shadow-lg)', position: 'relative', overflow: 'hidden', margin: 0
        }}
      >
        <h1 style={{ fontSize: '3.5rem', margin: '0 0 1rem 0', color: 'white', letterSpacing: '-1px' }}>
          Your Campus. <span style={{ color: '#FDE047' }}>Connected.</span>
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2.5rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 2.5rem auto', lineHeight: '1.8' }}>
          UniHub is the ultimate student experience platform. Discover upcoming events, join elite clubs, and track your campus legacy all in one place.
        </p>
        <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
          <Link to="/signup" className="btn" style={{ backgroundColor: 'white', color: 'var(--primary-color)', padding: '12px 24px', fontSize: '1.1rem' }}>Create Student Account</Link>
          <Link to="/login" className="btn btn-outline" style={{ color: 'white', borderColor: 'white', padding: '12px 24px', fontSize: '1.1rem' }}>Log In</Link>
        </div>
      </div>

      {/* 2. CAMPUS IMPACT METRICS */}
      {/* THE FIX: Replaced negative margin with standard margin to prevent overlap on mobile */}
      <div 
        ref={metricsRef}
        className={`fade-in-section delay-100 ${metricsVisible ? 'is-visible' : ''}`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px', position: 'relative', zIndex: 10 }}
      >
        <div className="card" style={{ textAlign: 'center', padding: '20px', margin: 0, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--primary-color)' }}>50+</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Active Clubs</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px', margin: 0, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--success)' }}>10k+</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Student Members</p>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px', margin: 0, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '2.5rem', margin: 0, color: 'var(--warning)' }}>24/7</h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Campus Events</p>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT */}
      {/* THE FIX: Increased margin-top to separate it cleanly from the metrics */}
      <div className="dashboard-grid-split" style={{ marginTop: '3rem' }}>
        
       {/* --- LEFT COLUMN: CLUBS --- */}
        <div ref={clubsRef} className={`fade-in-section delay-200 ${clubsVisible ? 'is-visible' : ''}`}>
          <h2 style={{ color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0 }}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span> Featured Campus Clubs
          </h2>
          
          {/* THE FIX: Changed from 'grid' to 'flex' so the cards stack perfectly without stretching over the button */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '1.5rem' }}>
            {clubs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading campus clubs...</p>
            ) : (
              clubs.map(club => (
                /* THE FIX: Removed height: '100%' */
                <div key={club._id} className="card card-hover" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ color: 'var(--primary-color)', marginTop: '0', fontSize: '1.25rem' }}>{club.name}</h3>
                  <p style={{ color: 'var(--text-muted)', flex: 1, fontSize: '0.95rem', margin: 0 }}>{club.description.substring(0, 100)}...</p>
                </div>
              ))
            )}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/clubs" className="btn" style={{ backgroundColor: 'var(--text-secondary)', padding: '12px 30px' }}>
              Explore the Full Directory &rarr;
            </Link>
          </div>
        </div>
        
        {/* --- RIGHT COLUMN: EVENTS & ANNOUNCEMENTS --- */}
        <div ref={eventsRef} className={`fade-in-section delay-300 ${eventsVisible ? 'is-visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card card-hover" style={{ borderTop: '4px solid var(--warning)', margin: 0 }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>📅 Upcoming Events</h3>
            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
              {events.length === 0 ? (
                <li style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>Loading events...</li>
              ) : (
                events.map((ev, i) => (
                  <li key={ev._id} style={{ padding: '12px 0', borderBottom: i < events.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <strong style={{ color: 'var(--text-main)' }}>{ev.title}</strong><br/>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {ev.date ? new Date(ev.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : 'Date TBA'}
                      {ev.location ? ` | ${ev.location}` : ''}
                    </span>
                  </li>
                ))
              )}
            </ul>
            <Link to="/events" style={{ display: 'block', textAlign: 'center', marginTop: '15px', textDecoration: 'none', color: 'var(--primary-color)', fontWeight: '600', fontSize: '0.9rem' }}>
              See all events →
            </Link>
          </div>

          <div className="card card-hover" style={{ borderTop: '4px solid var(--success)', margin: 0 }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-main)' }}>📣 Campus News</h3>
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