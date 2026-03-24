import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', logoFile: null });
  const [editingClubId, setEditingClubId] = useState(null);
  const [announcementData, setAnnouncementData] = useState({ title: '', content: '' });
  const [showCreateForm, setShowCreateForm] = useState(false);
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

// Handle Creating a Club (Upgraded for File Upload)
  const handleCreateClub = (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('supervisorId', currentUser.id);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('mission', formData.mission);
    data.append('rulesAndRegulations', formData.rulesAndRegulations);
    if (formData.presidentId) data.append('presidentId', formData.presidentId);
    if (formData.logoFile) data.append('logo', formData.logoFile); // Appends the file!

    axios.post('http://localhost:5000/api/clubs', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        fetchClubs();
        setFormData({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', logoFile: null });
        setShowCreateForm(false);
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
      rulesAndRegulations: club.rulesAndRegulations || '', // Pulls existing rules
      presidentId: club.president?._id || '',
      logoFile: null
    });
    window.scrollTo(0, 0); 
  };

  // Submits the updated data (Upgraded for File Upload)
  const handleUpdateClub = (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('supervisorId', currentUser.id);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('mission', formData.mission);
    data.append('rulesAndRegulations', formData.rulesAndRegulations);
    data.append('presidentId', formData.presidentId);
    if (formData.logoFile) data.append('logo', formData.logoFile);

    axios.put(`http://localhost:5000/api/clubs/${editingClubId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        fetchClubs();
        setEditingClubId(null);
        setFormData({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', logoFile: null });
        setShowCreateForm(false);
        alert("Club updated successfully!");
      })
      .catch(err => alert(err.response?.data?.message || "Error updating club."));
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

  // Submits a new announcement for the President's club
const handlePostAnnouncement = (e, clubId) => {
  e.preventDefault();
  axios.post(`http://localhost:5000/api/clubs/${clubId}/announcements`, { ...announcementData, presidentId: currentUser.id })
    .then(res => {
      alert(res.data.message);
      setAnnouncementData({ title: '', content: '' }); // Clear the form
      fetchClubs(); // Refresh to see the new announcement
    })
    .catch(err => alert(err.response?.data?.message || "Error posting announcement."));
};

// --- SUPERVISOR ANNOUNCEMENT ACTIONS ---
const handleApproveAnnouncement = (clubId, annId) => {
  axios.put(`http://localhost:5000/api/clubs/${clubId}/announcements/${annId}/approve`, { supervisorId: currentUser.id })
    .then(res => {
      fetchClubs(); // Refresh to remove from pending list
    })
    .catch(err => alert("Error approving announcement."));
};

const handleRejectAnnouncement = (clubId, annId) => {
  if(window.confirm("Reject and delete this announcement?")) {
    axios.delete(`http://localhost:5000/api/clubs/${clubId}/announcements/${annId}`, { data: { supervisorId: currentUser.id } })
      .then(res => {
        fetchClubs();
      })
      .catch(err => alert("Error rejecting announcement."));
  }
};

// Extract all pending announcements across all clubs into a single array
const pendingAnnouncements = clubs.flatMap(club => 
  (club.announcements || [])
    .filter(ann => !ann.isApproved)
    .map(ann => ({ ...ann, clubName: club.name, clubId: club._id }))
);

  return (
    <div>
      {/* SUPERVISOR DASHBOARD */}
      {currentUser.role === 'supervisor' && (
        <div style={{ marginBottom: '30px' }}>
          
          {/* 1. TOP PRIORITY: PENDING ACTION CENTER */}
          <div className="card" style={{ borderLeft: pendingAnnouncements.length > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
            <h2 style={{ marginTop: 0, color: pendingAnnouncements.length > 0 ? '#b91c1c' : '#047857' }}>
              Action Center: Pending Approvals
            </h2>
            
            {pendingAnnouncements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>✅ All caught up! No pending announcements.</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {pendingAnnouncements.map((ann) => (
                  <div key={ann._id} style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#dc2626', textTransform: 'uppercase' }}>{ann.clubName}</span>
                      <h4 style={{ margin: '5px 0' }}>{ann.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#4b5563' }}>{ann.content}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn" style={{ backgroundColor: '#10b981', padding: '8px 15px' }} onClick={() => handleApproveAnnouncement(ann.clubId, ann._id)}>Approve</button>
                      <button className="btn" style={{ backgroundColor: '#ef4444', padding: '8px 15px' }} onClick={() => handleRejectAnnouncement(ann.clubId, ann._id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. SECONDARY OPS: CLUB MANAGEMENT TOGGLE */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button 
              className="btn" 
              style={{ backgroundColor: showCreateForm || editingClubId ? '#6b7280' : 'var(--primary-color)' }}
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                if (editingClubId) {
                  setEditingClubId(null);
                  setFormData({ name: '', description: '', mission: '', presidentId: '' });
                }
              }}
            >
              {showCreateForm || editingClubId ? 'Close Form' : '+ Register New Club'}
            </button>
          </div>

          {/* HIDDEN FORM (Only shows if toggle is clicked OR if editing a club) */}
          {(showCreateForm || editingClubId) && (
            <div className="card" style={{ borderTop: editingClubId ? '4px solid #f59e0b' : '4px solid var(--primary-color)' }}>
              <h2 style={{ marginTop: 0 }}>{editingClubId ? 'Edit Club Details' : 'Register a New Club'}</h2>
              <form onSubmit={editingClubId ? handleUpdateClub : handleCreateClub}>
                <div className="form-group">
                  <input type="text" className="form-control" placeholder="Club Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <textarea className="form-control" placeholder="Club Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                </div>
                <div className="form-group">
                  <textarea className="form-control" placeholder="Mission Statement" value={formData.mission} onChange={(e) => setFormData({...formData, mission: e.target.value})} required />
                </div>
                <div className="form-group">
                  <textarea className="form-control" placeholder="Rules & Regulations (e.g., Attendance policies, code of conduct...)" value={formData.rulesAndRegulations} onChange={(e) => setFormData({...formData, rulesAndRegulations: e.target.value})} rows="4" required />
                </div>
                
                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Club Logo (Optional)</label>
                  <input type="file" className="form-control" accept="image/*" onChange={(e) => setFormData({...formData, logoFile: e.target.files[0]})} />
                  <small style={{ color: 'var(--text-muted)' }}>Upload a transparent PNG or square JPG for best results.</small>
                </div>
                
                <div className="form-group">
                  <select className="form-control" value={formData.presidentId} onChange={(e) => setFormData({...formData, presidentId: e.target.value})}>
                    <option value="">-- No President Assigned --</option>
                    {eligibleUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                  <small style={{ color: 'var(--text-muted)' }}>Only available students are shown.</small>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn" style={{ backgroundColor: editingClubId ? '#f59e0b' : 'var(--primary-color)' }}>
                    {editingClubId ? 'Save Changes' : 'Register Club'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

    {/* DIRECTORY SECTION WITH TABS */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>Club Directory</h2>
          
          {/* Filtering Tabs */}
          {currentUser.role === 'student' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn" 
                style={{ backgroundColor: 'var(--primary-color)' }}
                onClick={() => fetchClubs()} // Grabs all clubs
              >
                Explore All Clubs
              </button>
              <button 
                className="btn" 
                style={{ backgroundColor: '#10b981' }} // Green color for 'My Clubs'
                onClick={() => {
                  // Filter local state to only show clubs where they are a member
                  const myClubs = clubs.filter(club => club.members.some(m => m._id === currentUser.id));
                  setClubs(myClubs);
                }}
              >
                My Registered Clubs
              </button>
            </div>
          )}
        </div>

        {clubs.length === 0 ? (
          <p>No clubs found in this view.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {clubs.map(club => (
              <div key={club._id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.5rem', backgroundColor: 'var(--surface-color)', position: 'relative' }}>
                <h3 style={{ color: 'var(--primary-color)', marginTop: '0' }}>{club.name}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{club.description.substring(0, 100)}...</p>
                
                {/* Visual indicator if they are already a member */}
                {club.members?.some(m => m._id === currentUser.id) && (
                   <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#d1fae5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                     Member
                   </span>
                )}
                {club.president?._id === currentUser.id && (
                   <span style={{ position: 'absolute', top: '10px', right: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                     President
                   </span>
                )}

                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button className="btn" style={{ flex: 1 }} onClick={() => navigate(`/clubs/${club._id}`)}>
                    View Club Hub
                  </button>
                  
                  {/* Supervisor Edit/Delete controls remain here on the dashboard */}
                  {currentUser.role === 'supervisor' && (
                    <>
                      <button onClick={() => handleEditClick(club)} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '4px' }}>Edit</button>
                      <button onClick={() => handleDeleteClub(club._id)} style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px' }}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ClubManagement;