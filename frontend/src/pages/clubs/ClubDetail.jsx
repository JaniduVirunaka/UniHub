import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Megaphone, Trophy, Building2, BarChart2, Users, PenLine, Trash2,
  CheckCircle, XCircle, Plus, X, FileText, Vote, ChevronRight, ShieldCheck,
} from 'lucide-react';
import api from '../../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ClubNavigation from '../../components/ClubNavigation';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import { staggerContainer, staggerItem, scaleUp } from '../../hooks/animationVariants';

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

function ClubDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [club, setClub] = useState(null);

  const [announcementData, setAnnouncementData] = useState({ title: '', content: '' });
  const [editingAnnId, setEditingAnnId] = useState(null);
  const [editAnnData, setEditAnnData] = useState({ title: '', content: '' });
  const [boardData, setBoardData] = useState({ userId: '', role: '' });

  const [electionData, setElectionData] = useState({ position: '', candidates: [] });
  const [tempCandidate, setTempCandidate] = useState({ candidateUserId: '', manifesto: '' });
  const [editingElectionId, setEditingElectionId] = useState(null);
  const [editElectionData, setEditElectionData] = useState({ position: '', candidates: [] });
  const [editTempCandidate, setEditTempCandidate] = useState({ candidateUserId: '', manifesto: '' });

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const availableRoles = [
    'President', 'Vice President', 'Secretary', 'Assistant Secretary',
    'Treasurer', 'Assistant Treasurer', 'Event Coordinator', 'Public Relations', 'Editor',
  ];

  useEffect(() => { fetchClubData(); }, [id]);

  const fetchClubData = () => {
    api.get(`/clubs/${id}`).then(res => setClub(res.data)).catch(console.error);
  };

  useEffect(() => {
    if (location.hash === '#announcements') {
      setTimeout(() => {
        const el = document.getElementById('announcements');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [location.hash, club]);

  // ---- Member Management ----
  const handleJoinRequest = () => {
    api.post(`/clubs/${id}/request-join`, { userId: currentUser.id })
      .then(res => { alert(res.data.message); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error requesting to join.'));
  };

  const handleApprove = (studentId) => {
    api.post(`/clubs/${id}/approve`, { studentId, presidentId: currentUser.id })
      .then(res => { alert(res.data.message); fetchClubData(); })
      .catch(() => alert('Error approving member.'));
  };

  const handleRejectRequest = (studentId) => {
    if (!window.confirm('Are you sure you want to decline this request?')) return;
    api.post(`/clubs/${id}/reject-request`, { studentId, presidentId: currentUser.id })
      .then(res => { alert(res.data.message); fetchClubData(); })
      .catch(() => alert('Error rejecting member.'));
  };

  // ---- Announcement Management ----
  const handlePostAnnouncement = (e) => {
    e.preventDefault();
    api.post(`/clubs/${id}/announcements`, { ...announcementData, presidentId: currentUser.id })
      .then(res => { alert(res.data.message); setAnnouncementData({ title: '', content: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error posting announcement.'));
  };

  const handleEditAnnouncement = (annId) => {
    if (!editAnnData.title || !editAnnData.content) return alert('Fields cannot be empty.');
    api.put(`/clubs/${id}/announcements/${annId}/edit`, { ...editAnnData, userId: currentUser?.id })
      .then(res => { alert(res.data.message); setEditingAnnId(null); fetchClubData(); })
      .catch(() => alert('Error updating announcement.'));
  };

  const handleDeleteAnnouncement = (annId) => {
    if (!window.confirm('Are you sure you want to permanently delete this announcement?')) return;
    api.delete(`/clubs/${id}/announcements/${annId}`, { data: { userId: currentUser?.id } })
      .then(() => fetchClubData()).catch(() => alert('Error deleting announcement.'));
  };

  // ---- Board Management ----
  const handleAssignBoard = (e) => {
    e.preventDefault();
    api.post(`/clubs/${id}/board`, { ...boardData, presidentId: currentUser.id })
      .then(res => { alert(res.data.message); setBoardData({ userId: '', role: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error assigning role.'));
  };

  const handleRemoveBoard = (userId) => {
    if (!window.confirm('Are you sure you want to remove this member from the board?')) return;
    api.delete(`/clubs/${id}/board/${userId}`, { data: { presidentId: currentUser.id } })
      .then(() => fetchClubData()).catch(() => alert('Error removing board member.'));
  };

  // ---- PDF Reports ----
  const generateMemberListPDF = () => {
    if (!club) return;
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Official Member Roster`, 14, 20);

    let excoMembers = []; let normalMembers = [];
    const excoIds = new Set();
    if (club.president) { excoIds.add(club.president._id); excoMembers.push({ user: club.president, role: 'President' }); }
    club.topBoard?.forEach(b => { if (b.user && !excoIds.has(b.user._id)) { excoIds.add(b.user._id); excoMembers.push({ user: b.user, role: `Top Board: ${b.role}` }); } });
    club.members?.forEach(m => { if (!excoIds.has(m._id)) normalMembers.push({ user: m, role: 'General Member' }); });

    const sort = (a, b) => (a.user.name || '').localeCompare(b.user.name || '');
    excoMembers.sort(sort); normalMembers.sort(sort);
    const ordered = [...excoMembers, ...normalMembers];

    doc.setFontSize(11); doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Official Roster: ${ordered.length}`, 14, 34);

    autoTable(doc, {
      head: [['#', 'Name', 'Email', 'Status/Role']],
      body: ordered.map((item, i) => [i + 1, item.user.name || 'Unknown', item.user.email || 'N/A', item.role]),
      startY: 40, styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] }, alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Members_Report.pdf`);
  };

  const generateElectionResultsPDF = () => {
    if (!club?.elections) return;
    const published = club.elections.filter(e => e.isPublished);
    if (!published.length) { alert('There are no published election results to generate a report for.'); return; }

    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Official Election Results`, 14, 20);
    doc.setFontSize(11); doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    let y = 40;
    published.forEach(election => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(14); doc.setTextColor(109, 40, 217);
      doc.text(`Position: ${election.position}`, 14, y); y += 6;
      const total = election.votedUsers.length;
      doc.setFontSize(10); doc.setTextColor(100, 100, 100);
      doc.text(`Total Votes Cast: ${total}`, 14, y); y += 6;

      const sorted = [...election.candidates].sort((a, b) => b.voteCount - a.voteCount);
      autoTable(doc, {
        head: [['Candidate', 'Manifesto', 'Votes', 'Percentage']],
        body: sorted.map((c, i) => {
          const name = club.members?.find(m => m._id === (c.user?._id || c.user))?.name || 'Unknown';
          const pct = total > 0 ? ((c.voteCount / total) * 100).toFixed(1) + '%' : '0%';
          return [name + (i === 0 && c.voteCount > 0 ? ' (WINNER)' : ''), c.manifesto, c.voteCount, pct];
        }),
        startY: y, styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [139, 92, 246] }, alternateRowStyles: { fillColor: [249, 250, 251] },
        didDrawPage: (data) => { y = data.cursor.y + 15; },
      });
    });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Election_Results.pdf`);
  };

  const generateSponsorshipReportPDF = () => {
    if (!club?.proposals?.length) { alert('No sponsorship data available.'); return; }
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Financial & Sponsorship Report`, 14, 20);
    doc.setFontSize(11); doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    let y = 40; let grandTotal = 0;
    club.proposals.forEach(prop => {
      if (y > 250) { doc.addPage(); y = 20; }
      const raised = prop.pledges?.filter(p => p.status === 'Accepted').reduce((s, p) => s + p.amount, 0) || 0;
      grandTotal += raised;
      doc.setFontSize(14); doc.setTextColor(3, 105, 161);
      doc.text(`Campaign: ${prop.title} (${prop.isActive ? 'Active' : 'Closed'})`, 14, y); y += 6;
      doc.setFontSize(10); doc.setTextColor(100, 100, 100);
      doc.text(`Target: Rs. ${prop.targetAmount.toLocaleString()} | Raised: Rs. ${raised.toLocaleString()}`, 14, y); y += 6;

      if (prop.pledges?.length) {
        autoTable(doc, {
          head: [['Company', 'Contact', 'Amount (Rs.)', 'Status']],
          body: prop.pledges.map(p => [p.companyName, p.contactEmail, p.amount.toLocaleString(), p.status]),
          startY: y, styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [14, 165, 233] }, alternateRowStyles: { fillColor: [240, 249, 255] },
          didDrawPage: (data) => { y = data.cursor.y + 15; },
        });
      } else {
        doc.setFontSize(10); doc.setTextColor(150, 150, 150);
        doc.text('No pledges received for this campaign yet.', 14, y); y += 15;
      }
    });
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(16); doc.setTextColor(16, 185, 129);
    doc.text(`Grand Total Raised (Accepted): Rs. ${grandTotal.toLocaleString()}`, 14, y + 10);
    doc.save(`${club.name.replace(/\s+/g, '_')}_Financial_Report.pdf`);
  };

  const generateAnnouncementsPDF = () => {
    if (!club?.announcements?.length) { alert('No announcements available.'); return; }
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Official Communications Log`, 14, 20);
    doc.setFontSize(11); doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Records (Including Archives): ${club.announcements.length}`, 14, 34);

    const rows = [...club.announcements].reverse().map(ann => {
      const dateStr = ann.createdAt
        ? new Date(ann.createdAt).toLocaleDateString()
        : new Date(parseInt(ann._id.substring(0, 8), 16) * 1000).toLocaleDateString();
      let status = 'Pending Review';
      if (ann.isDeleted) status = 'DELETED (Archived)';
      else if (ann.isApproved) status = 'Approved & Published';
      return [dateStr, ann.title, ann.content, status];
    });

    autoTable(doc, {
      head: [['Date', 'Title', 'Message Content', 'Status']],
      body: rows, startY: 40, styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      columnStyles: { 2: { cellWidth: 80 } }, headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [239, 246, 255] },
      didParseCell: (data) => { if (data.row.raw[3] === 'DELETED (Archived)') data.cell.styles.textColor = [220, 38, 38]; },
    });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Communications_Log.pdf`);
  };

  // ---- Election Management ----
  const handleAddTempCandidate = (e, isEdit = false) => {
    e.preventDefault();
    const src = isEdit ? editTempCandidate : tempCandidate;
    if (!src.candidateUserId || !src.manifesto) return;
    if (isEdit) {
      setEditElectionData(d => ({ ...d, candidates: [...d.candidates, src] }));
      setEditTempCandidate({ candidateUserId: '', manifesto: '' });
    } else {
      setElectionData(d => ({ ...d, candidates: [...d.candidates, src] }));
      setTempCandidate({ candidateUserId: '', manifesto: '' });
    }
  };

  const handleRemoveTempCandidate = (index, isEdit = false) => {
    if (isEdit) {
      setEditElectionData(d => { const c = [...d.candidates]; c.splice(index, 1); return { ...d, candidates: c }; });
    } else {
      setElectionData(d => { const c = [...d.candidates]; c.splice(index, 1); return { ...d, candidates: c }; });
    }
  };

  const handleCreateElection = (e) => {
    e.preventDefault();
    if (!electionData.position) return alert('Please select a position.');
    if (tempCandidate.candidateUserId || tempCandidate.manifesto) {
      if (!window.confirm("Hold on! You entered candidate details but didn't click 'Add to List'. Create election WITHOUT adding them?")) return;
    }
    api.post(`/clubs/${id}/elections`, { ...electionData, supervisorId: currentUser?.id })
      .then(res => { alert(res.data.message); setElectionData({ position: '', candidates: [] }); setTempCandidate({ candidateUserId: '', manifesto: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error creating election.'));
  };

  const handleUpdateElection = (electionId) => {
    if (!editElectionData.position) return alert('Please select a position.');
    if (editTempCandidate.candidateUserId || editTempCandidate.manifesto) {
      if (!window.confirm("Hold on! You entered candidate details but didn't click '+'. Save changes WITHOUT adding them?")) return;
    }
    api.put(`/clubs/${id}/elections/${electionId}/edit`, { ...editElectionData, supervisorId: currentUser?.id })
      .then(res => { alert(res.data.message); setEditingElectionId(null); setEditTempCandidate({ candidateUserId: '', manifesto: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error updating election.'));
  };

  const handleToggleElection = (electionId, isActive, isPublished) => {
    if (!window.confirm('Are you sure you want to change the election status?')) return;
    api.put(`/clubs/${id}/elections/${electionId}/status`, { isActive, isPublished, supervisorId: currentUser?.id })
      .then(() => fetchClubData()).catch(() => alert('Error updating election status.'));
  };

  const handleDeleteElection = (electionId) => {
    if (!window.confirm('Are you sure you want to permanently delete this election record?')) return;
    api.delete(`/clubs/${id}/elections/${electionId}`, { data: { supervisorId: currentUser?.id } })
      .then(res => { alert(res.data.message); fetchClubData(); }).catch(() => alert('Error deleting election.'));
  };

  if (!club) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner text="Loading Club Details…" /></div>;

  // ---- RBAC ----
  const isActualPresident = club.president?._id === currentUser?.id;
  const isVP = club.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isPresident = isActualPresident || isVP;
  const isSecretary = club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Secretary', 'Assistant Secretary'].includes(b.role));
  const canManageAnnouncements = isPresident || isSecretary;
  const allowedSponsorshipRoles = ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'];
  const canManageSponsorships = isPresident || club.topBoard?.some(b => b.user?._id === currentUser?.id && allowedSponsorshipRoles.includes(b.role));
  const isSupervisor = currentUser?.role === 'supervisor';
  const isTopBoard = isPresident || club.topBoard?.some(b => b.user?._id === currentUser?.id);
  const isMember = club.members?.some(m => m._id === currentUser?.id);
  const hasFullAccess = isTopBoard || isMember || isSupervisor;
  const isPending = club.pendingMembers?.some(m => m._id === currentUser?.id);

  return (
    <PageWrapper>
      {/* Public Header */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => navigate('/clubs')} className="mb-4">
          {isPresident ? 'Browse Other Clubs' : 'Back to Directory'}
        </Button>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200/60 text-2xl dark:bg-white/10">
              {club.logoUrl
                ? <img src={`http://localhost:5000${club.logoUrl}`} alt={club.name} className="h-full w-full object-cover" />
                : <span>🎓</span>}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{club.name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentUser?.role === 'student' && !isMember && !isPending && (
              <Button variant="success" onClick={handleJoinRequest} leftIcon={<Plus size={14} />}>Request to Join</Button>
            )}
            {currentUser?.role === 'student' && isPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                ⏳ Join Request Pending…
              </span>
            )}
            {isMember && !isPresident && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                <CheckCircle size={14} /> You are a Member
              </span>
            )}
          </div>
        </div>

        <ClubNavigation club={club} />
      </div>

      <div className="flex flex-col gap-6">

        {/* Internal Member Hub */}
        {hasFullAccess && (
          <div id="announcements">
            <Card variant="glass" padding="lg" className="border-l-4 border-emerald-500">
              <h2 className="mb-6 text-lg font-bold text-emerald-600 dark:text-emerald-400">Internal Member Hub</h2>

              {/* Announcements */}
              <div className="mb-6">
                <div className="mb-4 flex items-center gap-2 border-b border-slate-200/60 pb-3 dark:border-white/10">
                  <Megaphone size={16} className="text-indigo-500" />
                  <h4 className="font-bold text-slate-900 dark:text-white">Official Announcements</h4>
                </div>

                {club.announcements?.filter(a => !a.isDeleted && (a.isApproved || canManageAnnouncements || isSupervisor)).length === 0 ? (
                  <p className="text-sm text-slate-400 italic">No announcements yet.</p>
                ) : (
                  <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible"
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    {[...club.announcements].reverse().map(ann => {
                      if (!ann.isDeleted && (ann.isApproved || canManageAnnouncements || isSupervisor)) {
                        const dateStr = ann.createdAt
                          ? new Date(ann.createdAt).toLocaleDateString()
                          : new Date(parseInt(ann._id.substring(0, 8), 16) * 1000).toLocaleDateString();
                        return (
                          <motion.div key={ann._id} variants={staggerItem}>
                            <Card variant="glass" padding="md" className="flex h-full flex-col justify-between">
                              {editingAnnId === ann._id ? (
                                <div className="flex flex-col gap-2">
                                  <input className={inputCls} value={editAnnData.title} onChange={e => setEditAnnData(d => ({ ...d, title: e.target.value }))} />
                                  <textarea className={`${inputCls} min-h-[80px]`} value={editAnnData.content} onChange={e => setEditAnnData(d => ({ ...d, content: e.target.value }))} />
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="success" className="flex-1" onClick={() => handleEditAnnouncement(ann._id)}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingAnnId(null)}>Cancel</Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                      <strong className="text-slate-900 dark:text-white">{ann.title}</strong>
                                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-white/10 dark:text-slate-400">{dateStr}</span>
                                    </div>
                                    <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">{ann.content}</p>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-dashed border-slate-200/60 pt-3 dark:border-white/10">
                                    {!ann.isApproved
                                      ? <StatusBadge status="PENDING" />
                                      : <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ Published</span>}
                                    {(canManageAnnouncements || isSupervisor) && (
                                      <div className="flex gap-1">
                                        <Button size="xs" variant="ghost" leftIcon={<PenLine size={12} />} aria-label="Edit announcement"
                                          onClick={() => { setEditingAnnId(ann._id); setEditAnnData({ title: ann.title, content: ann.content }); }} />
                                        <Button size="xs" variant="danger" leftIcon={<Trash2 size={12} />} aria-label="Delete announcement"
                                          onClick={() => handleDeleteAnnouncement(ann._id)} />
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </Card>
                          </motion.div>
                        );
                      }
                      return null;
                    })}
                  </motion.div>
                )}
              </div>

              {/* Funding Campaigns */}
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <BarChart2 size={16} className="text-indigo-500" />
                    <h4 className="font-bold text-slate-900 dark:text-white">Active Funding Campaigns</h4>
                  </div>
                  {canManageSponsorships && (
                    <Button size="sm" variant="ghost" rightIcon={<ChevronRight size={13} />} onClick={() => navigate(`/clubs/${id}/sponsorships`)}>
                      Manage in Portal
                    </Button>
                  )}
                </div>

                {!club.proposals?.length ? (
                  <p className="text-sm italic text-slate-400">No active campaigns at the moment.</p>
                ) : (
                  <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2">
                    {club.proposals.map(prop => {
                      const raised = prop.pledges?.filter(p => p.status === 'Accepted').reduce((s, p) => s + p.amount, 0) || 0;
                      const percent = Math.min((raised / prop.targetAmount) * 100, 100).toFixed(0);
                      return (
                        <motion.div key={prop._id} variants={staggerItem}>
                          <Card variant="glass" padding="md">
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <h5 className="font-bold text-slate-900 dark:text-white">{prop.title}</h5>
                              <StatusBadge status={prop.isActive ? 'ACTIVE' : 'INACTIVE'} />
                            </div>
                            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{prop.description}</p>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full rounded-full ${Number(percent) >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              />
                            </div>
                            <div className="mt-2 flex justify-between text-xs font-semibold">
                              <span className="text-emerald-600 dark:text-emerald-400">Raised: Rs. {raised.toLocaleString()}</span>
                              <span className="text-slate-500 dark:text-slate-400">Goal: Rs. {prop.targetAmount.toLocaleString()}</span>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card variant="glass" padding="lg" className="text-center">
            <Building2 size={28} className="mx-auto mb-3 text-indigo-500" />
            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Corporate Partnerships</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">View active funding proposals or submit a pledge on behalf of your company.</p>
            <Button className="w-full" rightIcon={<ChevronRight size={14} />} onClick={() => navigate(`/clubs/${id}/sponsorships`)}>Enter Sponsorship Portal</Button>
          </Card>

          <Card variant="glass" padding="lg" className="text-center">
            <Trophy size={28} className="mx-auto mb-3 text-amber-500" />
            <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Trophy Room</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">View our official gallery of achievements, milestones, and awards.</p>
            <Button variant="secondary" className="w-full" rightIcon={<ChevronRight size={14} />} onClick={() => navigate(`/clubs/${id}/achievements`)}>View Showcase</Button>
          </Card>
        </div>

        {/* Official Reporting Hub */}
        {(isTopBoard || isSupervisor) && (
          <Card variant="glass" padding="lg" className="border-l-4 border-emerald-500">
            <div className="mb-4 flex items-center gap-2">
              <FileText size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Official Reporting Hub</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Generate official PDF documents for university records.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Button variant="success" leftIcon={<Users size={14} />} onClick={generateMemberListPDF}>Member List</Button>
              <Button leftIcon={<Vote size={14} />} onClick={generateElectionResultsPDF}>Election Results</Button>
              {(canManageSponsorships || isSupervisor) && (
                <Button variant="secondary" leftIcon={<BarChart2 size={14} />} onClick={generateSponsorshipReportPDF}>Financials & Pledges</Button>
              )}
              {(canManageAnnouncements || isSupervisor) && (
                <Button variant="secondary" leftIcon={<Megaphone size={14} />} onClick={generateAnnouncementsPDF}>Communications Log</Button>
              )}
            </div>
          </Card>
        )}

        {/* Executive Admin Panel */}
        {isTopBoard && (
          <Card variant="glass" padding="lg" className="border-l-4 border-indigo-500">
            <h2 className="mb-6 text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {isPresident ? "President's Control Center" : 'Executive Board Panel'}
            </h2>

            <div className={`grid gap-6 ${isPresident ? 'lg:grid-cols-2' : ''}`}>
              {/* Left: People Management (president/VP only) */}
              {isPresident && (
                <div className="flex flex-col gap-5">
                  {/* Pending Join Requests */}
                  <Card variant="glass" padding="md" className="border border-amber-400/40">
                    <div className="mb-3 flex items-center gap-2">
                      <Users size={15} className="text-amber-500" />
                      <h4 className="font-bold text-amber-600 dark:text-amber-400">Pending Join Requests</h4>
                    </div>
                    {!club.pendingMembers?.length ? (
                      <p className="text-sm italic text-slate-400">No pending requests.</p>
                    ) : (
                      <motion.div variants={staggerContainer(0.06)} initial="hidden" animate="visible" className="flex flex-col gap-2">
                        {club.pendingMembers.map(student => (
                          <motion.div key={student._id} variants={staggerItem}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5"
                          >
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{student.name}</p>
                              <p className="text-xs text-slate-400">{student.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="xs" variant="success" leftIcon={<CheckCircle size={12} />} onClick={() => handleApprove(student._id)}>Approve</Button>
                              <Button size="xs" variant="danger" leftIcon={<XCircle size={12} />} onClick={() => handleRejectRequest(student._id)}>Decline</Button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </Card>

                  {/* Top Board Management */}
                  <Card variant="glass" padding="md">
                    <div className="mb-3 flex items-center gap-2">
                      <ShieldCheck size={15} className="text-indigo-500" />
                      <h4 className="font-bold text-slate-900 dark:text-white">Top Board Management</h4>
                    </div>
                    <form onSubmit={handleAssignBoard} className="mb-4 flex flex-col gap-2">
                      <select className={inputCls} value={boardData.userId} onChange={e => setBoardData(d => ({ ...d, userId: e.target.value }))} required>
                        <option value="">— Select an Approved Member —</option>
                        {club.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                      </select>
                      <select className={inputCls} value={boardData.role} onChange={e => setBoardData(d => ({ ...d, role: e.target.value }))} required>
                        <option value="">— Select a Position —</option>
                        {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <Button type="submit" variant="secondary" className="w-full" leftIcon={<Plus size={13} />}>Assign Role</Button>
                    </form>

                    <div className="flex flex-col gap-2">
                      {club.topBoard?.map((bm, i) => (
                        <div key={i} className="flex items-center justify-between rounded-2xl border-l-4 border-indigo-400 bg-slate-50/60 px-3 py-2 dark:bg-white/5">
                          <p className="text-sm">
                            <span className="font-bold text-slate-900 dark:text-white">{bm.role}:</span>{' '}
                            <span className="text-slate-600 dark:text-slate-300">{bm.user?.name}</span>
                          </p>
                          <Button size="xs" variant="danger" leftIcon={<X size={11} />} aria-label={`Remove ${bm.user?.name}`}
                            onClick={() => handleRemoveBoard(bm.user?._id)} />
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Right: Draft Announcement (pres, VP, secretaries) */}
              {canManageAnnouncements && (
                <Card variant="glass" padding="md" className="border border-indigo-400/40 h-fit">
                  <div className="mb-3 flex items-center gap-2">
                    <Megaphone size={15} className="text-indigo-500" />
                    <h4 className="font-bold text-indigo-600 dark:text-indigo-400">Draft New Announcement</h4>
                  </div>
                  <form onSubmit={handlePostAnnouncement} className="flex flex-col gap-3">
                    <input className={inputCls} placeholder="Announcement Title" value={announcementData.title}
                      onChange={e => setAnnouncementData(d => ({ ...d, title: e.target.value }))} required />
                    <textarea className={`${inputCls} min-h-[120px]`} placeholder="What do you want to tell your members?"
                      value={announcementData.content} onChange={e => setAnnouncementData(d => ({ ...d, content: e.target.value }))} required />
                    <Button type="submit" className="w-full" leftIcon={<Megaphone size={14} />}>Submit for Supervisor Approval</Button>
                  </form>
                </Card>
              )}
            </div>
          </Card>
        )}

        {/* Supervisor Control Center */}
        {isSupervisor && (
          <Card variant="glass" padding="lg" className="border-l-4 border-violet-500">
            <div className="mb-6 flex items-center gap-2 border-b border-slate-200/60 pb-4 dark:border-white/10">
              <ShieldCheck size={18} className="text-violet-500" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Supervisor Control Center — Electoral Engine</h3>
            </div>

            {/* Create Election */}
            <Card variant="glass" padding="md" className="mb-6">
              <h5 className="mb-4 font-bold text-slate-900 dark:text-white">Create New Election &amp; Ballot</h5>

              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">1. Select Position</label>
                <select className={inputCls} value={electionData.position} onChange={e => setElectionData(d => ({ ...d, position: e.target.value }))}>
                  <option value="">— Select Position to Elect —</option>
                  {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="mb-4 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-white/10">
                <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">2. Build the Ballot</label>
                {electionData.candidates.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-2">
                    {electionData.candidates.map((c, idx) => {
                      const name = club.members?.find(m => m._id === c.candidateUserId)?.name || 'Unknown';
                      return (
                        <li key={idx} className="flex items-center justify-between rounded-xl bg-slate-50/60 px-3 py-1.5 text-sm dark:bg-white/5">
                          <span><strong className="text-slate-900 dark:text-white">{name}</strong> <em className="text-slate-500">"{c.manifesto}"</em></span>
                          <Button size="xs" variant="danger" leftIcon={<X size={11} />} aria-label="Remove candidate" onClick={() => handleRemoveTempCandidate(idx, false)} />
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="flex gap-2">
                  <select className={inputCls} value={tempCandidate.candidateUserId} onChange={e => setTempCandidate(d => ({ ...d, candidateUserId: e.target.value }))}>
                    <option value="">— Select Member —</option>
                    {club.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                  <input className={inputCls} placeholder="Short Manifesto" value={tempCandidate.manifesto} onChange={e => setTempCandidate(d => ({ ...d, manifesto: e.target.value }))} />
                  <Button variant="secondary" size="sm" onClick={e => handleAddTempCandidate(e, false)}>Add</Button>
                </div>
              </div>

              <Button variant="success" className="w-full" leftIcon={<Vote size={14} />} onClick={handleCreateElection}>Initialize Full Election</Button>
            </Card>

            {/* Election Records */}
            <h5 className="mb-4 font-bold text-slate-900 dark:text-white">Election Records</h5>
            {!club.elections?.length ? (
              <p className="italic text-slate-400">No elections on record.</p>
            ) : (
              <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible" className="flex flex-col gap-4">
                {club.elections.map(election => (
                  <motion.div key={election._id} variants={staggerItem}>
                    <Card variant="glass" padding="md">
                      {editingElectionId === election._id ? (
                        <AnimatePresence>
                          <motion.div variants={scaleUp} initial="hidden" animate="visible" exit="exit">
                            <h6 className="mb-3 font-bold text-amber-600 dark:text-amber-400">Edit Election Details</h6>
                            <select className={`${inputCls} mb-3`} value={editElectionData.position} onChange={e => setEditElectionData(d => ({ ...d, position: e.target.value }))}>
                              <option value="">— Select Position —</option>
                              {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {editElectionData.candidates.length > 0 && (
                              <ul className="mb-3 flex flex-col gap-2">
                                {editElectionData.candidates.map((c, idx) => {
                                  const name = club.members?.find(m => m._id === (c.candidateUserId || c.user))?.name || 'Unknown';
                                  return (
                                    <li key={idx} className="flex items-center justify-between rounded-xl bg-slate-50/60 px-3 py-1.5 text-sm dark:bg-white/5">
                                      <span><strong className="text-slate-900 dark:text-white">{name}</strong> <em className="text-slate-500">"{c.manifesto}"</em></span>
                                      <Button size="xs" variant="danger" leftIcon={<X size={11} />} aria-label="Remove candidate" onClick={() => handleRemoveTempCandidate(idx, true)} />
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                            <div className="mb-3 flex gap-2">
                              <select className={inputCls} value={editTempCandidate.candidateUserId} onChange={e => setEditTempCandidate(d => ({ ...d, candidateUserId: e.target.value }))}>
                                <option value="">— Add Member —</option>
                                {club.members?.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                              </select>
                              <input className={inputCls} placeholder="Manifesto" value={editTempCandidate.manifesto} onChange={e => setEditTempCandidate(d => ({ ...d, manifesto: e.target.value }))} />
                              <Button variant="secondary" size="sm" onClick={e => handleAddTempCandidate(e, true)}><Plus size={13} /></Button>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="success" className="flex-1" onClick={() => handleUpdateElection(election._id)}>Save All Changes</Button>
                              <Button variant="ghost" className="flex-1" onClick={() => setEditingElectionId(null)}>Cancel</Button>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      ) : (
                        <>
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                            <h5 className="text-lg font-bold text-slate-900 dark:text-white">{election.position}</h5>
                            <div className="flex gap-2">
                              <Button size="sm" variant={election.isActive ? 'danger' : 'success'}
                                onClick={() => handleToggleElection(election._id, !election.isActive, election.isPublished)}>
                                {election.isActive ? 'Close Voting' : 'Open Voting'}
                              </Button>
                              <Button size="sm" variant="secondary"
                                onClick={() => handleToggleElection(election._id, false, !election.isPublished)}>
                                {election.isPublished ? 'Hide Results' : 'Publish Results'}
                              </Button>
                            </div>
                          </div>

                          <hr className="my-3 border-slate-200/60 dark:border-white/10" />

                          <p className="mb-2 text-sm font-bold text-slate-500 dark:text-slate-400">Live Tally ({election.votedUsers?.length || 0} votes cast)</p>
                          <ul className="mb-3 flex flex-col gap-1.5">
                            {election.candidates?.map(c => {
                              const name = club.members?.find(m => m._id === c.user)?.name || 'Unknown';
                              return (
                                <li key={c._id} className="text-sm text-slate-600 dark:text-slate-300">
                                  {name}: <strong className="text-slate-900 dark:text-white">{c.voteCount} votes</strong>
                                </li>
                              );
                            })}
                            {!election.candidates?.length && <li className="italic text-slate-400">No candidates added.</li>}
                          </ul>

                          <div className="flex justify-end gap-2 border-t border-dashed border-slate-200/60 pt-3 dark:border-white/10">
                            {!election.isActive && !election.isPublished && election.votedUsers.length === 0 && (
                              <Button size="sm" variant="secondary" leftIcon={<PenLine size={13} />} onClick={() => {
                                setEditingElectionId(election._id);
                                setEditElectionData({ position: election.position, candidates: election.candidates.map(c => ({ candidateUserId: c.user, manifesto: c.manifesto })) });
                              }}>Edit</Button>
                            )}
                            <Button size="sm" variant="danger" leftIcon={<Trash2 size={13} />} onClick={() => handleDeleteElection(election._id)}>Delete</Button>
                          </div>
                        </>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </Card>
        )}

      </div>
    </PageWrapper>
  );
}

export default ClubDetail;
