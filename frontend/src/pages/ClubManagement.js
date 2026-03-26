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

// --- UPDATED: Dynamic President Filter (Empty vs Populated Club) ---
  const eligibleUsers = users.filter(user => {
    // 1. Must be a student (no supervisors allowed in dropdown)
    if (user.role !== 'student') return false;

    // 2. Are they currently a President or VP in ANY OTHER club?
    const isBusyElsewhere = clubs.some(c => {
      // Skip checking the club we are currently editing (so we don't lock out our own current President/VP)
      if (editingClubId && c._id === editingClubId) return false;

      const isPres = (c.president?._id === user._id) || (c.president === user._id);
      const isVP = c.topBoard?.some(b => 
        ((b.user?._id === user._id) || (b.user === user._id)) && b.role === 'Vice President'
      );
      
      return isPres || isVP;
    });

    // If they are busy running another club, they are instantly disqualified.
    if (isBusyElsewhere) return false;

    // 3. Setup variables to determine our current scenario
    const currentClub = editingClubId ? clubs.find(c => c._id === editingClubId) : null;
    const hasMembers = currentClub?.members?.length > 0;
    
    // Always keep the currently selected president in the list so the UI doesn't glitch
    const isCurrentPresident = editingClubId && formData.presidentId === user._id;

    // 4. SCENARIO A: The club already has members
    if (hasMembers) {
      // Only allow them if they are in the members list OR they are the current president
      const isMember = currentClub.members.some(m => (m._id === user._id) || (m === user._id));
      return isMember || isCurrentPresident;
    }

    // 5. SCENARIO B: Brand new club OR existing club with 0 members
    // We already confirmed they aren't a Pres/VP elsewhere, so the whole global roster is available!
    return true;
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
          
          {/* NEW: BIG DATA GLOBAL ANALYTICS BUTTON */}
          <div className="card" style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
            <div>
              <h3 style={{ color: 'var(--primary-color)', margin: '0 0 5px 0' }}>📈 Global Financial Matrix</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View aggregated revenue and expense analytics across all university clubs.</p>
            </div>
            <button className="btn" style={{ padding: '12px 20px', fontSize: '1.05rem' }} onClick={() => navigate('/supervisor/analytics')}>
              Launch Matrix Engine &rarr;
            </button>
          </div>
          
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
                  <div key={ann._id} className="card-hover" style={{ 
                    backgroundColor: 'var(--danger-bg)', 
                    border: '1px solid var(--danger)', 
                    padding: '20px', 
                    borderRadius: 'var(--radius-md)', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    transition: 'var(--transition)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {ann.clubName}
                      </span>
                      <h4 style={{ margin: '8px 0 4px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{ann.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{ann.content}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-success" style={{ padding: '8px 15px', margin: 0 }} onClick={() => handleApproveAnnouncement(ann.clubId, ann._id)}>
                        Approve
                      </button>
                      <button className="btn btn-danger" style={{ padding: '8px 15px', margin: 0 }} onClick={() => handleRejectAnnouncement(ann.clubId, ann._id)}>
                        Reject
                      </button>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '15px', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Club Directory</h2>
          
          {/* Filtering Tabs */}
          {currentUser.role === 'student' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => fetchClubs()}>
                Explore All Clubs
              </button>
              <button className="btn btn-success" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => {
                  const myClubs = clubs.filter(club => club.members.some(m => m._id === currentUser.id));
                  setClubs(myClubs);
                }}>
                My Registered Clubs
              </button>
            </div>
          )}
        </div>

        {clubs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>No clubs found in this view.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
            {clubs.map(club => (
              <div key={club._id} className="card card-hover" style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                
                {/* Visual Badges */}
                <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', gap: '5px' }}>
                  {club.members?.some(m => m._id === currentUser.id) && (
                    <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>Member</span>
                  )}
                  {club.president?._id === currentUser.id && (
                    <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>President</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  {/* Avatar Placeholder */}
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                    {club.logoUrl ? (
                      <img src={`http://localhost:5000${club.logoUrl}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px' }} />
                    ) : (
                      <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{club.name.charAt(0)}</span>
                    )}
                  </div>
                  <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.2rem', paddingRight: '70px' }}>{club.name}</h3>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flex: 1, margin: '0 0 20px 0' }}>
                  {club.description.substring(0, 120)}...
                </p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/clubs/${club._id}`)}>
                    View Hub
                  </button>
                  
                  {/* Supervisor Controls */}
                  {currentUser.role === 'supervisor' && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn" style={{ padding: '0 12px', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }} onClick={() => handleEditClick(club)}>
                        ✏️
                      </button>
                      <button className="btn btn-danger" style={{ padding: '0 12px' }} onClick={() => handleDeleteClub(club._id)}>
                        🗑️
                      </button>
                    </div>
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