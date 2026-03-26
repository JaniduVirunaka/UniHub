import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function ClubNavigation({ club }) {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!club) return null;

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const isSupervisor = currentUser?.role === 'supervisor';
  const isPresident = club.president?._id === currentUser?.id || club.president === currentUser?.id;
  const isTopBoard = club.topBoard?.some(b => (b.user?._id || b.user) === currentUser?.id);
  const isMember = club.members?.some(m => (m._id || m) === currentUser?.id);
  
  const hasFullAccess = isSupervisor || isPresident || isTopBoard || isMember;
  
  const canViewAnalytics = isSupervisor || isPresident || club.topBoard?.some(b => 
    (b.user?._id || b.user) === currentUser?.id && ['Treasurer', 'Assistant Treasurer', 'Vice President'].includes(b.role)
  );

  const getTabStyle = (path, hash) => {
    const isActive = location.pathname === path && location.hash === hash;
    return {
      padding: '8px 16px',
      textDecoration: 'none',
      color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
      fontWeight: isActive ? 'bold' : 'normal',
      borderBottom: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
      display: 'inline-block',
      transition: 'var(--transition)'
    };
  };

  return (
    <div className="club-navigation-container" style={{
      backgroundColor: 'var(--surface-color)', 
      borderBottom: '1px solid var(--border-color)', 
      marginBottom: '25px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      alignItems: 'center',
      gap: '10px', 
      padding: '10px 15px',
      transition: 'var(--transition)',
      borderBottomLeftRadius: 'var(--radius-lg)',
      borderBottomRightRadius: 'var(--radius-lg)'
    }}>
      
      {/* Public Links */}
      <Link to={`/clubs/${club._id}`} style={getTabStyle(`/clubs/${club._id}`, '')}>🏠 Main Hub</Link>
      <Link to={`/clubs/${club._id}/about`} style={getTabStyle(`/clubs/${club._id}/about`, '')}>📖 About Us</Link>
      <Link to={`/clubs/${club._id}/achievements`} style={getTabStyle(`/clubs/${club._id}/achievements`, '')}>🏆 Trophy Room</Link>
      <Link to={`/clubs/${club._id}/sponsorships`} style={getTabStyle(`/clubs/${club._id}/sponsorships`, '')}>🤝 Sponsorships</Link>
      
      {/* Private Member/Admin Links */}
      {hasFullAccess && (
        <div 
          style={{ position: 'relative' }} 
          onMouseEnter={() => setDropdownOpen(true)} 
          onMouseLeave={() => setDropdownOpen(false)}
        >
          {/* THE FIX: Added onClick so mobile users can tap to open! */}
          <button 
            className="btn btn-outline" 
            style={{ border: 'none', padding: '8px 15px', margin: 0, boxShadow: 'none' }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            ⚙️ Member Portals ▾
          </button>
          
          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, backgroundColor: 'var(--surface-color)',
              boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', minWidth: '220px', zIndex: 1000, display: 'flex', flexDirection: 'column', overflow: 'hidden'
            }}>
              
              <Link to={`/clubs/${club._id}/elections`} style={{ padding: '12px 15px', textDecoration: 'none', color: 'var(--text-secondary)', borderBottom: 'canViewAnalytics ? 1px solid var(--border-color) : none', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-color)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                🗳️ Voting Booth
              </Link>

              <Link to={`/clubs/${club._id}/finance`} style={{ padding: '12px 15px', textDecoration: 'none', color: 'var(--text-secondary)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-color)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                🏦 Financial Hub
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClubNavigation;