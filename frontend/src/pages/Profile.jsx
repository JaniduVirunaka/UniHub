import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      
      {/* Left Sidebar: User Info */}
      <div className="card" style={{ flex: '1 1 30%', textAlign: 'center' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 15px auto' }}>
          {currentUser.name.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ margin: '10px 0 5px 0' }}>{currentUser.name}</h2>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{currentUser.email}</p>
        <span style={{ display: 'inline-block', marginTop: '10px', padding: '4px 12px', backgroundColor: '#e5e7eb', borderRadius: '15px', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
          Role: {currentUser.role}
        </span>
        
        <div style={{ marginTop: '20px' }}>
          <button className="btn" style={{ backgroundColor: '#ef4444', width: '100%' }} onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {/* Right Content Area: Activity & Settings */}
      <div className="card" style={{ flex: '1 1 70%' }}>
        <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
          My Activity Dashboard
        </h3>
        
        {/* TODO: [Teammate Name] - Build out these sections */}
        <div style={{ padding: '20px', backgroundColor: '#f0fdf4', border: '1px dashed #86efac', borderRadius: '8px', marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#166534' }}>🎟️ My Upcoming Events</h4>
          <p style={{ fontSize: '0.9rem', color: '#15803d', margin: 0 }}>Feature pending...</p>
        </div>

        <div style={{ padding: '20px', backgroundColor: '#eff6ff', border: '1px dashed #93c5fd', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1e3a8a' }}>⚙️ Account Settings</h4>
          <p style={{ fontSize: '0.9rem', color: '#1d4ed8', margin: 0 }}>Feature pending...</p>
        </div>
      </div>

    </div>
  );
}

export default Profile;