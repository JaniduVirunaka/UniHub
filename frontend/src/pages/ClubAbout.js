import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ClubNavigation from '../components/ClubNavigation';

function ClubAbout() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  
  // List of all available roles in the club for display purposes. This ensures we show all possible positions, even if currently vacant.
  const availableRoles = [
    "President", "Vice President", "Secretary", "Assistant Secretary",
    "Treasurer", "Assistant Treasurer", "Event Coordinator",
    "Public Relations", "Editor"
  ];

  // Fetch the club's profile data as soon as the page loads
  useEffect(() => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  }, [id]);

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

 return (
    <div className="container">
      
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
          {club.logoUrl ? (
            <img src={`http://localhost:5000${club.logoUrl}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '2rem' }}>🎓</span>
          )}
        </div>
        <h1 style={{ margin: 0, color: 'var(--text-main)', fontSize: '2.5rem', letterSpacing: '-0.5px' }}>{club.name}</h1>
      </div>

      <ClubNavigation club={club} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Mission Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)', margin: 0 }}>
            <h3 style={{ color: 'var(--success)', marginTop: 0 }}>🎯 Our Mission</h3>
            <p style={{ color: 'var(--text-main)', fontStyle: 'italic', fontSize: '1.15rem', lineHeight: '1.6' }}>"{club.mission}"</p>
          </div>
        </div>

        {/* Executive Board Full Grid */}
        <div className="card" style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginTop: 0, borderBottom: '2px solid rgba(79, 70, 229, 0.2)', paddingBottom: '10px' }}>👔 Executive Board</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '20px' }}>
            {availableRoles.map(role => { //loop through roles and get names
              let personName = 'Vacant';
              if (role === 'President') {
                personName = club.president?.name || 'Vacant';
              } else {
                const boardMember = club.topBoard?.find(b => b.role === role);
                if (boardMember?.user?.name) personName = boardMember.user.name;
              }
              return (
                <div key={role} className="card-hover" style={{ backgroundColor: 'var(--surface-color)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                  <strong style={{ display: 'block', color: 'var(--primary-color)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>{role}</strong>
                  <span style={{ color: personName === 'Vacant' ? 'var(--text-muted)' : 'var(--text-main)', fontWeight: personName === 'Vacant' ? '500' : '700', fontSize: '1.05rem' }}>
                    {personName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rules & Regulations */}
        <div className="card" style={{ margin: 0 }}>
            <h3 style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginTop: 0, color: 'var(--text-main)' }}>⚖️ Rules & Regulations</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '1.05rem' }}>
              {club.rulesAndRegulations}
            </p>
          </div>
      </div>
    </div>
  );
}

export default ClubAbout;