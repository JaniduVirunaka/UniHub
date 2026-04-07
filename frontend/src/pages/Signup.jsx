import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/signup', formData);
      alert('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during signup.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/clubs');
    } catch {
      setError('Google Authentication Failed.');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--primary-color)' }}>Join UniHub</h2>

      {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="text" className="form-control" placeholder="Full Name" required
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>
        <div className="form-group">
          <input type="email" className="form-control" placeholder="University Email" required
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="form-group">
          <input type="password" className="form-control" placeholder="Password" required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }}>Sign Up</button>
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
        Already have an account? <Link to="/login">Log in here</Link>
      </p>
    </div>
  );
}

export default Signup;
