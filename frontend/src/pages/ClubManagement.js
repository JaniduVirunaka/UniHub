import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', mission: '' });
  const [editingClubId, setEditingClubId] = useState(null);
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

  // Triggers when Supervisor clicks "Edit" on a club card
  const handleEditClick = (club) => {
    setEditingClubId(club._id);
    setFormData({
      name: club.name,
      description: club.description,
      mission: club.mission,
      presidentId: club.president?._id || ''
    });
    window.scrollTo(0, 0); // Scroll to top to see the form
  };

  // Submits the updated data
  const handleUpdateClub = (e) => {
    e.preventDefault();
    axios.put(`http://localhost:5000/api/clubs/${editingClubId}`, { ...formData, supervisorId: currentUser.id })
      .then(() => {
        fetchClubs();
        setEditingClubId(null);
        setFormData({ name: '', description: '', mission: '', presidentId: '' });
        alert("Club updated successfully!");
      })
      .catch(err => alert(err.response?.data?.message || "Error updating club."));
  };

  // Deletes the club
  const handleDeleteClub = (clubId) => {
    if (window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) {
      // Note: axios.delete requires data to be passed in a specific 'data' object
      axios.delete(`http://localhost:5000/api/clubs/${clubId}`, { data: { supervisorId: currentUser.id } })
        .then(() => {
          fetchClubs();
          alert("Club deleted.");
        })
        .catch(err => alert("Error deleting club."));
    }
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

  // --- NEW: Filter eligible presidents ---
  // We only want normal 'students' to appear in the dropdown.
  // BUT, if we are editing a club, we must also include the CURRENT president of this club in the list.
  const eligibleUsers = users.filter(user => {
    // Exclude supervisors entirely from the list
    if (user.role === 'supervisor') return false;
    
    // If we are editing, and this user is the current president of the club in the form, keep them!
    if (editingClubId && formData.presidentId === user._id) return true;
    
    // Otherwise, only include users who are currently normal students
    return user.role === 'student';
  });

  return (
    <div>
      {/* ONLY show the Form if the user is a supervisor */}
      {currentUser.role === 'supervisor' && (
        <div className="card" style={{ borderTop: editingClubId ? '4px solid #f59e0b' : '4px solid var(--primary-color)' }}>
          <h2>{editingClubId ? 'Supervisor Dashboard: Edit Club' : 'Supervisor Dashboard: Register a New Club'}</h2>

          <form onSubmit={editingClubId ? handleUpdateClub : handleCreateClub}>
            <div className="form-group">
              <input type="text" className="form-control" placeholder="Club Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <textarea className="form-control" placeholder="Club Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <textarea className="form-control" placeholder="Mission Statement" value={formData.mission} onChange={(e) => setFormData({ ...formData, mission: e.target.value })} required />
            </div>

            {/* Dropdown to assign a president - NO LONGER REQUIRED */}
            <div className="form-group">
              <select className="form-control" value={formData.presidentId} onChange={(e) => setFormData({ ...formData, presidentId: e.target.value })}>
                <option value="">-- No President Assigned --</option>
                {eligibleUsers.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.email}) - Current Role: {user.role}
                  </option>
                ))}
              </select>
              <small style={{ color: 'var(--text-muted)' }}>You can assign a president later.</small>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn" style={{ backgroundColor: editingClubId ? '#f59e0b' : 'var(--primary-color)' }}>
                {editingClubId ? 'Save Changes' : 'Register Club'}
              </button>

              {/* Show a Cancel button if we are in edit mode */}
              {editingClubId && (
                <button type="button" className="btn" style={{ backgroundColor: '#6b7280' }} onClick={() => {
                  setEditingClubId(null);
                  setFormData({ name: '', description: '', mission: '', presidentId: '' });
                }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Registered Clubs Directory</h2>
        <ul className="club-list">
          {clubs.map(club => (
            <li key={club._id} className="club-item">
              <h4>{club.name}</h4>
              {/* Supervisor Operational Controls */}
              {currentUser.role === 'supervisor' && (
                <div style={{ float: 'right', display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEditClick(club)} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px' }}>Edit</button>
                  <button onClick={() => handleDeleteClub(club._id)} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px' }}>Delete</button>
                </div>
              )}
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