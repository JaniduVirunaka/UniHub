import React, { useState } from 'react';

/**
 * A simple login form that collects username and password
 * and calls an API endpoint when submitted. You can customize
 * the `onLogin` prop or replace the fetch request with your
 * own logic.
 */
export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Example: call backend endpoint
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Login failed');
      }
      const data = await res.json();
      setLoading(false);
      if (onLogin) onLogin(data);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <div>
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #f5f5f5;
        }
        .login-form {
          background: white;
          padding: 2rem;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          width: 300px;
        }
        .login-form h2 {
          margin-top: 0;
        }
        .login-form div {
          margin-bottom: 1rem;
        }
        .login-form label {
          display: block;
          margin-bottom: 0.3rem;
        }
        .login-form input {
          width: 100%;
          padding: 0.5rem;
          box-sizing: border-box;
        }
        .error {
          color: red;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
