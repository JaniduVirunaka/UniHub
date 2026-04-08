import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

const getDefaultPath = (role) => {
  switch (role) {
    case 'president':    return null; // handled separately (needs club lookup)
    case 'supervisor':   return '/clubs';
    case 'sport_admin':  return '/admin';
    case 'captain':      return '/captain';
    case 'vice_captain': return '/vice-captain';
    case 'admin':        return '/events/admin'; // event organiser
    default:             return '/clubs'; // student
  }
};

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const routeAfterLogin = async (user) => {
    if (user.role === 'president') {
      try {
        const clubsRes = await api.get('/clubs');
        const myClub = clubsRes.data.find(c => c.president?._id === user.id || c.president === user.id);
        navigate(myClub ? `/clubs/${myClub._id}` : '/clubs');
      } catch {
        navigate('/clubs');
      }
    } else {
      navigate(getDefaultPath(user.role));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { user } = await login(formData.email, formData.password);
      await routeAfterLogin(user);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { user } = await loginWithGoogle(credentialResponse.credential);
      await routeAfterLogin(user);
    } catch {
      setError('Google Authentication Failed.');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--primary-color)' }}>Welcome Back</h2>

      {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="email" className="form-control" placeholder="University Email" required
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="form-group">
          <input type="password" className="form-control" placeholder="Password" required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }}>Log In</button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
        <hr style={{ flex: 1, borderColor: 'var(--border-color)', margin: 0 }} />
        <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>OR</span>
        <hr style={{ flex: 1, borderColor: 'var(--border-color)', margin: 0 }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Login Failed')} theme="outline" size="large" />
      </div>

      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
}

export default Login;
