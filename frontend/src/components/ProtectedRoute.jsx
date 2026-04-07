import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DEFAULTS = {
  supervisor: '/clubs',
  president: '/clubs',
  student: '/clubs',
  sport_admin: '/admin',
  captain: '/captain',
  vice_captain: '/vice-captain',
};

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DEFAULTS[user.role] || '/'} replace />;
  }

  return children;
}

export default ProtectedRoute;
