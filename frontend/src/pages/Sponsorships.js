import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

  // Access Control
  const isPresident = club.president?._id === currentUser?.id;
  const isTopBoard = isPresident || club.topBoard?.some(b => b.user?._id === currentUser?.id);

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
      <div className="card" style={{ borderTop: '4px solid #8b5cf6', textAlign: 'center' }}>
        <h1 style={{ color: '#8b5cf6', margin: '0 0 10px 0' }}>{club.name} Corporate Partnerships</h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Partner with our student leaders to build the future. Review our active initiatives below.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isTopBoard ? '2fr 1fr' : '1fr', gap: '20px' }}>
        
        {/* LEFT/MAIN COLUMN: Public Proposals */}
        <div>
          <h3 style={{ color: '#6d28d9', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>Active Funding Initiatives</h3>
          
          {club.proposals?.filter(p => p.isActive).length === 0 ? (
            <div className="card"><p>No active proposals at this time. Please check back later!</p></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
              {club.proposals?.filter(p => p.isActive).map(proposal => (
                <div key={proposal._id} className="card" style={{ border: '1px solid #e5e7eb', marginBottom: 0 }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#6d28d9' }}>{proposal.title}</h4>
                  <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>{proposal.description}</p>
                  <p style={{ fontWeight: 'bold' }}>Target: Rs. {proposal.targetAmount}</p>
                  {proposal.proposalDocumentUrl && (
                    <a href={proposal.proposalDocumentUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginBottom: '15px', color: '#8b5cf6' }}>📄 View Official PDF Proposal</a>
                  )}

                  {/* Pledge Form */}
                  {activePledgeForm === proposal._id ? (
                    <form onSubmit={(e) => handleSubmitPledge(e, proposal._id)} style={{ backgroundColor: '#f9fafb', padding: '15px', border: '1px solid #d1d5db', borderRadius: '5px', marginTop: '15px' }}>
                      <h5 style={{ margin: '0 0 10px 0' }}>Submit a Pledge</h5>
                      <input type="text" className="form-control" placeholder="Company Name" required onChange={(e) => setPledgeData({...pledgeData, companyName: e.target.value})} style={{ marginBottom: '8px' }}/>
                      <input type="email" className="form-control" placeholder="Contact Email" required onChange={(e) => setPledgeData({...pledgeData, contactEmail: e.target.value})} style={{ marginBottom: '8px' }}/>
                      <input type="number" className="form-control" placeholder="Pledge Amount (Rs.)" required onChange={(e) => setPledgeData({...pledgeData, amount: e.target.value})} style={{ marginBottom: '8px' }}/>
                      <textarea className="form-control" placeholder="Optional Message" onChange={(e) => setPledgeData({...pledgeData, message: e.target.value})} style={{ marginBottom: '8px' }}/>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#8b5cf6', padding: '8px' }}>Send Offer</button>
                        <button type="button" className="btn" style={{ backgroundColor: '#6b7280', padding: '8px' }} onClick={() => setActivePledgeForm(null)}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button className="btn" style={{ width: '100%', backgroundColor: '#8b5cf6', marginTop: '10px' }} onClick={() => setActivePledgeForm(proposal._id)}>
                      Sponsor This Initiative
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Top Board CRM (Hidden from Public) */}
        {isTopBoard && (
          <div className="card" style={{ backgroundColor: '#fdf4ff', border: '1px solid #fbcfe8' }}>
            <h3 style={{ color: '#a21caf', marginTop: 0, borderBottom: '2px solid #fbcfe8', paddingBottom: '10px' }}>
              🏢 Internal CRM
            </h3>
            
            <h5 style={{ color: '#86198f' }}>Publish New Proposal</h5>
            <form onSubmit={handlePublishProposal} style={{ marginBottom: '30px' }}>
              <input type="text" className="form-control" placeholder="Proposal Title" required onChange={(e) => setProposalData({...proposalData, title: e.target.value})} style={{ marginBottom: '8px' }}/>
              <textarea className="form-control" placeholder="What are you raising money for?" required onChange={(e) => setProposalData({...proposalData, description: e.target.value})} style={{ marginBottom: '8px' }}/>
              <input type="number" className="form-control" placeholder="Target Amount (Rs.)" required onChange={(e) => setProposalData({...proposalData, targetAmount: e.target.value})} style={{ marginBottom: '8px' }}/>
              <input type="text" className="form-control" placeholder="Google Drive Link to PDF (Optional)" onChange={(e) => setProposalData({...proposalData, proposalDocumentUrl: e.target.value})} style={{ marginBottom: '8px' }}/>
              <button type="submit" className="btn" style={{ width: '100%', backgroundColor: '#a21caf', padding: '8px' }}>Publish Proposal</button>
            </form>

            <h5 style={{ color: '#86198f', borderBottom: '1px solid #fbcfe8', paddingBottom: '5px' }}>Incoming Corporate Pledges</h5>
            {club.proposals?.map(prop => (
              <div key={prop._id} style={{ marginBottom: '15px' }}>
                <strong style={{ fontSize: '0.9rem', color: '#4a044e' }}>{prop.title}</strong>
                {prop.pledges.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '5px 0' }}>No pledges yet.</p>
                ) : (
                  prop.pledges.map(pledge => (
                    <div key={pledge._id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '10px', borderRadius: '5px', marginTop: '5px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>{pledge.companyName}</strong>
                        <span style={{ color: pledge.status === 'Accepted' ? '#10b981' : pledge.status === 'Rejected' ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}>{pledge.status}</span>
                      </div>
                      <p style={{ margin: '2px 0' }}>Offered: Rs. {pledge.amount}</p>
                      <p style={{ margin: '2px 0', color: 'var(--text-muted)' }}>{pledge.contactEmail}</p>
                      
                      {pledge.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                          <button className="btn" style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#10b981' }} onClick={() => handlePledgeStatus(prop._id, pledge._id, 'Accepted')}>Accept</button>
                          <button className="btn" style={{ padding: '3px 8px', fontSize: '0.75rem', backgroundColor: '#ef4444' }} onClick={() => handlePledgeStatus(prop._id, pledge._id, 'Rejected')}>Reject</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default Sponsorships;