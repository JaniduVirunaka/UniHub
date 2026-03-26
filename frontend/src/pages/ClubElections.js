import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ClubNavigation from '../components/ClubNavigation'; 

function ClubElections() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);

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

  useEffect(() => { fetchClubData(); }, [id]);

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data)).catch(err => console.log(err));
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
      }).catch(err => alert(err.response?.data?.message || "Error creating election."));
  };

  const handleUpdateElection = (electionId) => {
    if (!editElectionData.position) return alert("Please select a position.");
    if (editTempCandidate.candidateUserId || editTempCandidate.manifesto) {
      const proceed = window.confirm("Hold on! You entered candidate details but didn't click the '+' button. Do you want to save changes WITHOUT adding them?");
      if (!proceed) return;
    }
    axios.put(`http://localhost:5000/api/clubs/${id}/elections/${electionId}/edit`, { ...editElectionData, supervisorId: currentUser?.id })
      .then(res => {
        alert(res.data.message); setEditingElectionId(null); setEditTempCandidate({ candidateUserId: '', manifesto: '' }); fetchClubData();
      }).catch(err => alert(err.response?.data?.message || "Error updating election."));
  };

  const handleToggleElection = (electionId, isActive, isPublished) => {
    if (!window.confirm("Are you sure you want to change the election status?")) return;
    axios.put(`http://localhost:5000/api/clubs/${id}/elections/${electionId}/status`, { isActive, isPublished, supervisorId: currentUser?.id })
      .then(res => fetchClubData()).catch(err => alert("Error updating election status."));
  };

  const handleVote = (electionId, candidateId) => {
    if (!window.confirm("Are you sure? Your vote is final and anonymous.")) return;
    axios.post(`http://localhost:5000/api/clubs/${id}/elections/${electionId}/vote`, { userId: currentUser?.id, candidateId })
      .then(res => { alert(res.data.message); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || "Error casting vote."));
  };

  const handleDeleteElection = (electionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this election record?")) return;
    axios.delete(`http://localhost:5000/api/clubs/${id}/elections/${electionId}`, { data: { supervisorId: currentUser?.id } })
      .then(res => fetchClubData()).catch(err => alert("Error deleting election."));
  };

  let normalMembers = [];
  let excoMembers = [];

  if (club?.members) {
    const boardIds = new Set();
    if (club.president?._id) boardIds.add(club.president._id);
    club.topBoard?.forEach(b => { if (b.user?._id) boardIds.add(b.user._id); else if (b.user) boardIds.add(b.user); });

    club.members.forEach(member => {
      if (boardIds.has(member._id)) excoMembers.push(member);
      else normalMembers.push(member);
    });

    const sortAlphabetically = (a, b) => a.name.localeCompare(b.name);
    normalMembers.sort(sortAlphabetically);
    excoMembers.sort(sortAlphabetically);
  }

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Election Data...</div>;

  const isSupervisor = currentUser?.role === 'supervisor';
  const isMember = club.members?.some(member => member._id === currentUser?.id);
  const isTopBoard = club.topBoard?.some(b => b.user?._id === currentUser?.id) || club.president?._id === currentUser?.id;
  const hasFullAccess = isSupervisor || isTopBoard || isMember;

  const userFeeRecord = club.feeRecords?.find(record => (record.user?._id || record.user) === currentUser?.id);
  const hasPaidFees = (userFeeRecord && ['Paid', 'Exempt'].includes(userFeeRecord.status));

  if (!hasFullAccess) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Access Denied</h2><p>You must be an approved member to access the voting booth.</p>
        <button className="btn" onClick={() => navigate(`/clubs/${id}`)}>Return to Main Hub</button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
        <button className="btn btn-outline" style={{ marginBottom: '20px' }} onClick={() => navigate(`/clubs/${id}`)}>
          ← Back to Main Hub
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>{club.name} - Voting Booth</h1>
        </div>
        <ClubNavigation club={club} />
      </div>

      {/* --- 1. MEMBER VIEW: LIVE VOTING BOOTH --- */}
      <div className="card" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success)' }}>
        <h2 style={{ color: 'var(--success)', margin: '0 0 20px 0', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', paddingBottom: '10px' }}>🗳️ Official Club Elections</h2>

        {club.elections && club.elections.filter(e => e.isActive || e.isPublished).length > 0 ? (
          <div style={{ display: 'grid', gap: '15px' }}>
            {club.elections.filter(e => e.isActive || e.isPublished).map((election) => {
              const hasVoted = election.votedUsers.includes(currentUser?.id);
              const totalVotes = election.votedUsers.length;

              return (
                <div key={election._id} style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <h5 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>{election.position}</h5>
                    <span className="badge" style={{ backgroundColor: election.isActive ? 'var(--success-bg)' : 'var(--bg-color)', color: election.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                      {election.isPublished ? 'Results Published' : election.isActive ? 'Voting Open' : 'Voting Closed'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gap: '10px' }}>
                    {election.candidates.map((c) => {
                      const candidateName = club.members?.find(m => m._id === c.user)?.name || 'Unknown User';
                      const votePercent = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(0) : 0;

                      return (
                        <div key={c._id} className="vote-card-mobile" style={{ border: '1px solid var(--border-color)', padding: '15px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px' }}>
                          <div style={{ flex: 1, width: '100%' }}>
                            <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>{candidateName}</strong>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{c.manifesto}"</span>
                            {election.isPublished && (
                              <div style={{ marginTop: '12px' }}>
                                <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '99px', height: '8px', overflow: 'hidden', marginBottom: '4px' }}>
                                  <div style={{ width: `${votePercent}%`, backgroundColor: 'var(--success)', height: '100%' }}></div>
                                </div>
                                <small style={{ fontWeight: 'bold', color: 'var(--success)' }}>{c.voteCount} Votes ({votePercent}%)</small>
                              </div>
                            )}
                          </div>

                          {election.isActive && !hasVoted && (
                            hasPaidFees ? (
                              <button className="btn btn-success" style={{ padding: '8px 20px', width: '100%' }} onClick={() => handleVote(election._id, c._id)}>
                                Vote
                              </button>
                            ) : (
                              <div style={{ textAlign: 'center', width: '100%' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 'bold', display: 'block' }}>⚠️ Voting Restricted</span>
                                <small style={{ color: 'var(--text-muted)' }}>Requires paid membership</small>
                              </div>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {election.isActive && hasVoted && (
                    <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--success-bg)', color: 'var(--success)', textAlign: 'center', borderRadius: 'var(--radius-md)', fontWeight: 'bold' }}>
                      ✅ Your vote has been securely recorded.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: 0 }}>No active elections at this time.</p>
        )}
      </div>

      {/* --- 2. SUPERVISOR VIEW: ELECTORAL ENGINE --- */}
      {isSupervisor && (
        <div className="card" style={{ marginTop: '30px', borderLeft: '4px solid var(--text-main)' }}>
          <h3 style={{ color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginTop: 0 }}>🛡️ Supervisor Electoral Engine</h3>

          <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '30px', boxShadow: 'var(--shadow-sm)' }}>
            <h5 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', fontSize: '1.1rem' }}>➕ Create New Election & Ballot</h5>

            <div style={{ marginBottom: '15px' }}>
              <select className="form-control" value={electionData.position} onChange={(e) => setElectionData({ ...electionData, position: e.target.value })}>
                <option value="">-- Select Position to Elect --</option>
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-secondary)' }}>Build the Ballot (Candidates)</label>
              {electionData.candidates.length > 0 && (
                <ul style={{ paddingLeft: '20px', fontSize: '0.95rem', marginBottom: '15px', color: 'var(--text-main)' }}>
                  {electionData.candidates.map((c, idx) => {
                    const name = club.members?.find(m => m._id === c.candidateUserId)?.name || 'Unknown User';
                    return (
                      <li key={idx} style={{ marginBottom: '8px' }}>
                        <strong>{name}</strong> <em style={{ color: 'var(--text-secondary)' }}>("{c.manifesto}")</em>
                        <button type="button" onClick={() => handleRemoveTempCandidate(idx, false)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px', fontWeight: 'bold' }}>[X]</button>
                      </li>
                    )
                  })}
                </ul>
              )}
              
              {/* THE FIX: Added .flex-mobile-stack to fix squished form inputs */}
              <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                <select className="form-control" value={tempCandidate.candidateUserId} onChange={(e) => setTempCandidate({ ...tempCandidate, candidateUserId: e.target.value })} style={{ margin: 0, flex: 1 }}>
                  <option value="">-- Select Member --</option>
                  {normalMembers.length > 0 && <optgroup label="Regular Members">{normalMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}</optgroup>}
                  {excoMembers.length > 0 && <optgroup label="Current Top Board">{excoMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}</optgroup>}
                </select>
                <input type="text" className="form-control" placeholder="Short Manifesto" value={tempCandidate.manifesto} onChange={(e) => setTempCandidate({ ...tempCandidate, manifesto: e.target.value })} style={{ margin: 0, flex: 2 }} />
                <button type="button" className="btn btn-outline" style={{ margin: 0, backgroundColor: 'var(--surface-color)' }} onClick={(e) => handleAddTempCandidate(e, false)}>Add</button>
              </div>
            </div>
            <button className="btn btn-success" style={{ width: '100%' }} onClick={handleCreateElection}>Initialize Full Election</button>
          </div>

          <h5 style={{ color: 'var(--text-main)', marginBottom: '15px', fontSize: '1.1rem' }}>📋 Election Records</h5>
          {club.elections?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No elections on record.</p>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {club.elections?.map(election => (
                <div key={election._id} className="card-hover" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>

                  {editingElectionId === election._id ? (
                    <div style={{ backgroundColor: 'var(--warning-bg)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning)' }}>
                      <h6 style={{ margin: '0 0 15px 0', color: 'var(--warning)', fontSize: '1.1rem' }}>✏️ Edit Election Details</h6>
                      <select className="form-control" value={editElectionData.position} onChange={(e) => setEditElectionData({ ...editElectionData, position: e.target.value })} style={{ marginBottom: '15px' }}>
                        <option value="">-- Select Position --</option>
                        {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      
                      <ul style={{ paddingLeft: '20px', fontSize: '0.95rem', marginBottom: '15px', color: 'var(--text-main)' }}>
                        {editElectionData.candidates.map((c, idx) => {
                          const name = club.members?.find(m => m._id === (c.candidateUserId || c.user))?.name || 'Unknown User';
                          return (
                            <li key={idx} style={{ marginBottom: '8px' }}>
                              <strong>{name}</strong> <em style={{ color: 'var(--text-secondary)' }}>("{c.manifesto}")</em>
                              <button type="button" onClick={() => handleRemoveTempCandidate(idx, true)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px' }}>[X]</button>
                            </li>
                          )
                        })}
                      </ul>
                      
                      <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <select className="form-control" value={editTempCandidate.candidateUserId} onChange={(e) => setEditTempCandidate({ ...editTempCandidate, candidateUserId: e.target.value })} style={{ margin: 0, flex: 1 }}>
                          <option value="">-- Add Member --</option>
                          {normalMembers.length > 0 && <optgroup label="Regular Members">{normalMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}</optgroup>}
                          {excoMembers.length > 0 && <optgroup label="Current Top Board">{excoMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}</optgroup>}
                        </select>
                        <input type="text" className="form-control" placeholder="Manifesto" value={editTempCandidate.manifesto} onChange={(e) => setEditTempCandidate({ ...editTempCandidate, manifesto: e.target.value })} style={{ margin: 0, flex: 2 }} />
                        <button type="button" className="btn btn-outline" style={{ margin: 0, padding: '8px 15px', backgroundColor: 'var(--surface-color)' }} onClick={(e) => handleAddTempCandidate(e, true)}>+</button>
                      </div>
                      
                      <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleUpdateElection(election._id)}>Save All Changes</button>
                        <button className="btn btn-outline" style={{ flex: 1, backgroundColor: 'var(--surface-color)' }} onClick={() => setEditingElectionId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <h5 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-main)' }}>{election.position}</h5>
                        <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                          <button className={election.isActive ? "btn btn-danger" : "btn btn-success"} style={{ padding: '8px 15px', fontSize: '0.85rem' }} onClick={() => handleToggleElection(election._id, !election.isActive, election.isPublished)}>
                            {election.isActive ? '🛑 Close Voting' : '🟢 Open Voting'}
                          </button>
                          <button className="btn btn-outline" style={{ padding: '8px 15px', fontSize: '0.85rem', backgroundColor: 'var(--surface-color)' }} onClick={() => handleToggleElection(election._id, false, !election.isPublished)}>
                            {election.isPublished ? 'Hide Results' : '📢 Publish Results'}
                          </button>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Live Tally ({election.votedUsers?.length || 0} votes cast)</p>

                      <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px', color: 'var(--text-main)' }}>
                        {election.candidates?.map(c => {
                          const candidateName = club.members?.find(m => m._id === c.user)?.name || 'Unknown User';
                          return <li key={c._id} style={{ marginBottom: '8px', fontSize: '1.05rem' }}><span>{candidateName}: <strong>{c.voteCount} votes</strong></span></li>;
                        })}
                        {election.candidates?.length === 0 && <li style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No candidates added.</li>}
                      </ul>

                      <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '15px' }}>
                        {!election.isActive && !election.isPublished && election.votedUsers.length === 0 && (
                          <button className="btn" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', padding: '6px 15px', fontSize: '0.85rem' }} onClick={() => {
                            setEditingElectionId(election._id);
                            setEditElectionData({ position: election.position, candidates: election.candidates.map(c => ({ candidateUserId: c.user, manifesto: c.manifesto })) });
                          }}>✏️ Edit Election</button>
                        )}
                        <button className="btn btn-danger" style={{ padding: '6px 15px', fontSize: '0.85rem' }} onClick={() => handleDeleteElection(election._id)}>🗑️ Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ClubElections;