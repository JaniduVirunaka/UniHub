import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ClubNavigation from '../components/ClubNavigation'; // Adjust path if needed

function ClubElections() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);

  // --- Election States ---
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
      .then(res => fetchClubData())
      .catch(err => alert("Error deleting election."));
  };

  // --- CANDIDATE SORTING & GROUPING LOGIC ---
  let normalMembers = [];
  let excoMembers = [];

  if (club?.members) {
    // 1. Gather the IDs of anyone currently holding an ExCo/Board position
    const boardIds = new Set();
    if (club.president?._id) boardIds.add(club.president._id);

    club.topBoard?.forEach(b => {
      // Handle both populated objects and raw ID strings just in case
      if (b.user?._id) boardIds.add(b.user._id);
      else if (b.user) boardIds.add(b.user);
    });

    // 2. Split the club members into two separate arrays
    club.members.forEach(member => {
      if (boardIds.has(member._id)) {
        excoMembers.push(member);
      } else {
        normalMembers.push(member);
      }
    });

    // 3. Sort both arrays alphabetically by name
    const sortAlphabetically = (a, b) => a.name.localeCompare(b.name);
    normalMembers.sort(sortAlphabetically);
    excoMembers.sort(sortAlphabetically);
  }

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Election Data...</div>;

  // --- ROLES & ACCESS CONTROL ---
  const isSupervisor = currentUser?.role === 'supervisor';
  const isMember = club.members?.some(member => member._id === currentUser?.id);
  const isTopBoard = club.topBoard?.some(b => b.user?._id === currentUser?.id) || club.president?._id === currentUser?.id;
  const hasFullAccess = isSupervisor || isTopBoard || isMember;

  const userFeeRecord = club.feeRecords?.find(record =>
    (record.user?._id || record.user) === currentUser?.id
  );
  const hasPaidFees = (userFeeRecord && ['Paid', 'Exempt'].includes(userFeeRecord.status));
  if (!hasFullAccess) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Access Denied</h2>
        <p>You must be an approved member to access the voting booth.</p>
        <button className="btn" onClick={() => navigate(`/clubs/${id}`)}>Return to Main Hub</button>
      </div>
    );
  }

  return (
    <div className="container">
      {/* HEADER & NAV (Keeps the UI consistent with the Main Page) */}
      <div className="card" style={{ borderTop: '4px solid var(--primary-color)' }}>
        <button className="btn" style={{ backgroundColor: '#6b7280', marginBottom: '20px' }} onClick={() => navigate(`/clubs/${id}`)}>
          ← Back to Main Hub
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
          <h1 style={{ color: 'var(--primary-color)', margin: 0 }}>{club.name} - Voting Booth</h1>
        </div>
        <ClubNavigation club={club} />
      </div>

      {/* --- 1. MEMBER VIEW: LIVE VOTING BOOTH --- */}
      <div className="card" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <h2 style={{ color: '#166534', margin: '0 0 15px 0', borderBottom: '2px solid #bbf7d0', paddingBottom: '10px' }}>🗳️ Official Club Elections</h2>

        {club.elections && club.elections.filter(e => e.isActive || e.isPublished).length > 0 ? (
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
                      const candidateName = club.members?.find(m => m._id === c.user)?.name || 'Unknown User';
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

                          {/* THE NEW RESTRICTED VOTE LOGIC */}
                          {election.isActive && !hasVoted && (
                            hasPaidFees ? (
                              <button className="btn" style={{ backgroundColor: '#10b981', marginLeft: '15px', padding: '8px 20px' }} onClick={() => handleVote(election._id, c._id)}>
                                Vote
                              </button>
                            ) : (
                              <div style={{ marginLeft: '15px', textAlign: 'right' }}>
                                <span style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: 'bold', display: 'block' }}>⚠️ Voting Restricted</span>
                                <small style={{ color: '#6b7280' }}>Requires paid membership</small>
                              </div>
                            )
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
        ) : (
          <p style={{ color: '#6b7280' }}>No active elections at this time.</p>
        )}
      </div>

      {/* --- 2. SUPERVISOR VIEW: ELECTORAL ENGINE --- */}
      {isSupervisor && (
        <div className="card" style={{ marginTop: '30px', borderLeft: '4px solid #111827' }}>
          <h3 style={{ color: '#111827', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>🛡️ Supervisor Electoral Engine</h3>

          {/* Create Election Form */}
          <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px', marginBottom: '30px' }}>
            <h5 style={{ margin: '0 0 15px 0', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>➕ Create New Election</h5>

            <div style={{ marginBottom: '15px' }}>
              <select className="form-control" value={electionData.position} onChange={(e) => setElectionData({ ...electionData, position: e.target.value })}>
                <option value="">-- Select Position to Elect --</option>
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#f9fafb', border: '1px dashed #d1d5db' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px' }}>Build the Ballot (Candidates)</label>
              {electionData.candidates.length > 0 && (
                <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '15px' }}>
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

                  {normalMembers.length > 0 && (
                    <optgroup label="Regular Members">
                      {normalMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </optgroup>
                  )}

                  {excoMembers.length > 0 && (
                    <optgroup label="Current Top Board (ExCo)">
                      {excoMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </optgroup>
                  )}
                </select>
                <input type="text" className="form-control" placeholder="Short Manifesto" value={tempCandidate.manifesto} onChange={(e) => setTempCandidate({ ...tempCandidate, manifesto: e.target.value })} style={{ margin: 0, flex: 2 }} />
                <button type="button" className="btn" style={{ backgroundColor: '#059669', margin: 0 }} onClick={(e) => handleAddTempCandidate(e, false)}>Add</button>
              </div>
            </div>
            <button className="btn" style={{ backgroundColor: '#166534', width: '100%' }} onClick={handleCreateElection}>Initialize Full Election</button>
          </div>

          {/* Manage Active Elections List */}
          <h5 style={{ color: '#166534', marginBottom: '15px' }}>📋 Election Records</h5>
          {club.elections?.length === 0 ? (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No elections on record.</p>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {club.elections?.map(election => (
                <div key={election._id} style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', padding: '15px', borderRadius: '8px' }}>

                  {/* Edit Mode vs Display Mode handled here (kept identical to your previous code) */}
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

                          {normalMembers.length > 0 && (
                            <optgroup label="Regular Members">
                              {normalMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </optgroup>
                          )}

                          {excoMembers.length > 0 && (
                            <optgroup label="Current Top Board (ExCo)">
                              {excoMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                            </optgroup>
                          )}
                        </select>
                        <input type="text" className="form-control" placeholder="Manifesto" value={editTempCandidate.manifesto} onChange={(e) => setEditTempCandidate({ ...editTempCandidate, manifesto: e.target.value })} style={{ margin: 0, flex: 2 }} />
                        <button type="button" className="btn" style={{ backgroundColor: '#059669', margin: 0, padding: '5px 10px' }} onClick={(e) => handleAddTempCandidate(e, true)}>+</button>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn" style={{ backgroundColor: '#10b981', flex: 1 }} onClick={() => handleUpdateElection(election._id)}>Save Changes</button>
                        <button className="btn" style={{ backgroundColor: '#6b7280', flex: 1 }} onClick={() => setEditingElectionId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h5 style={{ margin: 0, fontSize: '1.2rem', color: '#065f46' }}>{election.position}</h5>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn" style={{ backgroundColor: election.isActive ? '#ef4444' : '#10b981', padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleToggleElection(election._id, !election.isActive, election.isPublished)}>
                            {election.isActive ? '🛑 Close Voting' : '🟢 Open Voting'}
                          </button>
                          <button className="btn" style={{ backgroundColor: election.isPublished ? '#6b7280' : '#8b5cf6', padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleToggleElection(election._id, false, !election.isPublished)}>
                            {election.isPublished ? 'Hide Results' : '📢 Publish Results'}
                          </button>
                        </div>
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '15px 0' }} />
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Live Tally ({election.votedUsers?.length || 0} votes)</p>

                      <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px', color: '#4b5563' }}>
                        {election.candidates?.map(c => {
                          const candidateName = club.members?.find(m => m._id === c.user)?.name || 'Unknown User';
                          return <li key={c._id} style={{ marginBottom: '8px' }}><span>{candidateName}: <strong style={{ color: '#111827' }}>{c.voteCount} votes</strong></span></li>;
                        })}
                      </ul>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px dashed #e5e7eb', paddingTop: '12px' }}>
                        {!election.isActive && !election.isPublished && election.votedUsers.length === 0 && (
                          <button className="btn" style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => {
                            setEditingElectionId(election._id);
                            setEditElectionData({ position: election.position, candidates: election.candidates.map(c => ({ candidateUserId: c.user, manifesto: c.manifesto })) });
                          }}>✏️ Edit</button>
                        )}
                        <button className="btn" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '4px 12px', fontSize: '0.75rem' }} onClick={() => handleDeleteElection(election._id)}>🗑️ Delete</button>
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