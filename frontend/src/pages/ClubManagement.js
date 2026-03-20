import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', mission: '' });
  const navigate = useNavigate();

  // 1. Get the current logged-in user from local storage
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClubs();
    // Fetch users so the supervisor can populate the dropdown
    if (currentUser && currentUser.role === 'supervisor') {
      axios.get('http://localhost:5000/api/auth/users')
        .then(res => setUsers(res.data))
        .catch(err => console.log("Error fetching users:", err));
    }
  }, []);

  const fetchClubs = () => {
    axios.get('http://localhost:5000/api/clubs')
      .then(res => setClubs(res.data))
      .catch(err => console.log(err));
  };

  // Prevent accessing page if not logged in at all
  if (!currentUser) {
    return (
      <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>Access Denied</h2>
        <p>You must be logged in to view the Club Directory.</p>
        <button className="btn" onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  // Handle Creating a Club
  const handleCreateClub = (e) => {
    e.preventDefault();
  // Send the form data, plus the supervisor's ID
    axios.post('http://localhost:5000/api/clubs', { ...formData, supervisorId: currentUser.id })
      .then(() => {
        fetchClubs(); 
        setFormData({ name: '', description: '', mission: '', presidentId: '' }); 
        alert("Club created successfully!");
      })
    .catch(err => alert(err.response?.data?.message || "Error creating club."));
  };

  // Handle Requesting to Join
  const handleJoinRequest = (clubId) => {
    axios.post(`http://localhost:5000/api/clubs/${clubId}/request-join`, { userId: currentUser.id })
      .then(res => alert(res.data.message))
      .catch(err => alert(err.response?.data?.message || "Error requesting to join."));
  };

  // Handle Approving a Member
  const handleApprove = (clubId, studentId) => {
    axios.post(`http://localhost:5000/api/clubs/${clubId}/approve`, { studentId, presidentId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        fetchClubs(); // Refresh the list to remove them from pending
      })
      .catch(err => alert("Error approving member."));
  };

  return (
    <div>
    {/* ONLY show the Create Form if the user is a supervisor */}
    {currentUser.role === 'supervisor' && (
      <div className="card">
        <h2>Supervisor Dashboard: Register a New Club</h2>
        <form onSubmit={handleCreateClub}>
          <div className="form-group">
            <input type="text" className="form-control" placeholder="Club Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <textarea className="form-control" placeholder="Club Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
          </div>
          <div className="form-group">
            <textarea className="form-control" placeholder="Mission Statement" value={formData.mission} onChange={(e) => setFormData({...formData, mission: e.target.value})} required />
          </div>

          {/* NEW: Dropdown to assign a president */}
          <div className="form-group">
            <select className="form-control" value={formData.presidentId} onChange={(e) => setFormData({...formData, presidentId: e.target.value})} required>
              <option value="">-- Assign a Club President --</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email}) - Current Role: {user.role}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn">Register Club & Assign President</button>
        </form>
      </div>
    )}

      <div className="card">
        <h2>Registered Clubs Directory</h2>
        <ul className="club-list">
          {clubs.map(club => (
            <li key={club._id} className="club-item">
              <h4>{club.name}</h4>
              <p><strong>Description:</strong> {club.description}</p>
              <p><strong>Mission:</strong> {club.mission}</p>
              <p><small>President: {club.president?.name || 'Unknown'}</small></p>
              
              {/* If user is a student, show Join button */}
              {currentUser.role === 'student' && (
                <button className="btn" style={{ marginTop: '10px' }} onClick={() => handleJoinRequest(club._id)}>
                  Request to Join
                </button>
              )}

              {/* If user is the president of THIS specific club, show the pending requests */}
              {club.president?._id === currentUser.id && club.pendingMembers?.length > 0 && (
                <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fef3c7', borderRadius: '5px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#d97706' }}>Pending Join Requests</h5>
                  {club.pendingMembers.map(student => (
                    <div key={student._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <span>{student.name} ({student.email})</span>
                      <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#059669' }} onClick={() => handleApprove(club._id, student._id)}>
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ClubManagement;