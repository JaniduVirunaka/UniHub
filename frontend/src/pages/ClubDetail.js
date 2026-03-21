import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ClubDetail() {
  const { id } = useParams(); // Gets the club ID from the URL
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [announcementData, setAnnouncementData] = useState({ title: '', content: '' });
  const [boardData, setBoardData] = useState({ userId: '', role: '' });
  const [electionData, setElectionData] = useState({ position: '' });
  const [candidateData, setCandidateData] = useState({ candidateUserId: '', manifesto: '' });

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const availableRoles = [
  "President","Vice President", "Secretary", "Assistant Secretary", 
  "Treasurer", "Assistant Treasurer", "Event Coordinator", 
  "Public Relations", "Editor"
  ];
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

  // President rejects a student request
  const handleRejectRequest = (studentId) => {
  if(!window.confirm("Are you sure you want to decline this request?")) return;
  axios.post(`http://localhost:5000/api/clubs/${id}/reject-request`, { studentId, presidentId: currentUser.id })
    .then(res => {
      alert(res.data.message);
      fetchClubData(); 
    })
    .catch(err => alert("Error rejecting member."));
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

  // --- ELECTION & VOTING ACTIONS ---
  const handleCreateElection = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/clubs/${id}/elections`, { position: electionData.position, supervisorId: currentUser?.id })
      .then(res => {
        alert(res.data.message);
        setElectionData({ position: '' });
        fetchClubData();
      })
      .catch(err => alert(err.response?.data?.message || "Error creating election."));
  };

  const handleAddCandidate = (e, electionId) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/clubs/${id}/elections/${electionId}/candidates`, { ...candidateData, supervisorId: currentUser?.id })
      .then(res => {
        alert(res.data.message);
        setCandidateData({ candidateUserId: '', manifesto: '' });
        fetchClubData();
      })
      .catch(err => alert(err.response?.data?.message || "Error adding candidate."));
  };

  const handleToggleElection = (electionId, isActive, isPublished) => {
    if(!window.confirm("Are you sure you want to change the election status?")) return;
    axios.put(`http://localhost:5000/api/clubs/${id}/elections/${electionId}/status`, { isActive, isPublished, supervisorId: currentUser?.id })
      .then(res => fetchClubData())
      .catch(err => alert("Error updating election status."));
  };

  const handleVote = (electionId, candidateId) => {
    if (!window.confirm("Are you sure? Your vote is final and anonymous.")) return;
    axios.post(`http://localhost:5000/api/clubs/${id}/elections/${electionId}/vote`, { userId: currentUser?.id, candidateId })
      .then(res => {
        alert(res.data.message);
        fetchClubData();
      })
      .catch(err => alert(err.response?.data?.message || "Error casting vote."));
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Club Details...</div>;

  // --- Determine User's Access Level ---
  const isPresident = club.president?._id === currentUser?.id;
  const isTopBoard = isPresident || club.topBoard?.some(b => b.user?._id === currentUser?.id);
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ marginBottom: '0', textAlign: 'center', backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
          <h3 style={{ color: '#8b5cf6', marginTop: 0 }}>🏢 Corporate Partnerships</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>View active funding proposals or submit a pledge on behalf of your company.</p>
          <button className="btn" style={{ backgroundColor: '#8b5cf6', width: '100%', marginTop: '10px' }} onClick={() => navigate(`/clubs/${id}/sponsorships`)}>
            Enter Sponsorship Portal
          </button>
        </div>
        
        <div className="card" style={{ marginBottom: '0', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>Leaderboard & Gallery</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>[Achievements & Gallery Module Coming Soon]</p>
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

         {/* 🤝 Funding & Proposals (UPDATED FOR B2B SYSTEM) */}
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#6d28d9' }}>🤝 Active Funding Campaigns</h4>
                
                {/* Quick link for the Top Board to jump into the CRM */}
                {isTopBoard && (
                  <button className="btn" style={{ padding: '5px 15px', backgroundColor: '#8b5cf6', fontSize: '0.85rem' }} onClick={() => navigate(`/clubs/${id}/sponsorships`)}>
                    Manage in Corporate Portal
                  </button>
                )}
              </div>
              
              {!club.proposals || club.proposals.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active campaigns at the moment.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  {club.proposals.map((prop) => {
                    // MAGIC: Automatically calculate the total raised from ONLY the 'Accepted' pledges!
                    const totalRaised = prop.pledges?.filter(p => p.status === 'Accepted').reduce((sum, p) => sum + p.amount, 0) || 0;
                    const percent = Math.min((totalRaised / prop.targetAmount) * 100, 100).toFixed(0);
                    
                    return (
                      <div key={prop._id} style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h5 style={{ margin: '0 0 5px 0', color: '#6d28d9' }}>{prop.title}</h5>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: prop.isActive ? '#dbeafe' : '#f3f4f6', color: prop.isActive ? '#1e40af' : '#4b5563' }}>
                            {prop.isActive ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#6b7280' }}>{prop.description}</p>
                        
                        {/* Dynamic Progress Bar UI */}
                        <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '10px', marginBottom: '5px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, backgroundColor: percent >= 100 ? '#10b981' : '#8b5cf6', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          <span style={{ color: '#10b981' }}>Raised: Rs. {totalRaised}</span>
                          <span style={{ color: '#9ca3af' }}>Goal: Rs. {prop.targetAmount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 🗳️ LIVE VOTING BOOTH */}
            {club.elections && club.elections.length > 0 && (
              <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', gridColumn: '1 / -1', marginTop: '15px' }}>
                <h4 style={{ margin: 0, color: '#166534', borderBottom: '2px solid #bbf7d0', paddingBottom: '10px', marginBottom: '15px' }}>🗳️ Official Club Elections</h4>
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  {club.elections.map((election) => {
                    const hasVoted = election.votedUsers.includes(currentUser?.id);
                    const totalVotes = election.votedUsers.length;

                    return (
                      <div key={election._id} style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                          <h5 style={{ margin: 0, color: '#065f46', fontSize: '1.1rem' }}>{election.position}</h5>
                          <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', backgroundColor: election.isActive ? '#dcfce7' : '#f3f4f6', color: election.isActive ? '#166534' : '#4b5563', fontWeight: 'bold' }}>
                            {election.isPublished ? 'Results Published' : election.isActive ? 'Voting Open' : 'Voting Closed'}
                          </span>
                        </div>

                        {/* Candidates List */}
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {election.candidates.map((c) => {
                            const candidateName = club.members.find(m => m._id === c.user)?.name || 'Unknown User';
                            const votePercent = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(0) : 0;

                            return (
                              <div key={c._id} style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '5px', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  <strong style={{ display: 'block', fontSize: '1rem' }}>{candidateName}</strong>
                                  <span style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>"{c.manifesto}"</span>
                                  
                                  {/* Render Results ONLY if published */}
                                  {election.isPublished && (
                                    <div style={{ marginTop: '8px' }}>
                                      <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                        <div style={{ width: `${votePercent}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                                      </div>
                                      <small style={{ fontWeight: 'bold', color: '#166534' }}>{c.voteCount} Votes ({votePercent}%)</small>
                                    </div>
                                  )}
                                </div>

                                {/* Voting Button */}
                                {election.isActive && !hasVoted && (
                                  <button className="btn" style={{ backgroundColor: '#10b981', marginLeft: '15px', padding: '8px 20px' }} onClick={() => handleVote(election._id, c._id)}>
                                    Vote
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Voter Status Message */}
                        {election.isActive && hasVoted && (
                          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#dcfce7', color: '#166534', textAlign: 'center', borderRadius: '5px', fontWeight: 'bold' }}>
                            ✅ Your vote has been securely recorded.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#059669' }} onClick={() => handleApprove(student._id)}>Approve</button>
                        <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#ef4444' }} onClick={() => handleRejectRequest(student._id)}>Decline</button>
                      </div>
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
                  <select className="form-control" value={boardData.role} onChange={(e) => setBoardData({...boardData, role: e.target.value})} required style={{ marginBottom: '10px' }}>
                    <option value="">-- Select a Position --</option>
                    {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
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
            </div>
            
          </div>
        </div>
      )}

     {/* ========================================== */}
      {/* 5. SUPERVISOR ADMIN PANEL (Highest Authority)*/}
      {/* ========================================== */}
      {isSupervisor && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
            🛡️ Supervisor Control Center
          </h3>
          
          <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <h4 style={{ color: '#166534', marginTop: 0 }}>Electoral Engine</h4>
            
            {/* Create Election Form */}
            <form onSubmit={handleCreateElection} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <select className="form-control" required value={electionData.position} onChange={(e) => setElectionData({ position: e.target.value })} style={{ flex: 1 }}>
                <option value="">-- Select Position to Elect --</option>
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button type="submit" className="btn" style={{ backgroundColor: '#166534' }}>Initialize Election</button>
            </form>

            {/* Manage Active Elections */}
            {club.elections?.map(election => (
              <div key={election._id} style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h5 style={{ margin: 0, fontSize: '1.1rem', color: '#065f46' }}>{election.position}</h5>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" style={{ backgroundColor: election.isActive ? '#ef4444' : '#10b981', padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => handleToggleElection(election._id, !election.isActive, election.isPublished)}>
                      {election.isActive ? '🛑 Close Voting' : '🟢 Open Voting'}
                    </button>
                    <button className="btn" style={{ backgroundColor: election.isPublished ? '#6b7280' : '#8b5cf6', padding: '5px 10px', fontSize: '0.8rem' }} onClick={() => handleToggleElection(election._id, false, !election.isPublished)}>
                      {election.isPublished ? 'Hide Results' : '📢 Publish Results'}
                    </button>
                  </div>
                </div>

                {/* Live Tally */}
                <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Live Tally ({election.votedUsers?.length || 0} votes cast)</p>
                <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px' }}>
                  {election.candidates?.map(c => {
                    // Added safety question marks here!
                    const candidateName = club.members?.find(m => m._id === c.user)?.name || 'Unknown User';
                    return <li key={c._id}>{candidateName}: <strong>{c.voteCount} votes</strong></li>
                  })}
                </ul>

                {/* Add Candidate Form */}
                {!election.isActive && !election.isPublished && (
                  <form onSubmit={(e) => handleAddCandidate(e, election._id)} style={{ backgroundColor: '#f9fafb', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '5px' }}>
                    <h6 style={{ margin: '0 0 5px 0' }}>Add Candidate to Ballot</h6>
                    <select className="form-control" required onChange={(e) => setCandidateData({...candidateData, candidateUserId: e.target.value})} style={{ marginBottom: '8px' }}>
                      <option value="">-- Select an Approved Member --</option>
                      {/* Added safety question marks here! */}
                      {club.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                    <input type="text" className="form-control" placeholder="Short Manifesto / Slogan" required onChange={(e) => setCandidateData({...candidateData, manifesto: e.target.value})} style={{ marginBottom: '8px' }}/>
                    <button type="submit" className="btn" style={{ backgroundColor: '#059669', padding: '5px 15px', fontSize: '0.85rem' }}>Add to Ballot</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubDetail;