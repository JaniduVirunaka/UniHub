import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // Save user info to local storage so the browser remembers they are logged in
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      alert(`Welcome back, ${response.data.user.name}!`);
      navigate('/clubs'); // Redirect to the Club Management page
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--primary-color)' }}>Welcome Back</h2>
      
      {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input type="email" className="form-control" placeholder="University Email" required 
                 onChange={(e) => setFormData({...formData, email: e.target.value})} />
        </div>
        <div className="form-group">
          <input type="password" className="form-control" placeholder="Password" required 
                 onChange={(e) => setFormData({...formData, password: e.target.value})} />
        </div>
        <button type="submit" className="btn" style={{ width: '100%' }}>Log In</button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem' }}>
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </p>
    </div>
  );
}

export default Login;