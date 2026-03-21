import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  
  // Announcement States
  const [announcementData, setAnnouncementData] = useState({ title: '', content: '' });
  const [editingAnnId, setEditingAnnId] = useState(null);
  const [editAnnData, setEditAnnData] = useState({ title: '', content: '' });
  const [boardData, setBoardData] = useState({ userId: '', role: '' });

  // Election States
  const [electionData, setElectionData] = useState({ position: '', candidates: [] });
  const [tempCandidate, setTempCandidate] = useState({ candidateUserId: '', manifesto: '' }); 
  const [editingElectionId, setEditingElectionId] = useState(null);
  const [editElectionData, setEditElectionData] = useState({ position: '', candidates: [] });
  const [editTempCandidate, setEditTempCandidate] = useState({ candidateUserId: '', manifesto: '' }); 

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const availableRoles = [
    "President", "Vice President", "Secretary", "Assistant Secretary",
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

  // --- ACTIONS ---
  const handleJoinRequest = () => {
    axios.post(`http://localhost:5000/api/clubs/${id}/request-join`, { userId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        fetchClubData();
      })
      .catch(err => alert(err.response?.data?.message || "Error requesting to join."));
  };

  const handleApprove = (studentId) => {
    axios.post(`http://localhost:5000/api/clubs/${id}/approve`, { studentId, presidentId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        fetchClubData(); 
      })
      .catch(err => alert("Error approving member."));
  };

  const handleRejectRequest = (studentId) => {
    if (!window.confirm("Are you sure you want to decline this request?")) return;
    axios.post(`http://localhost:5000/api/clubs/${id}/reject-request`, { studentId, presidentId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        fetchClubData();
      })
      .catch(err => alert("Error rejecting member."));
  };

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

  const handleEditAnnouncement = (annId) => {
    if (!editAnnData.title || !editAnnData.content) return alert("Fields cannot be empty.");
    axios.put(`http://localhost:5000/api/clubs/${id}/announcements/${annId}/edit`, { ...editAnnData, userId: currentUser?.id })
      .then(res => {
        alert(res.data.message);
        setEditingAnnId(null);
        fetchClubData();
      })
      .catch(err => alert("Error updating announcement."));
  };

  const handleDeleteAnnouncement = (annId) => {
    if (!window.confirm("Are you sure you want to permanently delete this announcement?")) return;
    axios.delete(`http://localhost:5000/api/clubs/${id}/announcements/${annId}`, { data: { userId: currentUser?.id } })
      .then(res => fetchClubData())
      .catch(err => alert("Error deleting announcement."));
  };

  const handleAssignBoard = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/clubs/${id}/board`, { ...boardData, presidentId: currentUser.id })
      .then(res => {
        alert(res.data.message);
        setBoardData({ userId: '', role: '' });
        fetchClubData();
      })
      .catch(err => alert(err.response?.data?.message || "Error assigning role."));
  };

  const handleRemoveBoard = (userId) => {
    if (window.confirm("Are you sure you want to remove this member from the board?")) {
      axios.delete(`http://localhost:5000/api/clubs/${id}/board/${userId}`, { data: { presidentId: currentUser.id } })
        .then(res => fetchClubData())
        .catch(err => alert("Error removing board member."));
    }
  };

  const handleAddTempCandidate = (e, isEdit = false) => {
    e.preventDefault();
    const targetState = isEdit ? editTempCandidate : tempCandidate;
    if (!targetState.candidateUserId || !targetState.manifesto) return;

    if (isEdit) {
      setEditElectionData({ ...editElectionData, candidates: [...editElectionData.candidates, targetState] });
      setEditTempCandidate({ candidateUserId: '', manifesto: '' });
    } else {
      setElectionData({ ...electionData, candidates: [...electionData.candidates, targetState] });
      setTempCandidate({ candidateUserId: '', manifesto: '' });
    }
  };

  const handleRemoveTempCandidate = (index, isEdit = false) => {
    if (isEdit) {
      const newCands = [...editElectionData.candidates];
      newCands.splice(index, 1);
      setEditElectionData({ ...editElectionData, candidates: newCands });
    } else {
      const newCands = [...electionData.candidates];
      newCands.splice(index, 1);
      setElectionData({ ...electionData, candidates: newCands });
    }
  };

  const handleCreateElection = (e) => {
    e.preventDefault();
    if (!electionData.position) return alert("Please select a position.");

    if (tempCandidate.candidateUserId || tempCandidate.manifesto) {
      const proceed = window.confirm("Hold on! You entered candidate details but didn't click 'Add to List'. Do you want to create the election WITHOUT adding them?");
      if (!proceed) return;
    }

    axios.post(`http://localhost:5000/api/clubs/${id}/elections`, { ...electionData, supervisorId: currentUser?.id })
      .then(res => {
        alert(res.data.message);
        setElectionData({ position: '', candidates: [] }); 
        setTempCandidate({ candidateUserId: '', manifesto: '' });
        fetchClubData();
      })
      .catch(err => alert(err.response?.data?.message || "Error creating election."));
  };

  const handleUpdateElection = (electionId) => {
    if (!editElectionData.position) return alert("Please select a position.");

    if (editTempCandidate.candidateUserId || editTempCandidate.manifesto) {
      const proceed = window.confirm("Hold on! You entered candidate details but didn't click the '+' button. Do you want to save changes WITHOUT adding them?");
      if (!proceed) return;
    }

    axios.put(`http://localhost:5000/api/clubs/${id}/elections/${electionId}/edit`, { ...editElectionData, supervisorId: currentUser?.id })
      .then(res => {
        alert(res.data.message);
        setEditingElectionId(null);
        setEditTempCandidate({ candidateUserId: '', manifesto: '' });
        fetchClubData();
      })
      .catch(err => alert(err.response?.data?.message || "Error updating election."));
  };

  const handleToggleElection = (electionId, isActive, isPublished) => {
    if (!window.confirm("Are you sure you want to change the election status?")) return;
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

  const handleDeleteElection = (electionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this election record?")) return;
    axios.delete(`http://localhost:5000/api/clubs/${id}/elections/${electionId}`, { data: { supervisorId: currentUser?.id } })
      .then(res => {
        alert(res.data.message);
        fetchClubData();
      })
      .catch(err => alert("Error deleting election."));
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Club Details...</div>;

  // --- Determine User's Access Level ---
  const isActualPresident = club.president?._id === currentUser?.id;
  const isVP = club.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isPresident = isActualPresident || isVP;

  const isSecretary = club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Secretary', 'Assistant Secretary'].includes(b.role));
  const canManageAnnouncements = isPresident || isSecretary; 

  const allowedSponsorshipRoles = ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'];
  const canManageSponsorships = isPresident || club.topBoard?.some(b => b.user?._id === currentUser?.id && allowedSponsorshipRoles.includes(b.role));

  const isSupervisor = currentUser?.role === 'supervisor';
  const isTopBoard = isPresident || club.topBoard?.some(b => b.user?._id === currentUser?.id);
  const isMember = club.members?.some(member => member._id === currentUser?.id);
  const hasFullAccess = isTopBoard || isMember || isSupervisor;
  const isPending = club.pendingMembers?.some(member => member._id === currentUser?.id);

  return (
    <div className="container">
      {/* 1. PUBLIC HEADER */}
      <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
        <button className="btn" style={{ backgroundColor: '#6b7280', marginBottom: '20px' }} onClick={() => navigate('/clubs')}>
          {isPresident ? 'Browse Other Clubs' : 'Back to Directory'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>{club.name}</h1>
          <div>
            {currentUser?.role === 'student' && !isMember && !isPending && (
              <button className="btn" style={{ backgroundColor: '#10b981', margin: 0 }} onClick={handleJoinRequest}>
                Request to Join Club
              </button>
            )}
            {currentUser?.role === 'student' && isPending && (
              <span style={{ padding: '8px 15px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '5px', fontWeight: 'bold' }}>
                Join Request Pending...
              </span>
            )}
            {isMember && !isPresident && (
              <span style={{ padding: '8px 15px', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '5px', fontWeight: 'bold' }}>
                You are a Member
              </span>
            )}
          </div>
        </div>

        {/* Executive Board Directory */}
        <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '15px', width: '100%' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>👔 Executive Board</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            {availableRoles.map(role => {
              let personName = 'Vacant';
              if (role === 'President') {
                personName = club.president?.name || 'Vacant';
              } else {
                const boardMember = club.topBoard?.find(b => b.role === role);
                if (boardMember?.user?.name) personName = boardMember.user.name;
              }
              return (
                <div key={role} style={{ backgroundColor: '#fff', padding: '10px', borderRadius: '5px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                  <strong style={{ display: 'block', color: '#4b5563', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' }}>{role}</strong>
                  <span style={{ color: personName === 'Vacant' ? '#9ca3af' : '#111827', fontWeight: personName === 'Vacant' ? 'normal' : 'bold', fontSize: '0.9rem' }}>
                    {personName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>{club.description}</p>
        <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '5px', marginTop: '15px' }}>
          <strong>Mission:</strong> {club.mission}
        </div>
      </div>

      {/* 2. PUBLIC SECTIONS */}
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

      {/* 3. PRIVATE SECTIONS (Internal Member Hub) */}
      {hasFullAccess ? (
        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <h2 style={{ color: '#10b981', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>Internal Member Hub</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>

            {/* Announcements */}
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginTop: '0' }}>📢 Official Announcements</h4>
              {club.announcements?.filter(a => a.isApproved || canManageAnnouncements || isSupervisor).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No announcements yet.</p>
              ) : (
                club.announcements?.map((ann) => {
                  if (ann.isApproved || canManageAnnouncements || isSupervisor) {
                    return (
                      <div key={ann._id} style={{ padding: '15px', backgroundColor: '#fff', border: '1px solid #e5e7eb', marginBottom: '10px', borderRadius: '6px' }}>
                        {editingAnnId === ann._id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input type="text" className="form-control" value={editAnnData.title} onChange={(e) => setEditAnnData({ ...editAnnData, title: e.target.value })} style={{ margin: 0 }} />
                            <textarea className="form-control" value={editAnnData.content} onChange={(e) => setEditAnnData({ ...editAnnData, content: e.target.value })} style={{ margin: 0, minHeight: '80px' }} />
                            <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                              <button className="btn" style={{ padding: '4px 12px', fontSize: '0.8rem', backgroundColor: '#10b981' }} onClick={() => handleEditAnnouncement(ann._id)}>Save Changes</button>
                              <button className="btn" style={{ padding: '4px 12px', fontSize: '0.8rem', backgroundColor: '#6b7280' }} onClick={() => setEditingAnnId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#111827' }}>{ann.title}</strong>
                                <span style={{ fontSize: '0.9rem', color: '#4b5563', whiteSpace: 'pre-wrap' }}>{ann.content}</span>
                              </div>
                              {canManageAnnouncements && (
                                <div style={{ display: 'flex', gap: '5px', marginLeft: '10px' }}>
                                  <button className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }} onClick={() => {
                                    setEditingAnnId(ann._id);
                                    setEditAnnData({ title: ann.title, content: ann.content });
                                  }}>✏️</button>
                                  <button className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }} onClick={() => handleDeleteAnnouncement(ann._id)}>🗑️</button>
                                </div>
                              )}
                            </div>
                            {!ann.isApproved && (
                              <span style={{ display: 'inline-block', backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '10px' }}>
                                ⏳ Pending Supervisor Approval
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  }
                  return null;
                })
              )}
            </div>

            {/* Active Funding Campaigns */}
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#6d28d9' }}>🤝 Active Funding Campaigns</h4>
                {canManageSponsorships && (
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

            {/* LIVE VOTING BOOTH */}
            {club.elections && club.elections.filter(e => e.isActive || e.isPublished).length > 0 && (
              <div style={{ backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', gridColumn: '1 / -1', marginTop: '15px' }}>
                <h4 style={{ margin: 0, color: '#166534', borderBottom: '2px solid #bbf7d0', paddingBottom: '10px', marginBottom: '15px' }}>🗳️ Official Club Elections</h4>
                <div style={{ display: 'grid', gap: '15px' }}>
                  {club.elections.filter(e => e.isActive || e.isPublished).map((election) => {
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
                        <div style={{ display: 'grid', gap: '10px' }}>
                          {election.candidates.map((c) => {
                            const candidateName = club.members.find(m => m._id === c.user)?.name || 'Unknown User';
                            const votePercent = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(0) : 0;
                            return (
                              <div key={c._id} style={{ border: '1px solid #e5e7eb', padding: '10px', borderRadius: '5px', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  <strong style={{ display: 'block', fontSize: '1rem' }}>{candidateName}</strong>
                                  <span style={{ fontSize: '0.85rem', color: '#6b7280', fontStyle: 'italic' }}>"{c.manifesto}"</span>
                                  {election.isPublished && (
                                    <div style={{ marginTop: '8px' }}>
                                      <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                                        <div style={{ width: `${votePercent}%`, backgroundColor: '#10b981', height: '100%' }}></div>
                                      </div>
                                      <small style={{ fontWeight: 'bold', color: '#166534' }}>{c.voteCount} Votes ({votePercent}%)</small>
                                    </div>
                                  )}
                                </div>
                                {election.isActive && !hasVoted && (
                                  <button className="btn" style={{ backgroundColor: '#10b981', marginLeft: '15px', padding: '8px 20px' }} onClick={() => handleVote(election._id, c._id)}>
                                    Vote
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
        </div>
      )}

      {/* 4. EXECUTIVE ADMIN PANEL (Pres, VP, Secretaries) */}
      {(isPresident || canManageAnnouncements) && (
        <div className="card" style={{ borderLeft: '4px solid #3b82f6', marginTop: '20px' }}>
          <h2 style={{ color: '#3b82f6', marginTop: 0 }}>
            {isPresident ? "President's Control Center" : "Executive Communications"}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: isPresident ? '1fr 1fr' : '1fr', gap: '20px' }}>

            {/* LEFT COLUMN: People Management (ONLY FOR PRES/VP) */}
            {isPresident && (
              <div>
                <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a', marginBottom: '20px' }}>
                  <h4 style={{ color: '#d97706', marginTop: 0 }}>👥 Pending Join Requests</h4>
                  {club.pendingMembers?.length === 0 ? (
                    <p style={{ color: '#b45309', fontSize: '0.9rem' }}>No pending requests.</p>
                  ) : (
                    club.pendingMembers?.map(student => (
                      <div key={student._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px' }}>
                        <span><strong>{student.name}</strong><br /><small>{student.email}</small></span>
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
                  <form onSubmit={handleAssignBoard} style={{ marginBottom: '15px' }}>
                    <select className="form-control" style={{ marginBottom: '10px' }} value={boardData.userId} onChange={(e) => setBoardData({ ...boardData, userId: e.target.value })} required>
                      <option value="">-- Select an Approved Member --</option>
                      {club.members?.map(member => (
                        <option key={member._id} value={member._id}>{member.name}</option>
                      ))}
                    </select>
                    <select className="form-control" value={boardData.role} onChange={(e) => setBoardData({ ...boardData, role: e.target.value })} required style={{ marginBottom: '10px' }}>
                      <option value="">-- Select a Position --</option>
                      {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button type="submit" className="btn" style={{ width: '100%', padding: '8px', backgroundColor: '#374151' }}>Assign Role</button>
                  </form>

                  {club.topBoard?.map((boardMember, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '8px', borderRadius: '5px', marginBottom: '5px', borderLeft: '3px solid #3b82f6' }}>
                      <span><strong>{boardMember.role}:</strong> {boardMember.user?.name}</span>
                      <button className="btn" style={{ padding: '2px 8px', fontSize: '0.8rem', backgroundColor: '#ef4444' }} onClick={() => handleRemoveBoard(boardMember.user?._id)}>X</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RIGHT COLUMN: Communications (FOR PRES, VP, AND SECRETARIES) */}
            {canManageAnnouncements && (
              <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe', height: 'fit-content' }}>
                <h4 style={{ color: '#1e40af', marginTop: 0 }}>📢 Draft New Announcement</h4>
                <form onSubmit={handlePostAnnouncement}>
                  <input type="text" className="form-control" placeholder="Announcement Title" value={announcementData.title} onChange={(e) => setAnnouncementData({ ...announcementData, title: e.target.value })} required style={{ marginBottom: '10px' }} />
                  <textarea className="form-control" placeholder="What do you want to tell your members?" value={announcementData.content} onChange={(e) => setAnnouncementData({ ...announcementData, content: e.target.value })} required style={{ marginBottom: '10px', minHeight: '120px' }} />
                  <button type="submit" className="btn" style={{ width: '100%', backgroundColor: '#3b82f6' }}>Submit for Supervisor Approval</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. SUPERVISOR ADMIN PANEL */}
      {isSupervisor && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>🛡️ Supervisor Control Center</h3>
          <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <h4 style={{ color: '#166534', marginTop: 0, borderBottom: '2px solid #bbf7d0', paddingBottom: '10px', marginBottom: '20px' }}>Electoral Engine</h4>

            {/* 1. ALL-IN-ONE CREATE ELECTION BUILDER */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>➕ Create New Election & Ballot</h5>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>1. Select Position</label>
                <select className="form-control" value={electionData.position} onChange={(e) => setElectionData({ ...electionData, position: e.target.value })}>
                  <option value="">-- Select Position to Elect --</option>
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f9fafb', borderRadius: '5px', border: '1px dashed #d1d5db' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px' }}>2. Build the Ballot</label>
                {electionData.candidates.length > 0 && (
                  <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '15px', color: '#4b5563' }}>
                    {electionData.candidates.map((c, idx) => {
                      const name = club.members?.find(m => m._id === c.candidateUserId)?.name || 'Unknown User';
                      return (
                        <li key={idx} style={{ marginBottom: '5px' }}>
                          <strong>{name}</strong> <em>("{c.manifesto}")</em>
                          <button type="button" onClick={() => handleRemoveTempCandidate(idx, false)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px', fontWeight: 'bold' }}>[X]</button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select className="form-control" value={tempCandidate.candidateUserId} onChange={(e) => setTempCandidate({ ...tempCandidate, candidateUserId: e.target.value })} style={{ margin: 0, flex: 1 }}>
                    <option value="">-- Select Member --</option>
                    {club.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  <input type="text" className="form-control" placeholder="Short Manifesto" value={tempCandidate.manifesto} onChange={(e) => setTempCandidate({ ...tempCandidate, manifesto: e.target.value })} style={{ margin: 0, flex: 2 }} />
                  <button type="button" className="btn" style={{ backgroundColor: '#059669', margin: 0 }} onClick={(e) => handleAddTempCandidate(e, false)}>Add to List</button>
                </div>
              </div>
              <button className="btn" style={{ backgroundColor: '#166534', width: '100%' }} onClick={handleCreateElection}>Initialize Full Election</button>
            </div>

            {/* 2. MANAGE ACTIVE ELECTIONS */}
            <h5 style={{ color: '#166534', marginBottom: '15px', fontSize: '1.1rem' }}>📋 Election Records</h5>
            {club.elections?.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No elections on record.</p>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {club.elections?.map(election => (
                  <div key={election._id} style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    
                    {editingElectionId === election._id ? (
                      <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '5px', border: '1px solid #fde68a' }}>
                        <h6 style={{ margin: '0 0 10px 0', color: '#d97706' }}>✏️ Edit Election Details</h6>
                        <select className="form-control" value={editElectionData.position} onChange={(e) => setEditElectionData({ ...editElectionData, position: e.target.value })} style={{ marginBottom: '10px' }}>
                          <option value="">-- Select Position --</option>
                          {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '10px' }}>
                          {editElectionData.candidates.map((c, idx) => {
                            const name = club.members?.find(m => m._id === (c.candidateUserId || c.user))?.name || 'Unknown User';
                            return (
                              <li key={idx}><strong>{name}</strong> <em>("{c.manifesto}")</em>
                                <button type="button" onClick={() => handleRemoveTempCandidate(idx, true)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '5px' }}>[X]</button>
                              </li>
                            )
                          })}
                        </ul>
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                          <select className="form-control" value={editTempCandidate.candidateUserId} onChange={(e) => setEditTempCandidate({ ...editTempCandidate, candidateUserId: e.target.value })} style={{ margin: 0, flex: 1 }}>
                            <option value="">-- Add Member --</option>
                            {club.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                          </select>
                          <input type="text" className="form-control" placeholder="Manifesto" value={editTempCandidate.manifesto} onChange={(e) => setEditTempCandidate({ ...editTempCandidate, manifesto: e.target.value })} style={{ margin: 0, flex: 2 }} />
                          <button type="button" className="btn" style={{ backgroundColor: '#059669', margin: 0, padding: '5px 10px' }} onClick={(e) => handleAddTempCandidate(e, true)}>+</button>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn" style={{ backgroundColor: '#10b981', flex: 1 }} onClick={() => handleUpdateElection(election._id)}>Save All Changes</button>
                          <button className="btn" style={{ backgroundColor: '#6b7280', flex: 1 }} onClick={() => setEditingElectionId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h5 style={{ margin: 0, fontSize: '1.2rem', color: '#065f46' }}>{election.position}</h5>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn" style={{ backgroundColor: election.isActive ? '#ef4444' : '#10b981', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 'bold' }} onClick={() => handleToggleElection(election._id, !election.isActive, election.isPublished)}>
                              {election.isActive ? '🛑 Close Voting' : '🟢 Open Voting'}
                            </button>
                            <button className="btn" style={{ backgroundColor: election.isPublished ? '#6b7280' : '#8b5cf6', padding: '6px 12px', fontSize: '0.85rem', fontWeight: 'bold' }} onClick={() => handleToggleElection(election._id, false, !election.isPublished)}>
                              {election.isPublished ? 'Hide Results' : '📢 Publish Results'}
                            </button>
                          </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '15px 0' }} />

                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#374151' }}>Live Tally ({election.votedUsers?.length || 0} votes cast)</p>
                        <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px', color: '#4b5563' }}>
                          {election.candidates?.map(c => {
                            const candidateName = club.members?.find(m => m._id === c.user)?.name || 'Unknown User';
                            return (
                              <li key={c._id} style={{ marginBottom: '8px' }}>
                                <span>{candidateName}: <strong style={{ color: '#111827' }}>{c.voteCount} votes</strong></span>
                              </li>
                            );
                          })}
                          {election.candidates?.length === 0 && <li style={{ fontStyle: 'italic', color: '#9ca3af' }}>No candidates added.</li>}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px dashed #e5e7eb', paddingTop: '12px' }}>
                          {!election.isActive && !election.isPublished && election.votedUsers.length === 0 && (
                            <button className="btn" style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => {
                              setEditingElectionId(election._id);
                              setEditElectionData({ position: election.position, candidates: election.candidates.map(c => ({ candidateUserId: c.user, manifesto: c.manifesto })) });
                            }}>
                              ✏️ Edit Election
                            </button>
                          )}
                          <button className="btn" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => handleDeleteElection(election._id)}>
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubDetail;