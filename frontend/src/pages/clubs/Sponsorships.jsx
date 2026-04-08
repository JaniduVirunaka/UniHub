import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import ClubNavigation from '../../components/ClubNavigation';

function Sponsorships() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  
  //States for creating new proposals and pledges
  const [proposalData, setProposalData] = useState({ title: '', description: '', targetAmount: '', proposalDocumentUrl: '' });
  const [pledgeData, setPledgeData] = useState({ companyName: '', contactEmail: '', amount: '', message: '' });
  const [activePledgeForm, setActivePledgeForm] = useState(null);

  const [editingProposalId, setEditingProposalId] = useState(null);
  const [editProposalData, setEditProposalData] = useState({ title: '', description: '', targetAmount: '', proposalDocumentUrl: '', isActive: true });

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchClubData(); }, [id]);

  const fetchClubData = () => {
    api.get(`/clubs/${id}`)
      .then(res => setClub(res.data)).catch(err => console.error(err));
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Corporate Portal...</div>;

  //---RBAC---
  const isSupervisor = currentUser?.role === 'supervisor';
  const isPresident = club.president?._id === currentUser?.id;
  const allowedSponsorshipRoles = ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'];
  const canManageSponsorships = isPresident || isSupervisor || club.topBoard?.some(b => b.user?._id === currentUser?.id && allowedSponsorshipRoles.includes(b.role));

  //-----Proposal management actions-----
  const handlePublishProposal = (e) => {
    e.preventDefault();
    api.post(`/clubs/${id}/proposals`, { ...proposalData, userId: currentUser?.id })
      .then(res => {
        alert(res.data.message);
        setProposalData({ title: '', description: '', targetAmount: '', proposalDocumentUrl: '' }); 
        fetchClubData(); 
      }).catch(err => alert(err.response?.data?.message || "Error publishing proposal."));
  };

  const handleUpdateProposal = (proposalId) => {
    if (!editProposalData.title || !editProposalData.targetAmount) return alert("Title and Target Amount are required.");
    api.put(`/clubs/${id}/proposals/${proposalId}/edit`, { ...editProposalData, userId: currentUser?.id })
      .then(res => { alert(res.data.message || "Proposal updated successfully!"); setEditingProposalId(null); fetchClubData(); })
      .catch(err => alert("Error updating proposal."));
  };

  const handleDeleteProposal = (proposalId) => {
    if (!window.confirm("Are you sure you want to permanently delete this proposal and all associated pledges?")) return;
    api.delete(`/clubs/${id}/proposals/${proposalId}`, { data: { userId: currentUser?.id } })
      .then(res => fetchClubData()).catch(err => alert("Error deleting proposal."));
  };

  //-------Pledge actions (public accessible)-------
  const handleSubmitPledge = (e, proposalId) => {
    e.preventDefault();
    api.post(`/clubs/${id}/proposals/${proposalId}/pledge`, pledgeData)
      .then(res => {
        alert(res.data.message); setPledgeData({ companyName: '', contactEmail: '', amount: '', message: '' }); setActivePledgeForm(null); fetchClubData();
      }).catch(err => alert("Error submitting pledge."));
  };

  const handlePledgeStatus = (proposalId, pledgeId, status) => {
    api.put(`/clubs/${id}/proposals/${proposalId}/pledge/${pledgeId}`, { status, userId: currentUser?.id })
      .then(res => fetchClubData()).catch(err => alert("Error updating pledge."));
  };

  return (
    <div className="container">
      <button className="btn btn-outline" style={{ marginBottom: '20px', backgroundColor: 'var(--surface-color)' }} onClick={() => navigate(`/clubs/${id}`)}>
        &larr; Back to {club.name} Hub
      </button>

      {/* HEADER */}
      <div className="card" style={{ borderTop: '4px solid var(--primary-color)', textAlign: 'center', backgroundColor: 'var(--primary-light)' }}>
        <h1 style={{ color: 'var(--primary-color)', margin: '0 0 10px 0' }}>🏢 Corporate Partnerships</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Partner with <strong style={{ color: 'var(--text-main)' }}>{club.name}</strong> to build the future. Review our active initiatives below and submit a corporate pledge to sponsor our students.
        </p>
      </div>
      <ClubNavigation club={club} />

      <div className={canManageSponsorships ? "dashboard-grid-split" : ""} style={{ display: canManageSponsorships ? '' : 'grid', gap: '30px' }}>
        
       {/* LEFT/MAIN COLUMN: Public Proposals */}
        <div>
          <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-main)', margin: 0 }}>Active Funding Initiatives</h3>
          </div>
          
          {club.proposals?.filter(p => p.isActive || canManageSponsorships).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: 'var(--bg-color)', border: '1px dashed var(--border-color)' }}>
              <h4 style={{ color: 'var(--text-muted)' }}>No active proposals at this time.</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Please check back later for new partnership opportunities!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {club.proposals?.filter(p => p.isActive || canManageSponsorships).map(proposal => {
                
                //Dynamic math
                const totalRaised = proposal.pledges?.filter(p => p.status === 'Accepted').reduce((sum, p) => sum + p.amount, 0) || 0;
                const percent = Math.min((totalRaised / proposal.targetAmount) * 100, 100).toFixed(0);

                return (
                  <div key={proposal._id} className="card card-hover" style={{ border: '1px solid var(--border-color)', marginBottom: 0, opacity: proposal.isActive ? 1 : 0.6 }}>
                    
                    {/* --- EDIT MODE UI --- */}
                    {editingProposalId === proposal._id ? (
                      <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary-color)' }}>
                        <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0' }}>✏️ Edit Proposal</h4>
                        <input type="text" className="form-control" value={editProposalData.title} onChange={(e) => setEditProposalData({...editProposalData, title: e.target.value})} style={{ marginBottom: '10px' }}/>
                        <textarea className="form-control" value={editProposalData.description} onChange={(e) => setEditProposalData({...editProposalData, description: e.target.value})} style={{ marginBottom: '10px', minHeight: '80px' }}/>
                        
                        <div className="flex-mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <input type="number" className="form-control" placeholder="Target (Rs.)" value={editProposalData.targetAmount} onChange={(e) => setEditProposalData({...editProposalData, targetAmount: e.target.value})} style={{ margin: 0 }}/>
                          <input type="text" className="form-control" placeholder="Document URL" value={editProposalData.proposalDocumentUrl} onChange={(e) => setEditProposalData({...editProposalData, proposalDocumentUrl: e.target.value})} style={{ margin: 0 }}/>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                          <input type="checkbox" id={`active-${proposal._id}`} checked={editProposalData.isActive} onChange={(e) => setEditProposalData({...editProposalData, isActive: e.target.checked})} style={{ width: '18px', height: '18px' }}/>
                          <label htmlFor={`active-${proposal._id}`} style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Campaign is Active (Visible to Public)</label>
                        </div>

                        <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn btn-success" style={{ flex: 1 }} onClick={() => handleUpdateProposal(proposal._id)}>Save Changes</button>
                          <button className="btn btn-outline" style={{ flex: 1, backgroundColor: 'var(--surface-color)' }} onClick={() => setEditingProposalId(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      /* --- DISPLAY MODE UI --- */
                      <>
                        <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '1.4rem' }}>{proposal.title}</h4>
                            {!proposal.isActive && <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>Closed / Inactive</span>}
                          </div>
                          
                          <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                            {proposal.proposalDocumentUrl && (
                              <a href={proposal.proposalDocumentUrl} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                📄 View PDF
                              </a>
                            )}
                            
                            {/* Admin Edit/Delete Controls */}
                            {canManageSponsorships && (
                              <div className="flex-mobile-stack" style={{ display: 'flex', gap: '5px' }}>
                                <button className="btn btn-edit" style={{ padding: '6px 10px', fontSize: '0.85rem', backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', borderColor: 'transparent' }} onClick={() => {
                                  setEditingProposalId(proposal._id);
                                  setEditProposalData({ title: proposal.title, description: proposal.description, targetAmount: proposal.targetAmount, proposalDocumentUrl: proposal.proposalDocumentUrl || '', isActive: proposal.isActive });
                                }}>✏️</button>
                                <button className="btn btn-danger" style={{ padding: '6px 10px', fontSize: '0.85rem' }} onClick={() => handleDeleteProposal(proposal._id)}>🗑️</button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p style={{ fontSize: '1rem', margin: '15px 0', color: 'var(--text-secondary)', lineHeight: '1.6' }}>{proposal.description}</p>
                        
                        {/* Progress Bar */}
                        <div style={{ backgroundColor: 'var(--bg-color)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--success)' }}>Raised: Rs. {totalRaised.toLocaleString()}</span>
                            <span style={{ color: 'var(--text-muted)' }}>Goal: Rs. {proposal.targetAmount.toLocaleString()}</span>
                          </div>
                          <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '99px', height: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, backgroundColor: percent >= 100 ? 'var(--success)' : 'var(--primary-color)', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
                          </div>
                        </div>

                        {/* Pledge Form Toggle */}
                        {activePledgeForm === proposal._id ? (
                          <form onSubmit={(e) => handleSubmitPledge(e, proposal._id)} style={{ backgroundColor: 'var(--surface-color)', padding: '20px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                            <h5 style={{ margin: '0 0 15px 0', color: 'var(--primary-color)' }}>🤝 Submit Corporate Pledge</h5>
                            <div className="flex-mobile-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                              <input type="text" className="form-control" placeholder="Company Name" required onChange={(e) => setPledgeData({...pledgeData, companyName: e.target.value})} style={{ margin: 0 }}/>
                              <input type="email" className="form-control" placeholder="Contact Email" required onChange={(e) => setPledgeData({...pledgeData, contactEmail: e.target.value})} style={{ margin: 0 }}/>
                            </div>
                            <input type="number" className="form-control" placeholder="Pledge Amount (Rs.)" required onChange={(e) => setPledgeData({...pledgeData, amount: e.target.value})} style={{ marginBottom: '10px' }}/>
                            <textarea className="form-control" placeholder="Optional Message or Conditions" onChange={(e) => setPledgeData({...pledgeData, message: e.target.value})} style={{ marginBottom: '15px' }}/>
                            
                            <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                              <button type="submit" className="btn" style={{ flex: 2 }}>Submit Official Offer</button>
                              <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActivePledgeForm(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          proposal.isActive && (
                            <button className="btn" style={{ width: '100%', padding: '12px', fontSize: '1.05rem' }} onClick={() => setActivePledgeForm(proposal._id)}>
                              Sponsor This Initiative
                            </button>
                          )
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Top Board CRM */}
        {canManageSponsorships && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Publish Form */}
            <div className="card" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', marginBottom: 0 }}>
              <h4 style={{ color: 'var(--text-main)', marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                📢 Publish Proposal
              </h4>
              <form onSubmit={handlePublishProposal}>
                <input type="text" className="form-control" placeholder="Proposal Title" required onChange={(e) => setProposalData({...proposalData, title: e.target.value})} style={{ marginBottom: '10px' }}/>
                <textarea className="form-control" placeholder="Pitch your initiative..." required onChange={(e) => setProposalData({...proposalData, description: e.target.value})} style={{ marginBottom: '10px', minHeight: '100px' }}/>
                <input type="number" className="form-control" placeholder="Target Amount (Rs.)" required onChange={(e) => setProposalData({...proposalData, targetAmount: e.target.value})} style={{ marginBottom: '10px' }}/>
                <input type="text" className="form-control" placeholder="Link to PDF (Optional)" onChange={(e) => setProposalData({...proposalData, proposalDocumentUrl: e.target.value})} style={{ marginBottom: '15px' }}/>
                <button type="submit" className="btn" style={{ width: '100%' }}>Publish to Portal</button>
              </form>
            </div>

            {/* Pledge Manager */}
            <div className="card" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', marginBottom: 0 }}>
              <h4 style={{ color: 'var(--text-main)', marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                📥 Inbox: Corporate Pledges
              </h4>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                {club.proposals?.map(prop => (
                  <div key={prop._id}>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '8px' }}>{prop.title}</strong>
                    
                    {prop.pledges.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No pledges yet.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '10px' }}>
                        {prop.pledges.map(pledge => (
                          <div key={pledge._id} style={{ border: '1px solid var(--border-color)', padding: '15px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--surface-color)', boxShadow: 'var(--shadow-sm)' }}>
                            <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                              <strong style={{ color: 'var(--text-main)' }}>{pledge.companyName}</strong>
                              <span className="badge" style={{ 
                                backgroundColor: pledge.status === 'Accepted' ? 'var(--success-bg)' : pledge.status === 'Rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                                color: pledge.status === 'Accepted' ? 'var(--success)' : pledge.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)' 
                              }}>
                                {pledge.status}
                              </span>
                            </div>
                            
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.95rem', color: 'var(--success)', fontWeight: 'bold' }}>Offered: Rs. {pledge.amount.toLocaleString()}</p>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>📧 {pledge.contactEmail}</p>
                            {pledge.message && <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic', backgroundColor: 'var(--bg-color)', padding: '8px', borderLeft: '3px solid var(--border-color)' }}>"{pledge.message}"</p>}
                            
                            {/* Action Buttons */}
                            {pledge.status === 'Pending' && (
                              <div className="flex-mobile-stack" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <button className="btn btn-success" style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }} onClick={() => handlePledgeStatus(prop._id, pledge._id, 'Accepted')}>Accept</button>
                                <button className="btn btn-danger" style={{ flex: 1, padding: '6px', fontSize: '0.85rem' }} onClick={() => handlePledgeStatus(prop._id, pledge._id, 'Rejected')}>Reject</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default Sponsorships;