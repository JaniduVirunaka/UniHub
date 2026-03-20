import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', mission: '' });

  // Fetch clubs when the page loads
  useEffect(() => {
    axios.get('http://localhost:5000/api/clubs')
      .then(res => setClubs(res.data))
      .catch(err => console.log(err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5000/api/clubs', formData)
      .then(res => {
        setClubs([...clubs, res.data]);
        setFormData({ name: '', description: '', mission: '' }); // Clear form
      })
      .catch(err => console.log(err));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Club Management - Profiling</h2>
      
      {/* Form to create a club */}
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <input type="text" placeholder="Club Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required style={{ display: 'block', margin: '10px 0' }} />
        <textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required style={{ display: 'block', margin: '10px 0', width: '300px', height: '100px' }} />
        <textarea placeholder="Mission Statement" value={formData.mission} onChange={(e) => setFormData({...formData, mission: e.target.value})} required style={{ display: 'block', margin: '10px 0', width: '300px', height: '100px' }} />
        <button type="submit">Create Club</button>
      </form>

      {/* List to view clubs */}
      <h3>Registered Clubs</h3>
      <ul>
        {clubs.map(club => (
          <li key={club._id}>
            <strong>{club.name}</strong>: {club.description} (Mission: {club.mission})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ClubManagement;