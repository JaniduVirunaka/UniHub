import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function ClubManagement() {
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', membershipFee: '', logoFile: null });
  const [editingClubId, setEditingClubId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- NEW: SEARCH & SORT STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [viewFilter, setViewFilter] = useState('all'); // 'all' or 'my-clubs'

  useEffect(() => {
    fetchClubs();
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

  if (!currentUser) {
    return (
      <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
        <h2>Access Denied</h2>
        <p>You must be logged in to view the Club Directory.</p>
        <button className="btn" onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  // --- SUPERVISOR FORMS & LOGIC (Unchanged) ---
  const handleCreateClub = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('supervisorId', currentUser.id);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('mission', formData.mission);
    data.append('rulesAndRegulations', formData.rulesAndRegulations);
    data.append('membershipFee', formData.membershipFee);
    if (formData.presidentId) data.append('presidentId', formData.presidentId);
    if (formData.logoFile) data.append('logo', formData.logoFile); 

    axios.post('http://localhost:5000/api/clubs', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        fetchClubs();
        setFormData({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', logoFile: null });
        setShowCreateForm(false);
        alert("Club created successfully!");
      })
      .catch(err => alert(err.response?.data?.message || "Error creating club."));
  };

  const handleEditClick = (club) => {
    setEditingClubId(club._id);
    setFormData({
      name: club.name, description: club.description, mission: club.mission,
      rulesAndRegulations: club.rulesAndRegulations || '', membershipFee: club.membershipFee || 0, presidentId: club.president?._id || '', logoFile: null
    });
    window.scrollTo(0, 0); 
  };

  const handleUpdateClub = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('supervisorId', currentUser.id);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('mission', formData.mission);
    data.append('rulesAndRegulations', formData.rulesAndRegulations);
    data.append('membershipFee', formData.membershipFee);
    data.append('presidentId', formData.presidentId);
    if (formData.logoFile) data.append('logo', formData.logoFile);

    axios.put(`http://localhost:5000/api/clubs/${editingClubId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        fetchClubs(); setEditingClubId(null); setFormData({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', membershipFee: '', logoFile: null }); setShowCreateForm(false); alert("Club updated successfully!");
      })
      .catch(err => alert(err.response?.data?.message || "Error updating club."));
  };

  const eligibleUsers = users.filter(user => {
    if (user.role !== 'student') return false;
    const isBusyElsewhere = clubs.some(c => {
      if (editingClubId && c._id === editingClubId) return false;
      const isPres = (c.president?._id === user._id) || (c.president === user._id);
      const isVP = c.topBoard?.some(b => ((b.user?._id === user._id) || (b.user === user._id)) && b.role === 'Vice President');
      return isPres || isVP;
    });

    if (isBusyElsewhere) return false;

    const currentClub = editingClubId ? clubs.find(c => c._id === editingClubId) : null;
    const hasMembers = currentClub?.members?.length > 0;
    const isCurrentPresident = editingClubId && formData.presidentId === user._id;

    if (hasMembers) {
      const isMember = currentClub.members.some(m => (m._id === user._id) || (m === user._id));
      return isMember || isCurrentPresident;
    }
    return true;
  });

  const handleDeleteClub = (clubId) => {
    if (window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) {
      axios.delete(`http://localhost:5000/api/clubs/${clubId}`, { data: { supervisorId: currentUser.id } })
        .then(() => { fetchClubs(); alert("Club deleted."); })
        .catch(err => alert("Error deleting club."));
    }
  };

  const handleApproveAnnouncement = (clubId, annId) => {
    axios.put(`http://localhost:5000/api/clubs/${clubId}/announcements/${annId}/approve`, { supervisorId: currentUser.id })
      .then(res => { fetchClubs(); }).catch(err => alert("Error approving announcement."));
  };

  const handleRejectAnnouncement = (clubId, annId) => {
    if(window.confirm("Reject and delete this announcement?")) {
      axios.delete(`http://localhost:5000/api/clubs/${clubId}/announcements/${annId}`, { data: { supervisorId: currentUser.id } })
        .then(res => { fetchClubs(); }).catch(err => alert("Error rejecting announcement."));
    }
  };

  const pendingAnnouncements = clubs.flatMap(club => 
    (club.announcements || []).filter(ann => !ann.isApproved).map(ann => ({ ...ann, clubName: club.name, clubId: club._id }))
  );


  // --- NEW: THE LIVE SEARCH & SORT ENGINE ---
  
  // 1. First, we filter based on the Tabs (All vs My Clubs) and the Search Bar
  const filteredClubs = clubs.filter(club => {
    // Tab Filter
    if (viewFilter === 'my-clubs') {
      const isMember = club.members.some(m => m._id === currentUser.id);
      const isPresident = club.president?._id === currentUser.id;
      if (!isMember && !isPresident) return false;
    }

    // Search Bar Filter (Checks if typed text is in the name or description)
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const matchName = club.name.toLowerCase().includes(lowerCaseSearch);
      const matchDesc = club.description.toLowerCase().includes(lowerCaseSearch);
      if (!matchName && !matchDesc) return false;
    }

    return true;
  });

  // 2. Second, we sort the filtered array based on the Dropdown selection
  const filteredAndSortedClubs = filteredClubs.sort((a, b) => {
    if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
    if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
    if (sortOption === 'members-desc') return (b.members?.length || 0) - (a.members?.length || 0);
    if (sortOption === 'fee-desc') return (b.membershipFee || 0) - (a.membershipFee || 0);
    if (sortOption === 'fee-asc') return (a.membershipFee || 0) - (b.membershipFee || 0);
    return 0;
  });


  return (
    <div>
      {/* SUPERVISOR DASHBOARD */}
      {currentUser.role === 'supervisor' && (
        <div style={{ marginBottom: '30px' }}>
          
          <div className="card flex-mobile-stack" style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
            <div>
              <h3 style={{ color: 'var(--primary-color)', margin: '0 0 5px 0' }}>📈 Global Financial Matrix</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View aggregated revenue and expense analytics across all university clubs.</p>
            </div>
            <button className="btn" style={{ padding: '12px 20px', fontSize: '1.05rem', whiteSpace: 'nowrap' }} onClick={() => navigate('/supervisor/analytics')}>
              Launch Matrix Engine &rarr;
            </button>
          </div>
          
          {/* PENDING ACTION CENTER */}
          <div className="card" style={{ borderLeft: pendingAnnouncements.length > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
            <h2 style={{ marginTop: 0, color: pendingAnnouncements.length > 0 ? '#b91c1c' : '#047857' }}>
              Action Center: Pending Approvals
            </h2>
            
          {pendingAnnouncements.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>✅ All caught up! No pending announcements.</p>
            ) : (
              <div style={{ display: 'grid', gap: '15px' }}>
                {pendingAnnouncements.map((ann) => (
                  <div key={ann._id} className="card-hover flex-mobile-stack" style={{ 
                    backgroundColor: 'var(--danger-bg)', border: '1px solid var(--danger)', padding: '20px', borderRadius: 'var(--radius-md)', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'var(--transition)'
                  }}>
                    <div style={{ width: '100%' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{ann.clubName}</span>
                      <h4 style={{ margin: '8px 0 4px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{ann.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{ann.content}</p>
                    </div>
                    <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn btn-success" style={{ padding: '8px 15px', margin: 0 }} onClick={() => handleApproveAnnouncement(ann.clubId, ann._id)}>Approve</button>
                      <button className="btn btn-danger" style={{ padding: '8px 15px', margin: 0 }} onClick={() => handleRejectAnnouncement(ann.clubId, ann._id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button 
              className="btn" 
              style={{ backgroundColor: showCreateForm || editingClubId ? '#6b7280' : 'var(--primary-color)' }}
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                if (editingClubId) { setEditingClubId(null); setFormData({ name: '', description: '', mission: '', presidentId: '' }); }
              }}
            >
              {showCreateForm || editingClubId ? 'Close Form' : '+ Register New Club'}
            </button>
          </div>

          {/* HIDDEN FORM */}
          {(showCreateForm || editingClubId) && (
            <div className="card" style={{ borderTop: editingClubId ? '4px solid #f59e0b' : '4px solid var(--primary-color)' }}>
              <h2 style={{ marginTop: 0 }}>{editingClubId ? 'Edit Club Details' : 'Register a New Club'}</h2>
              <form onSubmit={editingClubId ? handleUpdateClub : handleCreateClub}>
                <div className="form-group"><input type="text" className="form-control" placeholder="Club Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><textarea className="form-control" placeholder="Club Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required /></div>
                <div className="form-group"><textarea className="form-control" placeholder="Mission Statement" value={formData.mission} onChange={(e) => setFormData({...formData, mission: e.target.value})} required /></div>
                <div className="form-group"><textarea className="form-control" placeholder="Rules & Regulations" value={formData.rulesAndRegulations} onChange={(e) => setFormData({...formData, rulesAndRegulations: e.target.value})} rows="4" required /></div>
                
                <div className="form-group">
                  <input type="number" className="form-control" placeholder="Annual Membership Fee (Rs.)" value={formData.membershipFee} onChange={(e) => setFormData({...formData, membershipFee: e.target.value})} required min="0" />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Club Logo (Optional)</label>
                  <input type="file" className="form-control" accept="image/*" onChange={(e) => setFormData({...formData, logoFile: e.target.files[0]})} />
                </div>
                
                <div className="form-group">
                  <select className="form-control" value={formData.presidentId} onChange={(e) => setFormData({...formData, presidentId: e.target.value})}>
                    <option value="">-- No President Assigned --</option>
                    {eligibleUsers.map(user => <option key={user._id} value={user._id}>{user.name} ({user.email})</option>)}
                  </select>
                </div>

                <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn" style={{ backgroundColor: editingClubId ? '#f59e0b' : 'var(--primary-color)' }}>
                    {editingClubId ? 'Save Changes' : 'Register Club'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

    {/* --- GLOBAL CLUB DIRECTORY --- */}
      <div className="card">
        
        {/* HEADER & TABS */}
        <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>Club Directory</h2>
          
          {currentUser.role === 'student' && (
            <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
              <button 
                className={viewFilter === 'all' ? "btn" : "btn btn-outline"} 
                style={{ padding: '8px 16px', fontSize: '0.9rem' }} 
                onClick={() => setViewFilter('all')}
              >
                Explore All Clubs
              </button>
              <button 
                className={viewFilter === 'my-clubs' ? "btn btn-success" : "btn btn-outline"} 
                style={{ padding: '8px 16px', fontSize: '0.9rem' }} 
                onClick={() => setViewFilter('my-clubs')}
              >
                My Registered Clubs
              </button>
            </div>
          )}
        </div>

        {/* --- NEW: SEARCH & SORT UI BAR --- */}
        <div className="flex-mobile-stack" style={{ display: 'flex', gap: '15px', marginBottom: '30px', backgroundColor: 'var(--bg-color)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ flex: 2, position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search for a club by name or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '35px', margin: 0 }}
            />
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <select 
              className="form-control" 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
              style={{ margin: 0, cursor: 'pointer' }}
            >
              <option value="name-asc">Sort: A-Z</option>
              <option value="name-desc">Sort: Z-A</option>
              <option value="members-desc">Sort: Most Members</option>
              <option value="fee-desc">Sort: Highest Fee</option>
              <option value="fee-asc">Sort: Lowest Fee</option>
            </select>
          </div>
        </div>

        {/* --- DYNAMIC GRID --- */}
        {/* Notice we map over 'filteredAndSortedClubs', NOT the original 'clubs' array */}
        {filteredAndSortedClubs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '1.1rem' }}>No clubs match your search criteria.</p>
            {searchTerm && (
              <button className="btn btn-outline" style={{ marginTop: '15px' }} onClick={() => setSearchTerm('')}>Clear Search</button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
            {filteredAndSortedClubs.map(club => (
              <div key={club._id} className="card card-hover" style={{ marginBottom: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                
               {/* --- UPGRADED: Visual Badges & Automated Health Metrics --- */}
                <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '5px', maxWidth: '60%' }}>
                  
                  {/* 1. User Role Badges */}
                  {club.president?._id === currentUser.id && <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>👑 President</span>}
                  {club.members?.some(m => m._id === currentUser.id) && club.president?._id !== currentUser.id && <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>Member</span>}
                  
                  {/* 2. Automated "Smart" Badges */}
                  {/* Triggers if the club has 3 or more members */}
                  {club.members?.length >= 3 && (
                    <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>🔥 Trending</span>
                  )}
                  
                  {/* Triggers if the backend election array has an active voting session */}
                  {club.elections?.some(e => e.isActive) && (
                    <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>🗳️ Elections Live</span>
                  )}
                  
                  {/* Triggers if the club has an active corporate funding proposal */}
                  {club.proposals?.some(p => p.isActive) && (
                    <span className="badge" style={{ backgroundColor: '#e0e7ff', color: '#2563eb' }}>🤝 Seeking Sponsors</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                    {club.logoUrl ? <img src={`http://localhost:5000${club.logoUrl}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '11px' }} /> : <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{club.name.charAt(0)}</span>}
                  </div>
                  <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.2rem', paddingRight: '70px' }}>{club.name}</h3>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', flex: 1, margin: '0 0 15px 0' }}>{club.description.substring(0, 120)}...</p>
                
                {/* Quick Stats for the UI */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>👥 {club.members?.length || 0} Members</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>💳 Rs. {club.membershipFee || 0}</span>
                </div>

                <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/clubs/${club._id}`)}>View Hub</button>
                  
                  {currentUser.role === 'supervisor' && (
                    <div className="flex-mobile-stack" style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn" style={{ padding: '0 12px', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }} onClick={() => handleEditClick(club)}>✏️</button>
                      <button className="btn btn-danger" style={{ padding: '0 12px' }} onClick={() => handleDeleteClub(club._id)}>🗑️</button>
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