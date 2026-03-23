import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ClubNavigation = ({ club }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const currentHash = location.hash; // We need this to highlight the announcements tab!

  // Safety check: if club data hasn't loaded yet, don't render the nav
  if (!club) return null;

  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  // --- SMART ACCESS CONTROL ---
  // The Navigation Bar figures out if the user is a member all by itself
  let hasFullAccess = false;
  if (currentUser) {
    const isSupervisor = currentUser.role === 'supervisor';
    const isPres = club.president === currentUser.id || club.president?._id === currentUser.id;
    const isBoard = club.topBoard?.some(b => b.user === currentUser.id || b.user?._id === currentUser.id);
    const isMember = club.members?.some(m => m === currentUser.id || m._id === currentUser.id);
    hasFullAccess = isSupervisor || isPres || isBoard || isMember;
  }

  // Helper function to style the active tab (now checks hash links too!)
  const getTabStyle = (path, hash = '') => {
    const isActive = currentPath === path && currentHash === hash;
    return {
      padding: '12px 15px',
      textDecoration: 'none',
      color: isActive ? '#2563eb' : '#4b5563',
      fontWeight: isActive ? 'bold' : 'normal',
      borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
      transition: 'all 0.2s ease-in-out',
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
      alignItems: 'center', // Vertically centers everything
      gap: '10px', 
      padding: '10px 15px' 
    }}>
      

      {/* 2. PUBLIC LINKS */}
      <Link to={`/clubs/${club._id}`} style={getTabStyle(`/clubs/${club._id}`, '')}>🏠 Main Hub</Link>
      <Link to={`/clubs/${club._id}/about`} style={getTabStyle(`/clubs/${club._id}/about`, '')}>📖 About Us</Link>
      <Link to={`/clubs/${club._id}/achievements`} style={getTabStyle(`/clubs/${club._id}/achievements`, '')}>🏆 Trophy Room</Link>
      <Link to={`/clubs/${club._id}/sponsorships`} style={getTabStyle(`/clubs/${club._id}/sponsorships`, '')}>🤝 Sponsorships</Link>
      
      {/* 3. RESTRICTED LINKS (Only renders if hasFullAccess is true) */}
      {hasFullAccess && (
        <>
          <Link to={`/clubs/${club._id}/fees`} style={getTabStyle(`/clubs/${club._id}/fees`, '')}>💳 Member Fees</Link>
          
          {/* Hash link targets the #announcements ID on the Main Hub page */}
          <Link to={`/clubs/${club._id}#announcements`} style={getTabStyle(`/clubs/${club._id}`, '#announcements')}>📢 Announcements</Link>
        </>
      )}
    </div>
  );
};

export default ClubNavigation;