import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const ClubNavigation = ({ clubId }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Helper function to style the active tab
  const getTabStyle = (path) => {
    const isActive = currentPath === path;
    return {
      padding: '12px 20px',
      textDecoration: 'none',
      color: isActive ? '#2563eb' : '#4b5563',
      fontWeight: isActive ? 'bold' : 'normal',
      borderBottom: isActive ? '3px solid #2563eb' : '3px solid transparent',
      transition: 'all 0.2s ease-in-out',
      display: 'inline-block'
    };
  };

  return (
    <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', marginBottom: '25px', display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap' }}>
      <Link to={`/clubs/${clubId}`} style={getTabStyle(`/clubs/${clubId}`)}>🏠 Main Hub</Link>
      <Link to={`/clubs/${clubId}/about`} style={getTabStyle(`/clubs/${clubId}/about`)}>📖 About Us</Link>
      <Link to={`/clubs/${clubId}/achievements`} style={getTabStyle(`/clubs/${clubId}/achievements`)}>🏆 Trophy Room</Link>
      <Link to={`/clubs/${clubId}/sponsorships`} style={getTabStyle(`/clubs/${clubId}/sponsorships`)}>🤝 Sponsorships</Link>
      <Link to={`/clubs/${clubId}/fees`} style={getTabStyle(`/clubs/${clubId}/fees`)}>💳 Member Fees</Link>
    </div>
  );
};

export default ClubNavigation;