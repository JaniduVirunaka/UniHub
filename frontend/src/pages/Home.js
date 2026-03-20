import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Welcome to UniHub</h1>
      <p>Your Centralized University Event & Club Management System</p>
      <Link to="/clubs">
        <button style={{ padding: '10px 20px', fontSize: '16px' }}>Go to Club Management</button>
      </Link>
    </div>
  );
}

export default Home;