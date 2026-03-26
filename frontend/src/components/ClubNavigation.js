import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const ClubNavigation = ({ club }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentHash = location.hash;
  
  // State to manage the dropdown menu
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!club) return null;

  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  let hasFullAccess = false;
  if (currentUser) {
    const isSupervisor = currentUser.role === 'supervisor';
    const isPres = club.president === currentUser.id || club.president?._id === currentUser.id;
    const isBoard = club.topBoard?.some(b => b.user === currentUser.id || b.user?._id === currentUser.id);
    const isMember = club.members?.some(m => m === currentUser.id || m._id === currentUser.id);
    hasFullAccess = isSupervisor || isPres || isBoard || isMember;
  }

 const getTabStyle = (path, hash = '') => {
    const isActive = currentPath === path && currentHash === hash;
    return {
      padding: '12px 15px',
      textDecoration: 'none',
      color: isActive ? 'var(--primary-color)' : 'var(--text-muted)',
      fontWeight: isActive ? '700' : '500',
      borderBottom: isActive ? '3px solid var(--primary-color)' : '3px solid transparent',
      transition: 'all var(--transition)',
      display: 'inline-block',
      fontSize: '0.95rem'
    };
  };

  return (
    <div style={{ 
      backgroundColor: '#fff', 
      borderBottom: '1px solid #e5e7eb', 
      marginBottom: '25px', 
      display: 'flex', 
      flexWrap: 'wrap', 
      alignItems: 'center',
      gap: '10px', 
      padding: '10px 15px' 
    }}>
      
      <Link to={`/clubs/${club._id}`} style={getTabStyle(`/clubs/${club._id}`, '')}>🏠 Main Hub</Link>
      <Link to={`/clubs/${club._id}/about`} style={getTabStyle(`/clubs/${club._id}/about`, '')}>📖 About Us</Link>
      <Link to={`/clubs/${club._id}/achievements`} style={getTabStyle(`/clubs/${club._id}/achievements`, '')}>🏆 Trophy Room</Link>
      <Link to={`/clubs/${club._id}/sponsorships`} style={getTabStyle(`/clubs/${club._id}/sponsorships`, '')}>🤝 Sponsorships</Link>
      
      {hasFullAccess && (
        <>
          {/* THE NEW DROPDOWN MENU */}
          <div 
            style={{ position: 'relative' }} 
            onMouseEnter={() => setDropdownOpen(true)} 
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button style={{
              ...getTabStyle('', ''), 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer'
            }}>
              ⚙️ Member Portals ▾
            </button>
            
            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: 'var(--surface-color)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                minWidth: '180px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <Link to={`/clubs/${club._id}/fees`} style={{ padding: '12px 15px', textDecoration: 'none', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-color)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  💳 Membership Fees
                </Link>
                <Link to={`/clubs/${club._id}/elections`} style={{ padding: '12px 15px', textDecoration: 'none', color: 'var(--text-secondary)', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--bg-color)'} onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}>
                  🗳️ Voting Booth
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClubNavigation;