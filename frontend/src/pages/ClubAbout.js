import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ClubNavigation from '../components/ClubNavigation';

function ClubAbout() {
  const { id } = useParams();
  const [club, setClub] = useState(null);

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

      {/* THE NEW NAVIGATION BAR */}
      <ClubNavigation clubId={id} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: Mission & Rules */}
        <div>
          <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
            <h3 style={{ color: '#166534', marginTop: 0 }}>🎯 Our Mission</h3>
            <p style={{ color: '#15803d', fontStyle: 'italic', fontSize: '1.1rem' }}>"{club.mission}"</p>
          </div>

          <div className="card">
            <h3 style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>⚖️ Rules & Regulations</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: '#4b5563', lineHeight: '1.6' }}>
              {club.rulesAndRegulations}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Executive Board */}
        <div>
          <div className="card" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <h3 style={{ color: '#1e40af', marginTop: 0, borderBottom: '2px solid #bfdbfe', paddingBottom: '10px' }}>👔 Executive Board</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <strong style={{ color: '#1e3a8a' }}>President</strong>
              <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>{club.president ? club.president.name : "Vacant"}</div>
            </div>

            {club.topBoard?.map((boardMember, index) => (
              <div key={index} style={{ marginBottom: '15px' }}>
                <strong style={{ color: '#1e3a8a' }}>{boardMember.role}</strong>
                <div style={{ color: '#4b5563' }}>{boardMember.user?.name || "Unknown"}</div>
              </div>
            ))}
            
            {club.topBoard?.length === 0 && !club.president && (
              <p style={{ color: '#6b7280', fontSize: '0.9rem', fontStyle: 'italic' }}>No board members assigned yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default ClubAbout;