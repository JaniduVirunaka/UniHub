import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PenLine, Trash2, Plus, X } from 'lucide-react';
import api from '../../config/api';
import ClubNavigation from '../../components/ClubNavigation';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../hooks/animationVariants';

const AVAILABLE_ROLES = ['President', 'Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer', 'Event Coordinator', 'Public Relations', 'Editor'];

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

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

  useEffect(() => { fetchClubData(); }, [id]);
  const fetchClubData = () => api.get(`/clubs/${id}`).then(r => setClub(r.data)).catch(console.error);

  const handleAddTempCandidate = (e, isEdit = false) => {
    e.preventDefault();
    const s = isEdit ? editTempCandidate : tempCandidate;
    if (!s.candidateUserId || !s.manifesto) return;
    if (isEdit) { setEditElectionData(d => ({ ...d, candidates: [...d.candidates, s] })); setEditTempCandidate({ candidateUserId: '', manifesto: '' }); }
    else { setElectionData(d => ({ ...d, candidates: [...d.candidates, s] })); setTempCandidate({ candidateUserId: '', manifesto: '' }); }
  };

  const handleRemoveTempCandidate = (index, isEdit = false) => {
    if (isEdit) { const c = [...editElectionData.candidates]; c.splice(index, 1); setEditElectionData(d => ({ ...d, candidates: c })); }
    else { const c = [...electionData.candidates]; c.splice(index, 1); setElectionData(d => ({ ...d, candidates: c })); }
  };

  const handleCreateElection = () => {
    if (!electionData.position) return alert('Please select a position.');
    if (tempCandidate.candidateUserId || tempCandidate.manifesto) {
      if (!window.confirm("You entered candidate details but didn't add them. Create election without?")) return;
    }
    api.post(`/clubs/${id}/elections`, { ...electionData, supervisorId: currentUser?.id })
      .then(r => { alert(r.data.message); setElectionData({ position: '', candidates: [] }); setTempCandidate({ candidateUserId: '', manifesto: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error.'));
  };

  const handleUpdateElection = (electionId) => {
    if (!editElectionData.position) return alert('Please select a position.');
    api.put(`/clubs/${id}/elections/${electionId}/edit`, { ...editElectionData, supervisorId: currentUser?.id })
      .then(r => { alert(r.data.message); setEditingElectionId(null); setEditTempCandidate({ candidateUserId: '', manifesto: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error.'));
  };

  const handleToggleElection = (electionId, isActive, isPublished) => {
    if (!window.confirm('Change election status?')) return;
    api.put(`/clubs/${id}/elections/${electionId}/status`, { isActive, isPublished, supervisorId: currentUser?.id })
      .then(() => fetchClubData()).catch(() => alert('Error.'));
  };

  const handleVote = (electionId, candidateId) => {
    if (!window.confirm('Your vote is final and anonymous. Continue?')) return;
    api.post(`/clubs/${id}/elections/${electionId}/vote`, { userId: currentUser?.id, candidateId })
      .then(r => { alert(r.data.message); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error casting vote.'));
  };

  const handleDeleteElection = (electionId) => {
    if (!window.confirm('Permanently delete this election?')) return;
    api.delete(`/clubs/${id}/elections/${electionId}`, { data: { supervisorId: currentUser?.id } })
      .then(() => fetchClubData()).catch(() => alert('Error.'));
  };

  if (!club) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner text="Loading Elections…" /></div>;

  const isSupervisor = currentUser?.role === 'supervisor';
  const isMember = club.members?.some(m => m._id === currentUser?.id);
  const isTopBoard = club.topBoard?.some(b => b.user?._id === currentUser?.id) || club.president?._id === currentUser?.id;
  const hasFullAccess = isSupervisor || isTopBoard || isMember;
  const userFeeRecord = club.feeRecords?.find(r => (r.user?._id || r.user) === currentUser?.id);
  const hasPaidFees = userFeeRecord && ['Paid', 'Exempt'].includes(userFeeRecord.status);

  const boardIds = new Set([club.president?._id, ...(club.topBoard?.map(b => b.user?._id || b.user) || [])].filter(Boolean));
  const normalMembers = club.members?.filter(m => !boardIds.has(m._id)).sort((a, b) => a.name.localeCompare(b.name)) || [];
  const excoMembers = club.members?.filter(m => boardIds.has(m._id)).sort((a, b) => a.name.localeCompare(b.name)) || [];

  if (!hasFullAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
        <p className="text-slate-500 dark:text-slate-400">You must be an approved member to access the voting booth.</p>
        <Button onClick={() => navigate(`/clubs/${id}`)}>Return to Hub</Button>
      </div>
    );
  }

  const MemberSelect = ({ value, onChange, isEdit }) => (
    <select className={inputCls} value={value} onChange={onChange}>
      <option value="">-- Select Member --</option>
      {normalMembers.length > 0 && <optgroup label="Regular Members">{normalMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}</optgroup>}
      {excoMembers.length > 0 && <optgroup label="Top Board">{excoMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}</optgroup>}
    </select>
  );

  return (
    <PageWrapper title={`${club.name} — Voting Booth`}>
      <ClubNavigation club={club} />

      <div className="mt-6 flex flex-col gap-6">

        {/* ── Member voting booth ── */}
        <Card variant="glass" padding="md">
          <h2 className="mb-5 border-b border-slate-200/60 pb-3 text-lg font-bold text-emerald-600 dark:border-white/10 dark:text-emerald-400">
            Official Club Elections
          </h2>

          {club.elections?.filter(e => e.isActive || e.isPublished).length === 0 ? (
            <p className="text-sm italic text-slate-400">No active elections at this time.</p>
          ) : (
            <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible" className="flex flex-col gap-4">
              {club.elections.filter(e => e.isActive || e.isPublished).map(election => {
                const hasVoted = election.votedUsers.includes(currentUser?.id);
                const totalVotes = election.votedUsers.length;
                const statusLabel = election.isPublished ? 'Results Published' : election.isActive ? 'Voting Open' : 'Voting Closed';
                const statusColor = election.isPublished ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300' : election.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400';

                return (
                  <motion.div key={election._id} variants={staggerItem}>
                    <Card variant="default" padding="md">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{election.position}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {election.candidates.map(c => {
                          const name = club.members?.find(m => m._id === c.user)?.name || 'Unknown';
                          const pct = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(0) : 0;
                          return (
                            <div key={c._id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200/60 p-4 dark:border-white/10">
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white">{name}</p>
                                <p className="text-sm italic text-slate-500 dark:text-slate-400">"{c.manifesto}"</p>
                                {election.isPublished && (
                                  <div className="mt-3">
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} className="h-full rounded-full bg-emerald-500" />
                                    </div>
                                    <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{c.voteCount} votes ({pct}%)</p>
                                  </div>
                                )}
                              </div>
                              {election.isActive && !hasVoted && (
                                hasPaidFees
                                  ? <Button size="sm" variant="success" onClick={() => handleVote(election._id, c._id)}>Vote</Button>
                                  : <div className="text-right"><p className="text-xs font-bold text-rose-500">Voting Restricted</p><p className="text-xs text-slate-400">Requires paid membership</p></div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {election.isActive && hasVoted && (
                        <div className="mt-4 rounded-2xl bg-emerald-50 p-3 text-center text-sm font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                          Your vote has been securely recorded.
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </Card>

        {/* ── Supervisor electoral engine ── */}
        {isSupervisor && (
          <Card variant="glass" padding="md">
            <h3 className="mb-5 border-b border-slate-200/60 pb-3 text-lg font-bold text-slate-900 dark:border-white/10 dark:text-white">
              Supervisor Electoral Engine
            </h3>

            {/* Create election */}
            <Card variant="default" padding="md" className="mb-6">
              <h5 className="mb-4 font-bold text-slate-900 dark:text-white">Create New Election & Ballot</h5>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Position</label>
                <select className={inputCls} value={electionData.position} onChange={e => setElectionData(d => ({ ...d, position: e.target.value }))}>
                  <option value="">-- Select Position --</option>
                  {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="mb-4 rounded-2xl border border-dashed border-slate-300 p-4 dark:border-white/20">
                <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">Build Ballot</label>
                {electionData.candidates.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-1.5">
                    {electionData.candidates.map((c, idx) => {
                      const name = club.members?.find(m => m._id === c.candidateUserId)?.name || 'Unknown';
                      return (
                        <li key={idx} className="flex items-center justify-between rounded-xl bg-slate-50/60 px-3 py-2 dark:bg-white/5">
                          <span className="text-sm"><strong className="text-slate-900 dark:text-white">{name}</strong> <em className="text-slate-400">— {c.manifesto}</em></span>
                          <button type="button" onClick={() => handleRemoveTempCandidate(idx, false)} aria-label="Remove" className="ml-2 text-rose-500 hover:text-rose-700"><X size={14} /></button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <MemberSelect value={tempCandidate.candidateUserId} onChange={e => setTempCandidate(t => ({ ...t, candidateUserId: e.target.value }))} />
                  <input className={`${inputCls} flex-[2]`} placeholder="Short Manifesto" value={tempCandidate.manifesto} onChange={e => setTempCandidate(t => ({ ...t, manifesto: e.target.value }))} />
                  <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />} onClick={e => handleAddTempCandidate(e, false)}>Add</Button>
                </div>
              </div>

              <Button variant="success" className="w-full" onClick={handleCreateElection}>Initialize Election</Button>
            </Card>

            {/* Election records */}
            <h5 className="mb-3 font-bold text-slate-900 dark:text-white">Election Records</h5>
            {club.elections?.length === 0 ? (
              <p className="text-sm italic text-slate-400">No elections on record.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {club.elections?.map(election => (
                  <Card key={election._id} variant="default" padding="md">
                    {editingElectionId === election._id ? (
                      <div>
                        <h6 className="mb-3 font-bold text-amber-600 dark:text-amber-400">Edit Election</h6>
                        <select className={`${inputCls} mb-3`} value={editElectionData.position} onChange={e => setEditElectionData(d => ({ ...d, position: e.target.value }))}>
                          <option value="">-- Select Position --</option>
                          {AVAILABLE_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        {editElectionData.candidates.length > 0 && (
                          <ul className="mb-3 flex flex-col gap-1.5">
                            {editElectionData.candidates.map((c, idx) => {
                              const name = club.members?.find(m => m._id === (c.candidateUserId || c.user))?.name || 'Unknown';
                              return (
                                <li key={idx} className="flex items-center justify-between rounded-xl bg-slate-50/60 px-3 py-2 dark:bg-white/5">
                                  <span className="text-sm"><strong className="text-slate-900 dark:text-white">{name}</strong> <em className="text-slate-400">— {c.manifesto}</em></span>
                                  <button type="button" onClick={() => handleRemoveTempCandidate(idx, true)} aria-label="Remove" className="ml-2 text-rose-500"><X size={14} /></button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <div className="mb-4 flex flex-wrap gap-2">
                          <MemberSelect value={editTempCandidate.candidateUserId} onChange={e => setEditTempCandidate(t => ({ ...t, candidateUserId: e.target.value }))} isEdit />
                          <input className={`${inputCls} flex-[2]`} placeholder="Manifesto" value={editTempCandidate.manifesto} onChange={e => setEditTempCandidate(t => ({ ...t, manifesto: e.target.value }))} />
                          <Button size="sm" variant="secondary" leftIcon={<Plus size={14} />} onClick={e => handleAddTempCandidate(e, true)}>Add</Button>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="success" className="flex-1" onClick={() => handleUpdateElection(election._id)}>Save</Button>
                          <Button variant="ghost" onClick={() => setEditingElectionId(null)}>Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                          <h5 className="text-base font-bold text-slate-900 dark:text-white">{election.position}</h5>
                          <div className="flex gap-2">
                            <Button size="sm" variant={election.isActive ? 'danger' : 'success'} onClick={() => handleToggleElection(election._id, !election.isActive, election.isPublished)}>
                              {election.isActive ? 'Close Voting' : 'Open Voting'}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleToggleElection(election._id, false, !election.isPublished)}>
                              {election.isPublished ? 'Hide Results' : 'Publish Results'}
                            </Button>
                          </div>
                        </div>

                        <div className="mb-3 border-t border-slate-200/60 pt-3 dark:border-white/10">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Live Tally — {election.votedUsers?.length || 0} votes</p>
                          <ul className="flex flex-col gap-1.5">
                            {election.candidates?.map(c => {
                              const name = club.members?.find(m => m._id === c.user)?.name || 'Unknown';
                              return <li key={c._id} className="text-sm text-slate-700 dark:text-slate-300">{name}: <strong className="text-slate-900 dark:text-white">{c.voteCount}</strong></li>;
                            })}
                            {election.candidates?.length === 0 && <li className="text-sm italic text-slate-400">No candidates.</li>}
                          </ul>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-slate-200/60 pt-3 dark:border-white/10">
                          {!election.isActive && !election.isPublished && election.votedUsers.length === 0 && (
                            <Button size="sm" variant="ghost" leftIcon={<PenLine size={13} />} onClick={() => { setEditingElectionId(election._id); setEditElectionData({ position: election.position, candidates: election.candidates.map(c => ({ candidateUserId: c.user, manifesto: c.manifesto })) }); }}>Edit</Button>
                          )}
                          <Button size="sm" variant="danger" leftIcon={<Trash2 size={13} />} onClick={() => handleDeleteElection(election._id)}>Delete</Button>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

export default ClubElections;
