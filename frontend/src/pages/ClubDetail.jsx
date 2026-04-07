import React, { useState, useEffect } from 'react';
import { useParams, useNavigate , useLocation } from 'react-router-dom';
import api from '../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ClubNavigation from '../components/ClubNavigation';

function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
    api.get(`/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.error(err));
  };
//scroll to announcements if user clicks "View Announcements" from the main hub or any other page
  useEffect(() => {
    if (location.hash === '#announcements') {
      setTimeout(() => {
        const element = document.getElementById('announcements');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location.hash, club]);


  //--------Member Management------
  const handleJoinRequest = () => {
    api.post(`/clubs/${id}/request-join`, { userId: currentUser.id })
      .then(res => { alert(res.data.message); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || "Error requesting to join."));
  };

  const handleApprove = (studentId) => {
    api.post(`/clubs/${id}/approve`, { studentId, presidentId: currentUser.id })
      .then(res => { alert(res.data.message); fetchClubData(); })
      .catch(err => alert("Error approving member."));
  };

  const handleRejectRequest = (studentId) => {
    if (!window.confirm("Are you sure you want to decline this request?")) return;
    api.post(`/clubs/${id}/reject-request`, { studentId, presidentId: currentUser.id })
      .then(res => { alert(res.data.message); fetchClubData(); })
      .catch(err => alert("Error rejecting member."));
  };

  //--------Announcement Management------
  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    api.post(`/clubs/${id}/announcements`, { ...announcementData, presidentId: currentUser.id })
      .then(res => { alert(res.data.message); setAnnouncementData({ title: '', content: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || "Error posting announcement."));
  };

  const handleEditAnnouncement = (annId) => {
    if (!editAnnData.title || !editAnnData.content) return alert("Fields cannot be empty.");
    api.put(`/clubs/${id}/announcements/${annId}/edit`, { ...editAnnData, userId: currentUser?.id })
      .then(res => { alert(res.data.message); setEditingAnnId(null); fetchClubData(); })
      .catch(err => alert("Error updating announcement."));
  };

  const handleDeleteAnnouncement = (annId) => {
    if (!window.confirm("Are you sure you want to permanently delete this announcement?")) return;
    api.delete(`/clubs/${id}/announcements/${annId}`, { data: { userId: currentUser?.id } })
      .then(res => fetchClubData()).catch(err => alert("Error deleting announcement."));
  };

  //--------Board Management------
  const handleAssignBoard = (e) => {
    e.preventDefault();
    api.post(`/clubs/${id}/board`, { ...boardData, presidentId: currentUser.id })
      .then(res => { alert(res.data.message); setBoardData({ userId: '', role: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || "Error assigning role."));
  };

  const handleRemoveBoard = (userId) => {
    if (window.confirm("Are you sure you want to remove this member from the board?")) {
      api.delete(`/clubs/${id}/board/${userId}`, { data: { presidentId: currentUser.id } })
        .then(res => fetchClubData()).catch(err => alert("Error removing board member."));
    }
  };

  // --- REPORT GENERATION ACTIONS ---
  const generateMemberListPDF = () => {
    if (!club) return;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Official Member Roster`, 14, 20);

    //Exco memebers at top
    let excoMembers = [];
    let normalMembers = [];
    const excoIds = new Set();

    if (club.president) {
      excoIds.add(club.president._id);
      excoMembers.push({ user: club.president, role: "President" });
    }

    if (club.topBoard && club.topBoard.length > 0) {
      club.topBoard.forEach(boardItem => {
        if (boardItem.user && !excoIds.has(boardItem.user._id)) {
          excoIds.add(boardItem.user._id);
          excoMembers.push({ user: boardItem.user, role: `Top Board: ${boardItem.role}` });
        }
      });
    }

    if (club.members && club.members.length > 0) {
      club.members.forEach(member => {
        if (!excoIds.has(member._id)) {
          normalMembers.push({ user: member, role: "General Member" });
        }
      });
    }

    const sortAlphabetically = (a, b) => (a.user.name || '').localeCompare(b.user.name || '');
    excoMembers.sort(sortAlphabetically);
    normalMembers.sort(sortAlphabetically);

    const orderedMembers = [...excoMembers, ...normalMembers];

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Official Roster: ${orderedMembers.length}`, 14, 34);

    const tableColumn = ["#", "Name", "Email", "Status/Role"];
    const tableRows = orderedMembers.map((item, index) => [
      index + 1, item.user.name || 'Unknown', item.user.email || 'N/A', item.role
    ]);

    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: 40, styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] }, alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    doc.save(`${club.name.replace(/\s+/g, '_')}_Members_Report.pdf`);
  };

  const generateElectionResultsPDF = () => {
    if (!club || !club.elections) return;
    const publishedElections = club.elections.filter(e => e.isPublished);

    if (publishedElections.length === 0) {
      alert("There are no published election results to generate a report for.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Official Election Results`, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    let currentY = 40;

    // Generate a separate table for every individual election role
    publishedElections.forEach((election) => {
      if (currentY > 250) { doc.addPage(); currentY = 20; } // add new page

      doc.setFontSize(14);
      doc.setTextColor(109, 40, 217); 
      doc.text(`Position: ${election.position}`, 14, currentY);
      currentY += 6;

      const totalVotes = election.votedUsers.length;
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total Votes Cast: ${totalVotes}`, 14, currentY);
      currentY += 6;

      const tableColumn = ["Candidate", "Manifesto", "Votes", "Percentage"];
      const tableRows = [];
      const sortedCandidates = [...election.candidates].sort((a, b) => b.voteCount - a.voteCount);

      sortedCandidates.forEach((c, index) => {
        const userId = c.user?._id || c.user;
        const name = club.members?.find(m => m._id === userId)?.name || 'Unknown Member';
        const percent = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) + '%' : '0%';
        const winnerTag = (index === 0 && c.voteCount > 0) ? " (WINNER)" : "";

        tableRows.push([ name + winnerTag, c.manifesto, c.voteCount.toString(), percent ]);
      });

      autoTable(doc, {
        head: [tableColumn], body: tableRows, startY: currentY, styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [139, 92, 246] }, alternateRowStyles: { fillColor: [249, 250, 251] },
        didDrawPage: (data) => { currentY = data.cursor.y + 15; }
      });
    });

    doc.save(`${club.name.replace(/\s+/g, '_')}_Election_Results.pdf`);
  };

  const generateSponsorshipReportPDF = () => {
    if (!club || !club.proposals || club.proposals.length === 0) {
      alert("No sponsorship data available to generate a report.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Financial & Sponsorship Report`, 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    let currentY = 40;
    let totalClubRaised = 0; 

    club.proposals.forEach((prop) => {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      const raisedForProp = prop.pledges?.filter(p => p.status === 'Accepted').reduce((sum, p) => sum + p.amount, 0) || 0;
      totalClubRaised += raisedForProp;

      doc.setFontSize(14);
      doc.setTextColor(3, 105, 161); 
      doc.text(`Campaign: ${prop.title} (${prop.isActive ? 'Active' : 'Closed'})`, 14, currentY);
      currentY += 6;

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Target: Rs. ${prop.targetAmount.toLocaleString()} | Raised: Rs. ${raisedForProp.toLocaleString()}`, 14, currentY);
      currentY += 6;

      const tableColumn = ["Company", "Contact", "Amount (Rs.)", "Status"];
      const tableRows = [];

      if (prop.pledges && prop.pledges.length > 0) {
        prop.pledges.forEach(pledge => {
          tableRows.push([ pledge.companyName, pledge.contactEmail, pledge.amount.toLocaleString(), pledge.status ]);
        });

        autoTable(doc, {
          head: [tableColumn], body: tableRows, startY: currentY, styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [14, 165, 233] }, alternateRowStyles: { fillColor: [240, 249, 255] },
          didDrawPage: (data) => { currentY = data.cursor.y + 15; }
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("No pledges received for this campaign yet.", 14, currentY);
        currentY += 15;
      }
    });

    if (currentY > 260) { doc.addPage(); currentY = 20; }
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129); 
    doc.text(`Grand Total Raised (Accepted): Rs. ${totalClubRaised.toLocaleString()}`, 14, currentY + 10);
    doc.save(`${club.name.replace(/\s+/g, '_')}_Financial_Report.pdf`);
  };

  const generateAnnouncementsPDF = () => {
    if (!club || !club.announcements || club.announcements.length === 0) {
      alert("No announcements available to generate a report.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(40, 40, 40); doc.text(`${club.name} - Official Communications Log`, 14, 20);
    doc.setFontSize(11); doc.setTextColor(100, 100, 100); doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Records (Including Archives): ${club.announcements.length}`, 14, 34);

    const tableColumn = ["Date", "Title", "Message Content", "Status"];
    const tableRows = [];
    const sortedAnnouncements = [...club.announcements].reverse();

    sortedAnnouncements.forEach((ann) => {
      const dateStr = ann.createdAt
        ? new Date(ann.createdAt).toLocaleDateString()
        : new Date(parseInt(ann._id.substring(0, 8), 16) * 1000).toLocaleDateString();

      let statusLabel = "Pending Review";
      if (ann.isDeleted) statusLabel = "DELETED (Archived)";
      else if (ann.isApproved) statusLabel = "Approved & Published";

      tableRows.push([ dateStr, ann.title, ann.content, statusLabel ]);
    });

    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: 40, styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: { 2: { cellWidth: 80 } }, headStyles: { fillColor: [59, 130, 246] }, alternateRowStyles: { fillColor: [239, 246, 255] },
      didParseCell: function (data) { if (data.row.raw[3] === "DELETED (Archived)") data.cell.styles.textColor = [220, 38, 38]; }
    });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Communications_Log.pdf`);
  };

  //--------Election Management------
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
      const newCands = [...editElectionData.candidates]; newCands.splice(index, 1);
      setEditElectionData({ ...editElectionData, candidates: newCands });
    } else {
      const newCands = [...electionData.candidates]; newCands.splice(index, 1);
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
    api.post(`/clubs/${id}/elections`, { ...electionData, supervisorId: currentUser?.id })
      .then(res => { alert(res.data.message); setElectionData({ position: '', candidates: [] }); setTempCandidate({ candidateUserId: '', manifesto: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || "Error creating election."));
  };

  const handleUpdateElection = (electionId) => {
    if (!editElectionData.position) return alert("Please select a position.");
    if (editTempCandidate.candidateUserId || editTempCandidate.manifesto) {
      const proceed = window.confirm("Hold on! You entered candidate details but didn't click the '+' button. Do you want to save changes WITHOUT adding them?");
      if (!proceed) return;
    }
    api.put(`/clubs/${id}/elections/${electionId}/edit`, { ...editElectionData, supervisorId: currentUser?.id })
      .then(res => { alert(res.data.message); setEditingElectionId(null); setEditTempCandidate({ candidateUserId: '', manifesto: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || "Error updating election."));
  };

  const handleToggleElection = (electionId, isActive, isPublished) => {
    if (!window.confirm("Are you sure you want to change the election status?")) return;
    api.put(`/clubs/${id}/elections/${electionId}/status`, { isActive, isPublished, supervisorId: currentUser?.id })
      .then(res => fetchClubData()).catch(err => alert("Error updating election status."));
  };

  const handleVote = (electionId, candidateId) => {
    if (!window.confirm("Are you sure? Your vote is final and anonymous.")) return;
    api.post(`/clubs/${id}/elections/${electionId}/vote`, { userId: currentUser?.id, candidateId })
      .then(res => { alert(res.data.message); fetchClubData(); }).catch(err => alert(err.response?.data?.message || "Error casting vote."));
  };

  const handleDeleteElection = (electionId) => {
    if (!window.confirm("Are you sure you want to permanently delete this election record?")) return;
    api.delete(`/clubs/${id}/elections/${electionId}`, { data: { supervisorId: currentUser?.id } })
      .then(res => { alert(res.data.message); fetchClubData(); }).catch(err => alert("Error deleting election."));
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Club Details...</div>;

  let normalMembers = []; let excoMembers = [];
  if (club?.members) {
    const boardIds = new Set();
    if (club.president?._id) boardIds.add(club.president._id);
    club.topBoard?.forEach(b => { if (b.user?._id) boardIds.add(b.user._id); else if (b.user) boardIds.add(b.user); });

    club.members.forEach(member => { if (boardIds.has(member._id)) excoMembers.push(member); else normalMembers.push(member); });
    const sortAlphabetically = (a, b) => a.name.localeCompare(b.name);
    normalMembers.sort(sortAlphabetically); excoMembers.sort(sortAlphabetically);
  }

  // ======== Role Based Access Control =========
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
      <div className="card" style={{ borderTop: '4px solid var(--primary-color)', paddingBottom: '0' }}>
        <button className="btn btn-outline" style={{ marginBottom: '20px' }} onClick={() => navigate('/clubs')}>
          &larr; {isPresident ? 'Browse Other Clubs' : 'Back to Directory'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '16px', backgroundColor: 'var(--bg-color)', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
              {club.logoUrl ? <img src={`http://localhost:5000${club.logoUrl}`} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>🎓</span>}
            </div>
            <div>
              <h1 style={{ color: 'var(--text-main)', margin: '0 0 5px 0', fontSize: '2rem', letterSpacing: '-0.5px' }}>{club.name}</h1>
            </div>
          </div>

          <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
            {currentUser?.role === 'student' && !isMember && !isPending && (
              <button className="btn btn-success" onClick={handleJoinRequest}>Request to Join Club</button>
            )}
            {currentUser?.role === 'student' && isPending && (
              <span className="badge" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', padding: '8px 16px', fontSize: '0.85rem' }}>⏳ Join Request Pending...</span>
            )}
            {isMember && !isPresident && (
              <span className="badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)', padding: '8px 16px', fontSize: '0.85rem' }}>✓ You are a Member</span>
            )}
          </div>
        </div>

        <ClubNavigation club={club} />
      </div>


      {/* 3. PRIVATE SECTIONS (Internal Member Hub) */}
      {hasFullAccess && (
        <div id="announcements" className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <h2 style={{ color: 'var(--success)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>Internal Member Hub</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>

            {/* Announcements */}
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: 'var(--text-main)' }}>📢 Official Announcements</h4>
              </div>
              
              {club.announcements?.filter(a => !a.isDeleted && (a.isApproved || canManageAnnouncements || isSupervisor)).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No announcements yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '15px' }}>
                  {[...club.announcements].reverse().map((ann) => {
                    if (!ann.isDeleted && (ann.isApproved || canManageAnnouncements || isSupervisor)) {
                      const dateStr = ann.createdAt ? new Date(ann.createdAt).toLocaleDateString() : new Date(parseInt(ann._id.substring(0, 8), 16) * 1000).toLocaleDateString();

                      return (
                        <div key={ann._id} className="card-hover" style={{ padding: '15px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'var(--transition)' }}>
                          {editingAnnId === ann._id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input type="text" className="form-control" value={editAnnData.title} onChange={(e) => setEditAnnData({ ...editAnnData, title: e.target.value })} style={{ margin: 0 }} />
                              <textarea className="form-control" value={editAnnData.content} onChange={(e) => setEditAnnData({ ...editAnnData, content: e.target.value })} style={{ margin: 0, minHeight: '80px' }} />
                              <div className="flex-mobile-stack" style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                                <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }} onClick={() => handleEditAnnouncement(ann._id)}>Save</button>
                                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }} onClick={() => setEditingAnnId(null)}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{ann.title}</strong>
                                  <span className="badge" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-muted)' }}>{dateStr}</span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', margin: '0 0 15px 0', lineHeight: '1.5' }}>{ann.content}</p>
                              </div>

                              <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                                {!ann.isApproved ? (
                                  <span className="badge" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>⏳ Pending Approval</span>
                                ) : (
                                  <span className="badge" style={{ backgroundColor: 'transparent', color: 'var(--success)', padding: 0 }}>✓ Published</span>
                                )}

                                {(canManageAnnouncements || isSupervisor) && (
                                  <div className="flex-mobile-stack" style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn btn-edit" style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'transparent' }} onClick={() => { setEditingAnnId(ann._id); setEditAnnData({ title: ann.title, content: ann.content }); }}>✏️</button>
                                    <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleDeleteAnnouncement(ann._id)}>🗑️</button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>

            {/* Active Funding Campaigns */}
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', gridColumn: '1 / -1' }}>
              <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: 'var(--primary-color)' }}>🤝 Active Funding Campaigns</h4>
                {canManageSponsorships && (
                  <button className="btn" style={{ padding: '6px 15px', fontSize: '0.85rem' }} onClick={() => navigate(`/clubs/${id}/sponsorships`)}>
                    Manage in Portal &rarr;
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
                      <div key={prop._id} className="card-hover" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '15px', transition: 'var(--transition)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h5 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{prop.title}</h5>
                          <span className="badge" style={{ backgroundColor: prop.isActive ? 'var(--primary-light)' : 'var(--bg-color)', color: prop.isActive ? 'var(--primary-color)' : 'var(--text-muted)' }}>
                            {prop.isActive ? 'Active' : 'Closed'}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{prop.description}</p>
                        <div style={{ width: '100%', backgroundColor: 'var(--border-color)', borderRadius: '99px', height: '8px', marginBottom: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, backgroundColor: percent >= 100 ? 'var(--success)' : 'var(--primary-color)', height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          <span style={{ color: 'var(--success)' }}>Raised: Rs. {totalRaised}</span>
                          <span style={{ color: 'var(--text-muted)' }}>Goal: Rs. {prop.targetAmount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 2. PUBLIC SECTIONS (Quick Links) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <div className="card card-hover" style={{ marginBottom: '0', textAlign: 'center', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)' }}>
          <h3 style={{ color: 'var(--primary-color)', marginTop: 0 }}>🏢 Corporate Partnerships</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View active funding proposals or submit a pledge on behalf of your company.</p>
          <button className="btn" style={{ width: '100%', marginTop: '10px' }} onClick={() => navigate(`/clubs/${id}/sponsorships`)}>Enter Sponsorship Portal</button>
        </div>
        
        <div className="card card-hover" style={{ marginBottom: '0', textAlign: 'center', backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning)' }}>
          <h3 style={{ color: 'var(--warning)', marginTop: 0 }}>🏆 Trophy Room</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>View our official gallery of achievements, milestones, and awards.</p>
          <button className="btn" style={{ backgroundColor: 'var(--warning)', width: '100%', marginTop: '10px' }} onClick={() => navigate(`/clubs/${id}/achievements`)}>View Showcase</button>
        </div>
      </div>

      {/* 4. OFFICIAL REPORTING HUB (Visible to ExCo AND Supervisors) */}
      {(isTopBoard || isSupervisor) && (
        <div className="card" style={{ borderLeft: '4px solid var(--success)', marginTop: '20px', backgroundColor: 'var(--success-bg)' }}>
          <h2 style={{ color: 'var(--success)', marginTop: 0, marginBottom: '10px' }}>📊 Official Reporting Hub</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '15px', marginTop: 0 }}>Generate official PDF documents for university records.</p>

          <div className="flex-mobile-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <button className="btn btn-success" style={{ padding: '8px', fontSize: '0.85rem' }} onClick={generateMemberListPDF}>👥 Member List</button>
            <button className="btn" style={{ padding: '8px', fontSize: '0.85rem' }} onClick={generateElectionResultsPDF}>🗳️ Election Results</button>
            {(canManageSponsorships || isSupervisor) && (
              <button className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem', backgroundColor: 'var(--surface-color)' }} onClick={generateSponsorshipReportPDF}>📈 Financials & Pledges</button>
            )}
            {(canManageAnnouncements || isSupervisor) && (
              <button className="btn btn-outline" style={{ padding: '8px', fontSize: '0.85rem', backgroundColor: 'var(--surface-color)' }} onClick={generateAnnouncementsPDF}>📢 Communications Log</button>
            )}
          </div>
        </div>
      )}

      {/* 4. EXECUTIVE ADMIN PANEL (All Top Board Members) */}
      {isTopBoard && (
        <div className="card" style={{ borderLeft: '4px solid var(--primary-color)', marginTop: '20px' }}>
          <h2 style={{ color: 'var(--primary-color)', marginTop: 0, marginBottom: '20px' }}>
            {isPresident ? "President's Control Center" : "Executive Board Panel"}
          </h2>

          <div className={isPresident ? "dashboard-grid-half" : ""} style={{ display: isPresident ? '' : 'grid', gap: '20px' }}>

            {/* LEFT COLUMN: People Management (ONLY FOR PRES/VP) */}
            {isPresident && (
              <div>
                <div style={{ backgroundColor: 'var(--warning-bg)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning)', marginBottom: '20px' }}>
                  <h4 style={{ color: 'var(--warning)', marginTop: 0 }}>👥 Pending Join Requests</h4>
                  {club.pendingMembers?.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No pending requests.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {club.pendingMembers?.map(student => (
                        <div key={student._id} className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '12px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                          <span><strong style={{ color: 'var(--text-main)' }}>{student.name}</strong><br /><small style={{ color: 'var(--text-muted)' }}>{student.email}</small></span>
                          <div className="flex-mobile-stack" style={{ display: 'flex', gap: '5px' }}>
                            <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleApprove(student._id)}>Approve</button>
                            <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleRejectRequest(student._id)}>Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ color: 'var(--text-main)', marginTop: 0 }}>👔 Top Board Management</h4>
                  <form onSubmit={handleAssignBoard} style={{ marginBottom: '15px' }}>
                    <select className="form-control" style={{ marginBottom: '10px' }} value={boardData.userId} onChange={(e) => setBoardData({ ...boardData, userId: e.target.value })} required>
                      <option value="">-- Select an Approved Member --</option>
                      {club.members?.map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
                    </select>
                    <select className="form-control" value={boardData.role} onChange={(e) => setBoardData({ ...boardData, role: e.target.value })} required style={{ marginBottom: '10px' }}>
                      <option value="">-- Select a Position --</option>
                      {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button type="submit" className="btn btn-outline" style={{ width: '100%', padding: '8px' }}>Assign Role</button>
                  </form>

                  {club.topBoard?.map((boardMember, i) => (
                    <div key={i} className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--surface-color)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '8px', borderLeft: '3px solid var(--primary-color)', boxShadow: 'var(--shadow-sm)' }}>
                      <span><strong style={{ color: 'var(--text-main)' }}>{boardMember.role}:</strong> <span style={{ color: 'var(--text-secondary)' }}>{boardMember.user?.name}</span></span>
                      <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleRemoveBoard(boardMember.user?._id)}>X</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* RIGHT COLUMN: Communications (FOR PRES, VP, AND SECRETARIES) */}
            {canManageAnnouncements && (
              <div style={{ backgroundColor: 'var(--primary-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-color)', height: 'fit-content' }}>
                <h4 style={{ color: 'var(--primary-color)', marginTop: 0 }}>📢 Draft New Announcement</h4>
                <form onSubmit={handlePostAnnouncement}>
                  <input type="text" className="form-control" placeholder="Announcement Title" value={announcementData.title} onChange={(e) => setAnnouncementData({ ...announcementData, title: e.target.value })} required style={{ marginBottom: '10px' }} />
                  <textarea className="form-control" placeholder="What do you want to tell your members?" value={announcementData.content} onChange={(e) => setAnnouncementData({ ...announcementData, content: e.target.value })} required style={{ marginBottom: '10px', minHeight: '120px' }} />
                  <button type="submit" className="btn" style={{ width: '100%' }}>Submit for Supervisor Approval</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. SUPERVISOR ADMIN PANEL */}
      {isSupervisor && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: 'var(--text-main)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>🛡️ Supervisor Control Center</h3>
          <div className="card" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
            <h4 style={{ color: 'var(--text-main)', marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>Electoral Engine</h4>

            {/* 1. ALL-IN-ONE CREATE ELECTION BUILDER */}
            <div style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--radius-lg)', marginBottom: '30px', boxShadow: 'var(--shadow-sm)' }}>
              <h5 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>➕ Create New Election & Ballot</h5>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-secondary)' }}>1. Select Position</label>
                <select className="form-control" value={electionData.position} onChange={(e) => setElectionData({ ...electionData, position: e.target.value })}>
                  <option value="">-- Select Position to Elect --</option>
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '15px', padding: '20px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '10px', color: 'var(--text-secondary)' }}>2. Build the Ballot</label>
                {electionData.candidates.length > 0 && (
                  <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                    {electionData.candidates.map((c, idx) => {
                      const name = club.members?.find(m => m._id === c.candidateUserId)?.name || 'Unknown User';
                      return (
                        <li key={idx} style={{ marginBottom: '8px' }}>
                          <strong style={{ color: 'var(--text-main)' }}>{name}</strong> <em>("{c.manifesto}")</em>
                          <button type="button" onClick={() => handleRemoveTempCandidate(idx, false)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '10px', fontWeight: 'bold' }}>[X]</button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                  <select className="form-control" value={tempCandidate.candidateUserId} onChange={(e) => setTempCandidate({ ...tempCandidate, candidateUserId: e.target.value })} style={{ margin: 0, flex: 1 }}>
                    <option value="">-- Select Member --</option>
                    {club.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  <input type="text" className="form-control" placeholder="Short Manifesto" value={tempCandidate.manifesto} onChange={(e) => setTempCandidate({ ...tempCandidate, manifesto: e.target.value })} style={{ margin: 0, flex: 2 }} />
                  <button type="button" className="btn btn-outline" style={{ margin: 0, backgroundColor: 'var(--surface-color)' }} onClick={(e) => handleAddTempCandidate(e, false)}>Add to List</button>
                </div>
              </div>
              <button className="btn btn-success" style={{ width: '100%' }} onClick={handleCreateElection}>Initialize Full Election</button>
            </div>

            {/* 2. MANAGE ACTIVE ELECTIONS */}
            <h5 style={{ color: 'var(--text-main)', marginBottom: '15px', fontSize: '1.1rem' }}>📋 Election Records</h5>
            {club.elections?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No elections on record.</p>
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {club.elections?.map(election => (
                  <div key={election._id} className="card-hover" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>

                    {editingElectionId === election._id ? (
                      <div style={{ backgroundColor: 'var(--warning-bg)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--warning)' }}>
                        <h6 style={{ margin: '0 0 10px 0', color: 'var(--warning)', fontSize: '1rem' }}>✏️ Edit Election Details</h6>
                        <select className="form-control" value={editElectionData.position} onChange={(e) => setEditElectionData({ ...editElectionData, position: e.target.value })} style={{ marginBottom: '10px' }}>
                          <option value="">-- Select Position --</option>
                          {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', marginBottom: '15px', color: 'var(--text-secondary)' }}>
                          {editElectionData.candidates.map((c, idx) => {
                            const name = club.members?.find(m => m._id === (c.candidateUserId || c.user))?.name || 'Unknown User';
                            return (
                              <li key={idx} style={{ marginBottom: '8px' }}>
                                <strong style={{ color: 'var(--text-main)' }}>{name}</strong> <em>("{c.manifesto}")</em>
                                <button type="button" onClick={() => handleRemoveTempCandidate(idx, true)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '5px' }}>[X]</button>
                              </li>
                            )
                          })}
                        </ul>
                        <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                          <select className="form-control" value={editTempCandidate.candidateUserId} onChange={(e) => setEditTempCandidate({ ...editTempCandidate, candidateUserId: e.target.value })} style={{ margin: 0, flex: 1 }}>
                            <option value="">-- Add Member --</option>
                            {club.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
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
                          <h5 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>{election.position}</h5>
                          <div className="flex-mobile-stack" style={{ display: 'flex', gap: '10px' }}>
                            <button className={election.isActive ? "btn btn-danger" : "btn btn-success"} style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => handleToggleElection(election._id, !election.isActive, election.isPublished)}>
                              {election.isActive ? '🛑 Close Voting' : '🟢 Open Voting'}
                            </button>
                            <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--surface-color)' }} onClick={() => handleToggleElection(election._id, false, !election.isPublished)}>
                              {election.isPublished ? 'Hide Results' : '📢 Publish Results'}
                            </button>
                          </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '15px 0' }} />

                        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Live Tally ({election.votedUsers?.length || 0} votes cast)</p>
                        <ul style={{ margin: '0 0 15px 0', paddingLeft: '20px', color: 'var(--text-secondary)' }}>
                          {election.candidates?.map(c => {
                            const candidateName = club.members?.find(m => m._id === c.user)?.name || 'Unknown User';
                            return (
                              <li key={c._id} style={{ marginBottom: '8px' }}>
                                <span>{candidateName}: <strong style={{ color: 'var(--text-main)' }}>{c.voteCount} votes</strong></span>
                              </li>
                            );
                          })}
                          {election.candidates?.length === 0 && <li style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No candidates added.</li>}
                        </ul>

                        <div className="flex-mobile-stack" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px dashed var(--border-color)', paddingTop: '15px' }}>
                          {!election.isActive && !election.isPublished && election.votedUsers.length === 0 && (
                            <button className="btn" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)', padding: '6px 15px', fontSize: '0.85rem' }} onClick={() => {
                              setEditingElectionId(election._id);
                              setEditElectionData({ position: election.position, candidates: election.candidates.map(c => ({ candidateUserId: c.user, manifesto: c.manifesto })) });
                            }}>
                              ✏️ Edit Election
                            </button>
                          )}
                          <button className="btn btn-danger" style={{ padding: '6px 15px', fontSize: '0.85rem' }} onClick={() => handleDeleteElection(election._id)}>
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