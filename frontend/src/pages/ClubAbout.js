import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ClubNavigation from '../components/ClubNavigation';

function ClubAbout() {
  const { id } = useParams();
  const [club, setClub] = useState(null);

  // The full list of roles to display the complete grid
  const availableRoles = [
    "President", "Vice President", "Secretary", "Assistant Secretary",
    "Treasurer", "Assistant Treasurer", "Event Coordinator",
    "Public Relations", "Editor"
  ];

  useEffect(() => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  }, [id]);

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <div className="container">
      
      {/* HEADER WITH LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e5e7eb', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid #d1d5db' }}>
          {club.logoUrl ? (
            <img src={`http://localhost:5000${club.logoUrl}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '2rem' }}>🎓</span>
          )}
        </div>
        <h1 style={{ margin: 0, color: '#1f2937' }}>{club.name}</h1>
      </div>

      <ClubNavigation club={club} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
        
        {/* Mission & Rules Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', margin: 0 }}>
            <h3 style={{ color: '#166534', marginTop: 0 }}>🎯 Our Mission</h3>
            <p style={{ color: '#15803d', fontStyle: 'italic', fontSize: '1.1rem' }}>"{club.mission}"</p>
          </div>
        </div>

        {/* Executive Board Full Grid */}
        <div className="card" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <h3 style={{ color: '#1e40af', marginTop: 0, borderBottom: '2px solid #bfdbfe', paddingBottom: '10px' }}>👔 Executive Board</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginTop: '15px' }}>
            {availableRoles.map(role => {
              let personName = 'Vacant';
              if (role === 'President') {
                personName = club.president?.name || 'Vacant';
              } else {
                const boardMember = club.topBoard?.find(b => b.role === role);
                if (boardMember?.user?.name) personName = boardMember.user.name;
              }
              return (
                <div key={role} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <strong style={{ display: 'block', color: '#1e3a8a', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>{role}</strong>
                  <span style={{ color: personName === 'Vacant' ? '#9ca3af' : '#111827', fontWeight: personName === 'Vacant' ? 'normal' : 'bold', fontSize: '1.05rem' }}>
                    {personName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card" style={{ margin: 0 }}>
            <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginTop: 0 }}>⚖️ Rules & Regulations</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: '#4b5563', lineHeight: '1.6' }}>
              {club.rulesAndRegulations}
            </p>
          </div>

      </div>
    </div>
  );
}

export default ClubAbout;