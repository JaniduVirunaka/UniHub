import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';

function ClubManagement() {
  // --- UI ANIMATION HOOKS ---
  const [headerRef, headerVisible] = useScrollAnimation();
  const [gridRef, gridVisible] = useScrollAnimation();

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
      api.get('/auth/users')
        .then(res => setUsers(res.data))
        .catch(err => console.error("Error fetching users:", err));
    }
  }, []);

  const fetchClubs = () => {
    api.get('/clubs')
      .then(res => setClubs(res.data))
      .catch(err => console.error(err));
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

  // --- SUPERVISOR FORMS & LOGIC ---
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

    api.post('/clubs', data, { headers: { 'Content-Type': 'multipart/form-data' } })
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
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
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

    api.put(`/clubs/${editingClubId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        fetchClubs(); setEditingClubId(null); setFormData({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', membershipFee: '', logoFile: null }); setShowCreateForm(false); alert("Club updated successfully!");
      })
      .catch(err => alert(err.response?.data?.message || "Error updating club."));
  };

  const handleDeleteClub = (clubId) => {
    if (window.confirm("Are you sure you want to delete this club? This action cannot be undone.")) {
      api.delete(`/clubs/${clubId}`, { data: { supervisorId: currentUser.id } })
        .then(() => { fetchClubs(); alert("Club deleted."); })
        .catch(err => alert("Error deleting club."));
    }
  };

  const handleApproveAnnouncement = (clubId, annId) => {
    api.put(`/clubs/${clubId}/announcements/${annId}/approve`, { supervisorId: currentUser.id })
      .then(res => { fetchClubs(); }).catch(err => alert("Error approving announcement."));
  };

  const handleRejectAnnouncement = (clubId, annId) => {
    if(window.confirm("Reject and delete this announcement?")) {
      api.delete(`/clubs/${clubId}/announcements/${annId}`, { data: { supervisorId: currentUser.id } })
        .then(res => { fetchClubs(); }).catch(err => alert("Error rejecting announcement."));
    }
  };

  const pendingAnnouncements = clubs.flatMap(club => 
    (club.announcements || []).filter(ann => !ann.isApproved).map(ann => ({ ...ann, clubName: club.name, clubId: club._id }))
  );

  const eligibleUsers = users.filter(user => {
    if (user.role !== 'student') return false;
    const isBusyElsewhere = clubs.some(c => {
      if (editingClubId && c._id === editingClubId) return false;
      return (c.president?._id === user._id) || (c.president === user._id);
    });
    return !isBusyElsewhere;
  });

  // --- SEARCH & SORT ---
  const filteredClubs = clubs.filter(club => {
    if (viewFilter === 'my-clubs') {
      const isMember = club.members.some(m => m._id === currentUser.id);
      const isPresident = club.president?._id === currentUser.id;
      if (!isMember && !isPresident) return false;
    }
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      const matchName = club.name.toLowerCase().includes(lowerCaseSearch);
      const matchDesc = club.description.toLowerCase().includes(lowerCaseSearch);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const filteredAndSortedClubs = filteredClubs.sort((a, b) => {
    if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
    if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
    if (sortOption === 'members-desc') return (b.members?.length || 0) - (a.members?.length || 0);
    if (sortOption === 'fee-desc') return (b.membershipFee || 0) - (a.membershipFee || 0);
    if (sortOption === 'fee-asc') return (a.membershipFee || 0) - (b.membershipFee || 0);
    return 0;
  });

  return (
    <div style={{ paddingBottom: '3rem' }}>
      
      {/* 1. SUPERVISOR DASHBOARD (Animated) */}
      {currentUser.role === 'supervisor' && (
        <div ref={headerRef} className={`fade-in-section ${headerVisible ? 'is-visible' : ''}`} style={{ marginBottom: '30px' }}>
          <div className="card card-hover flex-mobile-stack" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', border: '1px solid var(--primary-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
            <div>
              <h3 style={{ color: 'var(--primary-color)', margin: '0 0 5px 0' }}>📈 Global Financial Matrix</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View aggregated revenue and expense analytics across all university clubs.</p>
            </div>
            <button className="btn" onClick={() => navigate('/supervisor/analytics')}>Launch Matrix &rarr;</button>
          </div>

          {pendingAnnouncements.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
              <h2 style={{ marginTop: 0, color: '#b91c1c' }}>Action Center: Pending Approvals</h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {pendingAnnouncements.map((ann) => (
                  <div key={ann._id} className="card card-hover flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--danger)' }}>{ann.clubName}</span>
                      <h4 style={{ margin: '5px 0' }}>{ann.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>{ann.content}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="btn btn-success" style={{ padding: '5px 10px' }} onClick={() => handleApproveAnnouncement(ann.clubId, ann._id)}>Approve</button>
                      <button className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => handleRejectAnnouncement(ann.clubId, ann._id)}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
            <button className="btn" onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm || editingClubId ? 'Close Form' : '+ Register New Club'}
            </button>
          </div>

          {(showCreateForm || editingClubId) && (
            <div className="card fade-in-section is-visible" style={{ borderTop: editingClubId ? '4px solid #f59e0b' : '4px solid var(--primary-color)' }}>
              <h2>{editingClubId ? 'Edit Club' : 'Register New Club'}</h2>
              <form onSubmit={editingClubId ? handleUpdateClub : handleCreateClub}>
                <div className="form-group"><input type="text" className="form-control" placeholder="Club Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="form-group"><textarea className="form-control" placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required /></div>
                <div className="form-group"><textarea className="form-control" placeholder="Mission" value={formData.mission} onChange={(e) => setFormData({...formData, mission: e.target.value})} required /></div>
                <div className="form-group"><textarea className="form-control" placeholder="Rules" value={formData.rulesAndRegulations} onChange={(e) => setFormData({...formData, rulesAndRegulations: e.target.value})} rows="3" required /></div>
                <div className="form-group"><input type="number" className="form-control" placeholder="Fee (Rs.)" value={formData.membershipFee} onChange={(e) => setFormData({...formData, membershipFee: e.target.value})} required /></div>
                <div className="form-group">
                    <select className="form-control" value={formData.presidentId} onChange={(e) => setFormData({...formData, presidentId: e.target.value})}>
                        <option value="">-- No President Assigned --</option>
                        {eligibleUsers.map(user => <option key={user._id} value={user._id}>{user.name} ({user.email})</option>)}
                    </select>
                </div>
                <button type="submit" className="btn" style={{ width: '100%' }}>{editingClubId ? 'Save Changes' : 'Register Club'}</button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. CLUB DIRECTORY (Animated Grid) */}
      <div ref={gridRef} className={`fade-in-section ${gridVisible ? 'is-visible' : ''}`}>
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <h2 style={{ margin: 0 }}>Campus Directory</h2>
            {currentUser.role === 'student' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className={viewFilter === 'all' ? "btn" : "btn btn-outline"} onClick={() => setViewFilter('all')}>All Clubs</button>
                <button className={viewFilter === 'my-clubs' ? "btn btn-success" : "btn btn-outline"} onClick={() => setViewFilter('my-clubs')}>My Clubs</button>
              </div>
            )}
          </div>

          {/* GLASS SEARCH BAR */}
          <div style={{ display: 'flex', gap: '15px', backgroundColor: 'rgba(255,255,255,0.4)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.6)' }}>
            <input 
              type="text" className="form-control" placeholder="🔍 Search for a club..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ margin: 0, flex: 2 }}
            />
            <select className="form-control" value={sortOption} onChange={(e) => setSortOption(e.target.value)} style={{ margin: 0, flex: 1 }}>
              <option value="name-asc">Sort: A-Z</option>
              <option value="members-desc">Most Members</option>
              <option value="fee-asc">Lowest Fee</option>
            </select>
          </div>
        </div>

        {/* GLASS CARDS GRID */}
        {filteredAndSortedClubs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No clubs match your criteria.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
            {filteredAndSortedClubs.map(club => (
              <div key={club._id} className="card card-hover" style={{ margin: 0, minHeight: '300px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                
                {/* Visual Badges (Already glassy from our previous CSS) */}
                <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '5px', maxWidth: '60%' }}>
                  {club.president?._id === currentUser.id && <span className="badge" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)' }}>👑 President</span>}
                  {club.members?.length >= 3 && <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}>🔥 Trending</span>}
                  {club.elections?.some(e => e.isActive) && <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>🗳️ Elections</span>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '15px', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {club.logoUrl ? <img src={`http://localhost:5000${club.logoUrl}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.5rem' }}>{club.name.charAt(0)}</span>}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', paddingRight: '60px' }}>{club.name}</h3>
                </div>

                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', flex: 1 }}>{club.description.substring(0, 100)}...</p>
                
                <div style={{ display: 'flex', gap: '15px', margin: '15px 0', fontSize: '0.85rem' }}>
                  <span>👥 {club.members?.length || 0} Members</span>
                  <span>💳 Rs. {club.membershipFee}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(`/clubs/${club._id}`)}>View Hub</button>
                  {currentUser.role === 'supervisor' && (
                    <>
                      <button className="btn" style={{ backgroundColor: '#fef3c7', color: '#d97706' }} onClick={() => handleEditClick(club)}>✏️</button>
                      <button className="btn btn-danger" onClick={() => handleDeleteClub(club._id)}>🗑️</button>
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