import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function Sponsorships() {
  const { id } = useParams(); // The Club ID
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  
  // States for our forms
  const [proposalData, setProposalData] = useState({ title: '', description: '', targetAmount: '', proposalDocumentUrl: '' });
  const [pledgeData, setPledgeData] = useState({ companyName: '', contactEmail: '', amount: '', message: '' });
  const [activePledgeForm, setActivePledgeForm] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClubData();
  }, [id]);

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Corporate Portal...</div>;

  // --- STRICT ACCESS CONTROL (Execs & Treasury Only) ---
  const isPresident = club.president?._id === currentUser?.id;
  const allowedSponsorshipRoles = ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'];
  const canManageSponsorships = isPresident || club.topBoard?.some(b => b.user?._id === currentUser?.id && allowedSponsorshipRoles.includes(b.role));

  // --- ACTIONS ---
  const handlePublishProposal = (e) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/clubs/${id}/proposals`, { ...proposalData, userId: currentUser?.id })
      .then(res => {
        alert(res.data.message);
        setProposalData({ title: '', description: '', targetAmount: '', proposalDocumentUrl: '' }); 
        fetchClubData(); 
      })
      .catch(err => alert(err.response?.data?.message || "Error publishing proposal."));
  };

  const handleSubmitPledge = (e, proposalId) => {
    e.preventDefault();
    axios.post(`http://localhost:5000/api/clubs/${id}/proposals/${proposalId}/pledge`, pledgeData)
      .then(res => {
        alert(res.data.message);
        setPledgeData({ companyName: '', contactEmail: '', amount: '', message: '' });
        setActivePledgeForm(null); 
        fetchClubData();
      })
      .catch(err => alert("Error submitting pledge."));
  };

  const handlePledgeStatus = (proposalId, pledgeId, status) => {
    axios.put(`http://localhost:5000/api/clubs/${id}/proposals/${proposalId}/pledge/${pledgeId}`, { status, userId: currentUser?.id })
      .then(res => fetchClubData())
      .catch(err => alert("Error updating pledge."));
  };

  return (
    <div className="container">
      <button className="btn" style={{ backgroundColor: '#6b7280', marginBottom: '20px' }} onClick={() => navigate(`/clubs/${id}`)}>
        &larr; Back to {club.name} Hub
      </button>

      {/* HEADER */}
      <div className="card" style={{ borderTop: '4px solid #8b5cf6', textAlign: 'center', backgroundColor: '#faf5ff' }}>
        <h1 style={{ color: '#7e22ce', margin: '0 0 10px 0' }}>🏢 Corporate Partnerships</h1>
        <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto' }}>
          Partner with <strong>{club.name}</strong> to build the future. Review our active initiatives below and submit a corporate pledge to sponsor our students.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: canManageSponsorships ? '2fr 1fr' : '1fr', gap: '30px' }}>
        
        {/* LEFT/MAIN COLUMN: Public Proposals */}
        <div>
          <h3 style={{ color: '#6d28d9', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginTop: 0 }}>Active Funding Initiatives</h3>
          
          {club.proposals?.filter(p => p.isActive).length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h4 style={{ color: '#9ca3af' }}>No active proposals at this time.</h4>
              <p style={{ color: '#6b7280' }}>Please check back later for new partnership opportunities!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {club.proposals?.filter(p => p.isActive).map(proposal => {
                // Calculate funding progress
                const totalRaised = proposal.pledges?.filter(p => p.status === 'Accepted').reduce((sum, p) => sum + p.amount, 0) || 0;
                const percent = Math.min((totalRaised / proposal.targetAmount) * 100, 100).toFixed(0);

                return (
                  <div key={proposal._id} className="card" style={{ border: '1px solid #d8b4fe', marginBottom: 0, boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#6d28d9', fontSize: '1.4rem' }}>{proposal.title}</h4>
                      {proposal.proposalDocumentUrl && (
                        <a href={proposal.proposalDocumentUrl} target="_blank" rel="noreferrer" className="btn" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '5px 12px', fontSize: '0.85rem', textDecoration: 'none' }}>
                          📄 View PDF
                        </a>
                      )}
                    </div>
                    
                    <p style={{ fontSize: '1rem', marginBottom: '20px', color: '#4b5563', lineHeight: '1.5' }}>{proposal.description}</p>
                    
                    {/* Progress Bar */}
                    <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px' }}>
                        <span style={{ color: '#10b981' }}>Raised: Rs. {totalRaised.toLocaleString()}</span>
                        <span style={{ color: '#6b7280' }}>Goal: Rs. {proposal.targetAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '6px', height: '12px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, backgroundColor: percent >= 100 ? '#10b981' : '#8b5cf6', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
                      </div>
                    </div>

                    {/* Pledge Form Toggle */}
                    {activePledgeForm === proposal._id ? (
                      <form onSubmit={(e) => handleSubmitPledge(e, proposal._id)} style={{ backgroundColor: '#faf5ff', padding: '20px', border: '1px solid #d8b4fe', borderRadius: '8px' }}>
                        <h5 style={{ margin: '0 0 15px 0', color: '#7e22ce' }}>🤝 Submit Corporate Pledge</h5>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                          <input type="text" className="form-control" placeholder="Company Name" required onChange={(e) => setPledgeData({...pledgeData, companyName: e.target.value})} style={{ margin: 0 }}/>
                          <input type="email" className="form-control" placeholder="Contact Email" required onChange={(e) => setPledgeData({...pledgeData, contactEmail: e.target.value})} style={{ margin: 0 }}/>
                        </div>
                        <input type="number" className="form-control" placeholder="Pledge Amount (Rs.)" required onChange={(e) => setPledgeData({...pledgeData, amount: e.target.value})} style={{ marginBottom: '10px' }}/>
                        <textarea className="form-control" placeholder="Optional Message or Conditions" onChange={(e) => setPledgeData({...pledgeData, message: e.target.value})} style={{ marginBottom: '15px' }}/>
                        
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="submit" className="btn" style={{ flex: 2, backgroundColor: '#8b5cf6', padding: '10px', fontSize: '1rem' }}>Submit Official Offer</button>
                          <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#9ca3af', padding: '10px' }} onClick={() => setActivePledgeForm(null)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <button className="btn" style={{ width: '100%', backgroundColor: '#8b5cf6', padding: '12px', fontSize: '1.05rem', fontWeight: 'bold' }} onClick={() => setActivePledgeForm(proposal._id)}>
                        Sponsor This Initiative
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Top Board CRM (Hidden from Public) */}
        {canManageSponsorships && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Publish Form */}
            <div className="card" style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: 0 }}>
              <h4 style={{ color: '#0369a1', marginTop: 0, borderBottom: '2px solid #bae6fd', paddingBottom: '10px', marginBottom: '15px' }}>
                📢 Publish Proposal
              </h4>
              <form onSubmit={handlePublishProposal}>
                <input type="text" className="form-control" placeholder="Proposal Title" required onChange={(e) => setProposalData({...proposalData, title: e.target.value})} style={{ marginBottom: '10px' }}/>
                <textarea className="form-control" placeholder="Pitch your initiative..." required onChange={(e) => setProposalData({...proposalData, description: e.target.value})} style={{ marginBottom: '10px', minHeight: '100px' }}/>
                <input type="number" className="form-control" placeholder="Target Amount (Rs.)" required onChange={(e) => setProposalData({...proposalData, targetAmount: e.target.value})} style={{ marginBottom: '10px' }}/>
                <input type="text" className="form-control" placeholder="Link to PDF (Optional)" onChange={(e) => setProposalData({...proposalData, proposalDocumentUrl: e.target.value})} style={{ marginBottom: '15px' }}/>
                <button type="submit" className="btn" style={{ width: '100%', backgroundColor: '#0284c7', padding: '10px' }}>Publish to Portal</button>
              </form>
            </div>

            {/* Pledge Manager */}
            <div className="card" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', marginBottom: 0 }}>
              <h4 style={{ color: '#374151', marginTop: 0, borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '15px' }}>
                📥 Inbox: Corporate Pledges
              </h4>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                {club.proposals?.map(prop => (
                  <div key={prop._id}>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#6d28d9', marginBottom: '8px' }}>{prop.title}</strong>
                    
                    {prop.pledges.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>No pledges yet.</p>
                    ) : (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {prop.pledges.map(pledge => (
                          <div key={pledge._id} style={{ border: '1px solid #d1d5db', padding: '12px', borderRadius: '6px', backgroundColor: '#f9fafb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                              <strong style={{ color: '#111827' }}>{pledge.companyName}</strong>
                              
                              {/* Status Badge */}
                              <span style={{ 
                                fontSize: '0.7rem', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', textTransform: 'uppercase',
                                backgroundColor: pledge.status === 'Accepted' ? '#dcfce7' : pledge.status === 'Rejected' ? '#fee2e2' : '#fef3c7',
                                color: pledge.status === 'Accepted' ? '#166534' : pledge.status === 'Rejected' ? '#991b1b' : '#b45309' 
                              }}>
                                {pledge.status}
                              </span>
                            </div>
                            
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.9rem', color: '#059669', fontWeight: 'bold' }}>Offered: Rs. {pledge.amount.toLocaleString()}</p>
                            <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#6b7280' }}>📧 {pledge.contactEmail}</p>
                            {pledge.message && <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#4b5563', fontStyle: 'italic', backgroundColor: '#fff', padding: '5px', borderLeft: '2px solid #d1d5db' }}>"{pledge.message}"</p>}
                            
                            {/* Action Buttons */}
                            {pledge.status === 'Pending' && (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn" style={{ flex: 1, padding: '5px', fontSize: '0.8rem', backgroundColor: '#10b981' }} onClick={() => handlePledgeStatus(prop._id, pledge._id, 'Accepted')}>Accept</button>
                                <button className="btn" style={{ flex: 1, padding: '5px', fontSize: '0.8rem', backgroundColor: '#ef4444' }} onClick={() => handlePledgeStatus(prop._id, pledge._id, 'Rejected')}>Reject</button>
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