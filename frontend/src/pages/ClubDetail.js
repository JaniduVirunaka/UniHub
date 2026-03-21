import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ClubDetail() {
  const { id } = useParams(); // Gets the club ID from the URL
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [announcementData, setAnnouncementData] = useState({ title: '', content: '' });
  const [boardData, setBoardData] = useState({ userId: '', role: '' });
  const [sponsorData, setSponsorData] = useState({ sponsorName: '', description: '', targetAmount: '' });

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClubData();
  }, [id]);

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  };

  // Student requests to join
  const handleJoinRequest = () => {
    axios.post(`http://localhost:5000/api/clubs/${id}/request-join`, { userId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        fetchClubData(); // Refresh the page data to show the pending status
      })
      .catch(err => alert(err.response?.data?.message || "Error requesting to join."));
  };

  // President approves a student
  const handleApprove = (studentId) => {
    axios.post(`http://localhost:5000/api/clubs/${id}/approve`, { studentId, presidentId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        fetchClubData(); // Refresh to move student from pending to approved members
      })
      .catch(err => alert("Error approving member."));
  };

  // --- PRESIDENT ACTIONS ---
  
  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/clubs/${id}/announcements`, { ...announcementData, presidentId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        setAnnouncementData({ title: '', content: '' }); 
        fetchClubData(); 
      })
      .catch(err => alert(err.response?.data?.message || "Error posting announcement."));
  };

  // --- SPONSORSHIP ACTIONS ---
const handleAddSponsorship = (e) => {
  e.preventDefault();
  axios.post(`http://localhost:5000/api/clubs/${id}/sponsorships`, { ...sponsorData, presidentId: currentUser.id })
    .then(res => {
      alert(res.data.message);
      setSponsorData({ sponsorName: '', description: '', targetAmount: '' }); 
      fetchClubData(); 
    })
    .catch(err => alert(err.response?.data?.message || "Error adding sponsorship."));
};

const handleUpdateFunds = (sponsorId, newAmount) => {
  axios.put(`http://localhost:5000/api/clubs/${id}/sponsorships/${sponsorId}`, { currentAmount: newAmount, presidentId: currentUser.id })
    .then(res => fetchClubData())
    .catch(err => alert("Error updating funds."));
};

  const handleAssignBoard = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/clubs/${id}/board`, { ...boardData, presidentId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        setBoardData({ userId: '', role: '' }); // Clear form
        fetchClubData();
      })
      .catch(err => alert(err.response?.data?.message || "Error assigning role."));
  };

  const handleRemoveBoard = (userId) => {
    if(window.confirm("Are you sure you want to remove this member from the board?")) {
      axios.delete(`http://localhost:5000/api/clubs/${id}/board/${userId}`, { data: { presidentId: currentUser.id } })
        .then(res => {
          fetchClubData();
        })
        .catch(err => alert("Error removing board member."));
    }
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Club Details...</div>;

  // --- Determine User's Access Level ---
  const isPresident = club.president?._id === currentUser?.id;
  const isSupervisor = currentUser?.role === 'supervisor';
  // Check if the current user's ID exists in the approved members array
  const isMember = club.members?.some(member => member._id === currentUser?.id);
  
  // They get full access if they are the president, an approved member, or the supervisor
  const hasFullAccess = isPresident || isMember || isSupervisor;
  const isPending = club.pendingMembers?.some(member => member._id === currentUser?.id);

  return (
    <div className="container">
     {/* 1. PUBLIC HEADER (Everyone sees this) */}
      <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
        <button className="btn" style={{ backgroundColor: '#6b7280', marginBottom: '20px' }} onClick={() => navigate('/clubs')}>
          {isPresident ? 'Browse Other Clubs' : '&larr; Back to Directory'}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ color: 'var(--primary-color)', margin: '0 0 10px 0' }}>{club.name}</h1>
            <p><strong>President:</strong> {club.president?.name || 'Vacant'}</p>
            {club.topBoard?.length > 0 && (
                <p style={{ margin: '5px 0' }}>
                    <strong>Executive Board: </strong> 
                    {club.topBoard.map((b, index) => (
                        <span key={index}>{b.role}: {b.user?.name}{index < club.topBoard.length - 1 ? ', ' : ''}</span>
                    ))}
                </p>
            )}
          </div>
          
          {/* JOIN BUTTON LOGIC FOR STUDENTS */}
          {currentUser?.role === 'student' && !isMember && !isPending && (
            <button className="btn" style={{ backgroundColor: '#10b981' }} onClick={handleJoinRequest}>
              Request to Join Club
            </button>
          )}
          {currentUser?.role === 'student' && isPending && (
            <span style={{ padding: '10px 15px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '5px', fontWeight: 'bold' }}>
              Join Request Pending...
            </span>
          )}
          {isMember && !isPresident && (
            <span style={{ padding: '10px 15px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '5px', fontWeight: 'bold' }}>
              You are a Member
            </span>
          )}
        </div>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{club.description}</p>
        <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '5px', marginTop: '15px' }}>
          <strong>Mission:</strong> {club.mission}
        </div>
      </div>

      {/* 2. PUBLIC SECTIONS (Everyone sees this) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ marginBottom: '0' }}>
          <h3 style={{ color: 'var(--primary-color)' }}>Public Gallery</h3>
          <p style={{ color: 'var(--text-muted)' }}>[Gallery Module Coming Soon]</p>
        </div>
        <div className="card" style={{ marginBottom: '0' }}>
          <h3 style={{ color: 'var(--primary-color)' }}>Leaderboard & Achievements</h3>
          <p style={{ color: 'var(--text-muted)' }}>[Achievements Module Coming Soon]</p>
        </div>
      </div>

      {/* 3. PRIVATE SECTIONS (Only Approved Members & Leadership see this) */}
      {hasFullAccess ? (
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <h2 style={{ color: '#10b981', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
            Internal Member Hub
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
            
            {/* Announcements */}
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginTop: '0' }}>📢 Official Announcements</h4>
              {club.announcements?.filter(a => a.isApproved || isPresident || isSupervisor).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No announcements yet.</p>
              ) : (
                club.announcements?.map((ann, i) => (
                   // Only show if approved, OR if the viewer is the Pres/Supervisor
                  (ann.isApproved || isPresident || isSupervisor) && (
                    <div key={i} style={{ padding: '10px', backgroundColor: '#fff', border: '1px solid #e5e7eb', marginBottom: '10px', borderRadius: '4px' }}>
                      <strong style={{ display: 'block' }}>{ann.title}</strong>
                      <span style={{ fontSize: '0.9rem' }}>{ann.content}</span>
                      {!ann.isApproved && <span style={{ display: 'block', color: '#f59e0b', fontSize: '0.8rem', marginTop: '5px' }}>Pending Approval</span>}
                    </div>
                  )
                ))
              )}
            </div>

            {/* Sponsorships & Voting */}
            {/* Sponsorships & Funding */}
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', gridColumn: '1 / -1' }}>
              <h4 style={{ marginTop: '0', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>🤝 Funding & Sponsorships</h4>
              
              {club.sponsorships?.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active funding targets.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
                  {club.sponsorships.map((sponsor) => {
                    // Calculate the percentage for the progress bar
                    const percent = Math.min((sponsor.currentAmount / sponsor.targetAmount) * 100, 100).toFixed(0);
                    
                    return (
                      <div key={sponsor._id} style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h5 style={{ margin: '0 0 5px 0', color: 'var(--primary-color)' }}>{sponsor.sponsorName}</h5>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: sponsor.status === 'Completed' ? '#d1fae5' : '#dbeafe', color: sponsor.status === 'Completed' ? '#065f46' : '#1e40af' }}>
                            {sponsor.status}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#6b7280' }}>{sponsor.description}</p>
                        
                        {/* Progress Bar UI */}
                        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '10px', marginBottom: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, backgroundColor: percent >= 100 ? '#10b981' : '#3b82f6', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          <span style={{ color: '#374151' }}>Rs. {sponsor.currentAmount}</span>
                          <span style={{ color: '#9ca3af' }}>Goal: Rs. {sponsor.targetAmount}</span>
                        </div>

                        {/* Quick Update Button (President Only) */}
                        {isPresident && (
                          <div style={{ marginTop: '15px', display: 'flex', gap: '5px' }}>
                            <input 
                              type="number" 
                              id={`fund-${sponsor._id}`} 
                              className="form-control" 
                              placeholder="New Total" 
                              style={{ padding: '5px', fontSize: '0.85rem' }} 
                            />
                            <button 
                              className="btn" 
                              style={{ padding: '5px 10px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                              onClick={() => {
                                const val = document.getElementById(`fund-${sponsor._id}`).value;
                                if(val) handleUpdateFunds(sponsor._id, Number(val));
                              }}
                            >
                              Update
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginTop: '0' }}>🗳️ Digital Voting</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>[Active Elections Coming Soon]</p>
            </div>

          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', backgroundColor: '#f9fafb' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Want to see more?</h3>
          <p>You must be an approved member to view announcements, sponsorships, and voting details.</p>
          {/* We will add the "Request to Join" button back here later! */}
        </div>
      )}

      {/* 4. PRESIDENT'S ADMIN PANEL (Only President sees this) */}
      {isPresident && (
        <div className="card" style={{ borderLeft: '4px solid #3b82f6', marginTop: '20px' }}>
          <h2 style={{ color: '#3b82f6', marginTop: 0 }}>President's Control Center</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* LEFT COLUMN: People Management */}
            <div>
              <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '20px' }}>
                <h4 style={{ color: '#d97706', marginTop: 0 }}>👥 Pending Join Requests</h4>
                {club.pendingMembers?.length === 0 ? (
                  <p style={{ color: '#b45309', fontSize: '0.9rem' }}>No pending requests.</p>
                ) : (
                  club.pendingMembers?.map(student => (
                    <div key={student._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px' }}>
                      <span><strong>{student.name}</strong><br/><small>{student.email}</small></span>
                      <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#059669' }} onClick={() => handleApprove(student._id)}>Approve</button>
                    </div>
                  ))
                )}
              </div>

              <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h4 style={{ color: '#374151', marginTop: 0 }}>👔 Top Board Management</h4>
                
                {/* Form to Assign a Role */}
                <form onSubmit={handleAssignBoard} style={{ marginBottom: '15px' }}>
                  <select className="form-control" style={{ marginBottom: '10px' }} value={boardData.userId} onChange={(e) => setBoardData({...boardData, userId: e.target.value})} required>
                    <option value="">-- Select an Approved Member --</option>
                    {club.members?.map(member => (
                      <option key={member._id} value={member._id}>{member.name}</option>
                    ))}
                  </select>
                  <input type="text" className="form-control" placeholder="Role (e.g., Secretary, Treasurer)" value={boardData.role} onChange={(e) => setBoardData({...boardData, role: e.target.value})} required style={{ marginBottom: '10px' }} />
                  <button type="submit" className="btn" style={{ width: '100%', padding: '8px', backgroundColor: '#374151' }}>Assign Role</button>
                </form>

                {/* List of Current Board Members */}
                {club.topBoard?.map((boardMember, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '8px', borderRadius: '5px', marginBottom: '5px', borderLeft: '3px solid #3b82f6' }}>
                    <span><strong>{boardMember.role}:</strong> {boardMember.user?.name}</span>
                    <button className="btn" style={{ padding: '2px 8px', fontSize: '0.8rem', backgroundColor: '#ef4444' }} onClick={() => handleRemoveBoard(boardMember.user?._id)}>X</button>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT COLUMN: Communications */}
            <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
               <h4 style={{ color: '#1e40af', marginTop: 0 }}>📢 Draft New Announcement</h4>
               <form onSubmit={handlePostAnnouncement}>
                 <input type="text" className="form-control" placeholder="Announcement Title" value={announcementData.title} onChange={(e) => setAnnouncementData({...announcementData, title: e.target.value})} required style={{ marginBottom: '10px' }}/>
                 <textarea className="form-control" placeholder="What do you want to tell your members?" value={announcementData.content} onChange={(e) => setAnnouncementData({...announcementData, content: e.target.value})} required style={{ marginBottom: '10px', minHeight: '120px' }}/>
                 <button type="submit" className="btn" style={{ width: '100%', backgroundColor: '#3b82f6' }}>Submit for Supervisor Approval</button>
               </form>

               <hr style={{ borderColor: '#bfdbfe', margin: '20px 0' }} />
               <h4 style={{ color: '#1e40af', marginTop: 0 }}>🤝 Setup Sponsorship Target</h4>
               <form onSubmit={handleAddSponsorship}>
                 <input type="text" className="form-control" placeholder="Target/Campaign Name (e.g., Annual Tech Hackathon)" value={sponsorData.sponsorName} onChange={(e) => setSponsorData({...sponsorData, sponsorName: e.target.value})} required style={{ marginBottom: '10px' }}/>
                 <input type="text" className="form-control" placeholder="Short Description" value={sponsorData.description} onChange={(e) => setSponsorData({...sponsorData, description: e.target.value})} required style={{ marginBottom: '10px' }}/>
                 <input type="number" className="form-control" placeholder="Target Amount (Rs.)" value={sponsorData.targetAmount} onChange={(e) => setSponsorData({...sponsorData, targetAmount: e.target.value})} required style={{ marginBottom: '10px' }} min="1" />
                 <button type="submit" className="btn" style={{ width: '100%', backgroundColor: '#10b981' }}>Create Funding Target</button>
               </form>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubDetail;