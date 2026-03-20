import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', mission: '' });

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
        setFormData({ name: '', description: '', mission: '' }); 
      })
      .catch(err => console.log(err));
  };

  return (
    <div>
      <div className="card">
        <h2>Create a New Club Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input type="text" className="form-control" placeholder="Club Name (e.g., Coding Club)" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <textarea className="form-control" placeholder="Club Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
          </div>
          <div className="form-group">
            <textarea className="form-control" placeholder="Mission Statement" value={formData.mission} onChange={(e) => setFormData({...formData, mission: e.target.value})} required />
          </div>
          <button type="submit" className="btn">Create Club</button>
        </form>
      </div>

      <div className="card">
        <h2>Registered Clubs Directory</h2>
        {clubs.length === 0 ? (
          <p>No clubs registered yet.</p>
        ) : (
          <ul className="club-list">
            {clubs.map(club => (
              <li key={club._id} className="club-item">
                <h4>{club.name}</h4>
                <p><strong>Description:</strong> {club.description}</p>
                <p><strong>Mission:</strong> {club.mission}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ClubManagement;