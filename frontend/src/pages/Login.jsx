import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import { GoogleLogin } from '@react-oauth/google';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/login', formData);
            const user = response.data.user;

            // Save user info to local storage
            localStorage.setItem('user', JSON.stringify(user));
            alert(`Welcome back, ${user.name}!`);

            // --- SMART ROUTING LOGIC ---
            if (user.role === 'president') {
                // Fetch all clubs to find which one this president owns
                const clubsRes = await api.get('/clubs');
                const myClub = clubsRes.data.find(c => c.president?._id === user.id || c.president === user.id);

                if (myClub) {
                    navigate(`/clubs/${myClub._id}`); // Send directly to their club page
                } else {
                    navigate('/clubs'); // Fallback just in case
                }
            } else {
                // Students and Supervisors go to the main directory
                navigate('/clubs');
            }

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password.');
        }
    };

    // --- NEW: GOOGLE SUCCESS HANDLER ---
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // We send the secure Google token to our new backend route
      const res = await api.post('/auth/google', {
        token: credentialResponse.credential
      });
      
      const user = res.data.user;
      localStorage.setItem('user', JSON.stringify(user));
      alert(`Welcome, ${user.name}!`);

      // SMART ROUTING
      if (user.role === 'president') {
        const clubsRes = await api.get('/clubs');
        const myClub = clubsRes.data.find(c => c.president?._id === user.id || c.president === user.id);
        if (myClub) navigate(`/clubs/${myClub._id}`);
        else navigate('/clubs');
      } else {
        navigate('/clubs');
      }
    } catch (err) {
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

        {/* --- NEW: THE GOOGLE BUTTON --- */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <hr style={{ flex: 1, borderColor: 'var(--border-color)', margin: 0 }} />
            <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>OR</span>
            <hr style={{ flex: 1, borderColor: 'var(--border-color)', margin: 0 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin 
              onSuccess={handleGoogleSuccess} 
              onError={() => setError('Google Login Failed')} 
              theme="outline"
              size="large"
            />
        </div>
        {/* ----------------------------- */}
        
        <p style={{ textAlign: 'center', marginTop: '1rem' }}>
            Don't have an account? <Link to="/signup">Sign up here</Link>
        </p>
    </div>
);
}

export default Login;