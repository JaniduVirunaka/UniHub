import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function ClubDetail() {
  const { id } = useParams(); // Gets the club ID from the URL
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  
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
          {isPresident ? '🌍 Browse Other Clubs' : '&larr; Back to Directory'}
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ color: 'var(--primary-color)', margin: '0 0 10px 0' }}>{club.name}</h1>
            <p><strong>President:</strong> {club.president?.name || 'Vacant'}</p>
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
            <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginTop: '0' }}>🤝 Sponsorships</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>[Sponsorship Tracking Coming Soon]</p>
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
            {/* Pending Requests Box */}
            <div style={{ backgroundColor: '#fef3c7', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <h4 style={{ color: '#d97706', marginTop: 0 }}>👥 Pending Join Requests</h4>
              {club.pendingMembers?.length === 0 ? (
                <p style={{ color: '#b45309', fontSize: '0.9rem' }}>No pending requests at this time.</p>
              ) : (
                club.pendingMembers?.map(student => (
                  <div key={student._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', backgroundColor: '#fff', padding: '10px', borderRadius: '5px' }}>
                    <span><strong>{student.name}</strong><br/><small>{student.email}</small></span>
                    <button className="btn" style={{ padding: '5px 10px', fontSize: '0.8rem', backgroundColor: '#059669' }} onClick={() => handleApprove(student._id)}>
                      Approve
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions Box */}
            <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
               <h4 style={{ color: '#1e40af', marginTop: 0 }}>⚙️ Quick Actions</h4>
               <p style={{ fontSize: '0.9rem', color: '#3b82f6' }}>Manage your club operations here.</p>
               <button className="btn" style={{ width: '100%', marginBottom: '10px', backgroundColor: '#3b82f6' }}>Post New Announcement</button>
               <button className="btn" style={{ width: '100%', backgroundColor: '#3b82f6' }}>Update Membership Fees</button>
               <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '10px' }}>[Forms connecting to these buttons coming soon]</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClubDetail;