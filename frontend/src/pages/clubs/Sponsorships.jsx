import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, PenLine, Trash2, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import api from '../../config/api';
import ClubNavigation from '../../components/ClubNavigation';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/FormInput';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import { staggerContainer, staggerItem, scaleUp } from '../../hooks/animationVariants';

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

function Sponsorships() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [proposalData, setProposalData] = useState({ title: '', description: '', targetAmount: '', proposalDocumentUrl: '' });
  const [pledgeData, setPledgeData] = useState({ companyName: '', contactEmail: '', amount: '', message: '' });
  const [activePledgeForm, setActivePledgeForm] = useState(null);
  const [editingProposalId, setEditingProposalId] = useState(null);
  const [editProposalData, setEditProposalData] = useState({ title: '', description: '', targetAmount: '', proposalDocumentUrl: '', isActive: true });
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchClubData(); }, [id]);
  const fetchClubData = () => api.get(`/clubs/${id}`).then(r => setClub(r.data)).catch(console.error);

  if (!club) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner text="Loading Corporate Portal…" /></div>;

  const isSupervisor = currentUser?.role === 'supervisor';
  const isPresident = club.president?._id === currentUser?.id;
  const canManage = isPresident || isSupervisor || club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Vice President', 'Secretary', 'Assistant Secretary', 'Treasurer', 'Assistant Treasurer'].includes(b.role));

  const handlePublishProposal = (e) => {
    e.preventDefault();
    api.post(`/clubs/${id}/proposals`, { ...proposalData, userId: currentUser?.id })
      .then(r => { alert(r.data.message); setProposalData({ title: '', description: '', targetAmount: '', proposalDocumentUrl: '' }); fetchClubData(); })
      .catch(err => alert(err.response?.data?.message || 'Error.'));
  };

  const handleUpdateProposal = (proposalId) => {
    api.put(`/clubs/${id}/proposals/${proposalId}/edit`, { ...editProposalData, userId: currentUser?.id })
      .then(() => { setEditingProposalId(null); fetchClubData(); })
      .catch(() => alert('Error updating.'));
  };

  const handleDeleteProposal = (proposalId) => {
    if (!window.confirm('Delete this proposal and all pledges?')) return;
    api.delete(`/clubs/${id}/proposals/${proposalId}`, { data: { userId: currentUser?.id } })
      .then(() => fetchClubData()).catch(() => alert('Error.'));
  };

  const handleSubmitPledge = (e, proposalId) => {
    e.preventDefault();
    api.post(`/clubs/${id}/proposals/${proposalId}/pledge`, pledgeData)
      .then(r => { alert(r.data.message); setPledgeData({ companyName: '', contactEmail: '', amount: '', message: '' }); setActivePledgeForm(null); fetchClubData(); })
      .catch(() => alert('Error submitting pledge.'));
  };

  const handlePledgeStatus = (proposalId, pledgeId, status) => {
    api.put(`/clubs/${id}/proposals/${proposalId}/pledge/${pledgeId}`, { status, userId: currentUser?.id })
      .then(() => fetchClubData()).catch(() => alert('Error.'));
  };

  const pledgeStatusMap = { Accepted: 'APPROVED', Rejected: 'REJECTED', Pending: 'PENDING' };

  return (
    <PageWrapper title="Corporate Partnerships" subtitle={`Partner with ${club.name} to support student growth`}>
      <ClubNavigation club={club} />

      <div className={`mt-6 grid gap-6 ${canManage ? 'lg:grid-cols-[1fr_360px]' : ''}`}>

        {/* Main column: proposals */}
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Funding Initiatives</h2>

          {club.proposals?.filter(p => p.isActive || canManage).length === 0 ? (
            <Card variant="glass" padding="lg" className="text-center">
              <p className="text-slate-400">No active proposals. Check back later.</p>
            </Card>
          ) : (
            <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible" className="flex flex-col gap-5">
              {club.proposals?.filter(p => p.isActive || canManage).map(proposal => {
                const totalRaised = proposal.pledges?.filter(p => p.status === 'Accepted').reduce((s, p) => s + p.amount, 0) || 0;
                const percent = Math.min((totalRaised / proposal.targetAmount) * 100, 100).toFixed(0);

                return (
                  <motion.div key={proposal._id} variants={staggerItem}>
                    <Card variant="glass" padding="md" className={!proposal.isActive ? 'opacity-60' : ''}>
                      {editingProposalId === proposal._id ? (
                        /* Edit mode */
                        <div className="flex flex-col gap-3">
                          <h4 className="font-bold text-indigo-600 dark:text-indigo-400">Edit Proposal</h4>
                          <input className={inputCls} placeholder="Title" value={editProposalData.title} onChange={e => setEditProposalData(f => ({ ...f, title: e.target.value }))} />
                          <textarea className={`${inputCls} min-h-[80px]`} placeholder="Description" value={editProposalData.description} onChange={e => setEditProposalData(f => ({ ...f, description: e.target.value }))} />
                          <div className="grid grid-cols-2 gap-3">
                            <input type="number" className={inputCls} placeholder="Target (Rs.)" value={editProposalData.targetAmount} onChange={e => setEditProposalData(f => ({ ...f, targetAmount: e.target.value }))} />
                            <input className={inputCls} placeholder="Document URL" value={editProposalData.proposalDocumentUrl} onChange={e => setEditProposalData(f => ({ ...f, proposalDocumentUrl: e.target.value }))} />
                          </div>
                          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                            <input type="checkbox" checked={editProposalData.isActive} onChange={e => setEditProposalData(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-indigo-600" />
                            Active (visible to public)
                          </label>
                          <div className="flex gap-2">
                            <Button variant="success" size="sm" className="flex-1" onClick={() => handleUpdateProposal(proposal._id)}>Save</Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingProposalId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        /* Display mode */
                        <>
                          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-bold text-slate-900 dark:text-white">{proposal.title}</h4>
                              {!proposal.isActive && <span className="text-xs text-slate-400">Closed / Inactive</span>}
                            </div>
                            <div className="flex gap-2">
                              {proposal.proposalDocumentUrl && (
                                <Button as="a" href={proposal.proposalDocumentUrl} target="_blank" rel="noreferrer" variant="ghost" size="sm" leftIcon={<ExternalLink size={13} />}>PDF</Button>
                              )}
                              {canManage && (
                                <>
                                  <Button size="sm" variant="ghost" leftIcon={<PenLine size={13} />} aria-label="Edit" onClick={() => { setEditingProposalId(proposal._id); setEditProposalData({ title: proposal.title, description: proposal.description, targetAmount: proposal.targetAmount, proposalDocumentUrl: proposal.proposalDocumentUrl || '', isActive: proposal.isActive }); }} />
                                  <Button size="sm" variant="danger" leftIcon={<Trash2 size={13} />} aria-label="Delete" onClick={() => handleDeleteProposal(proposal._id)} />
                                </>
                              )}
                            </div>
                          </div>

                          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{proposal.description}</p>

                          {/* Progress bar */}
                          <div className="mb-4 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                            <div className="mb-2 flex justify-between text-xs font-semibold">
                              <span className="text-emerald-600 dark:text-emerald-400">Raised: Rs. {totalRaised.toLocaleString()}</span>
                              <span className="text-slate-500 dark:text-slate-400">Goal: Rs. {proposal.targetAmount.toLocaleString()}</span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percent}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full rounded-full ${Number(percent) >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              />
                            </div>
                            <p className="mt-1.5 text-right text-xs text-slate-400">{percent}%</p>
                          </div>

                          {/* Pledge form toggle */}
                          {activePledgeForm === proposal._id ? (
                            <AnimatePresence>
                              <motion.form variants={scaleUp} initial="hidden" animate="visible" exit="exit" onSubmit={e => handleSubmitPledge(e, proposal._id)} className="flex flex-col gap-3 rounded-2xl bg-slate-50/60 p-4 dark:bg-white/5">
                                <h5 className="font-bold text-indigo-600 dark:text-indigo-400">Submit Corporate Pledge</h5>
                                <div className="grid grid-cols-2 gap-3">
                                  <input className={inputCls} placeholder="Company Name" required onChange={e => setPledgeData(f => ({ ...f, companyName: e.target.value }))} />
                                  <input type="email" className={inputCls} placeholder="Contact Email" required onChange={e => setPledgeData(f => ({ ...f, contactEmail: e.target.value }))} />
                                </div>
                                <input type="number" className={inputCls} placeholder="Pledge Amount (Rs.)" required onChange={e => setPledgeData(f => ({ ...f, amount: e.target.value }))} />
                                <textarea className={`${inputCls} min-h-[70px]`} placeholder="Optional message…" onChange={e => setPledgeData(f => ({ ...f, message: e.target.value }))} />
                                <div className="flex gap-2">
                                  <Button type="submit" className="flex-1">Submit Offer</Button>
                                  <Button type="button" variant="ghost" onClick={() => setActivePledgeForm(null)}>Cancel</Button>
                                </div>
                              </motion.form>
                            </AnimatePresence>
                          ) : (
                            proposal.isActive && (
                              <Button className="w-full" onClick={() => setActivePledgeForm(proposal._id)}>Sponsor This Initiative</Button>
                            )
                          )}
                        </>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Right column: admin tools */}
        {canManage && (
          <div className="flex flex-col gap-5">

            {/* Publish form */}
            <Card variant="glass" padding="md">
              <h4 className="mb-4 font-bold text-slate-900 dark:text-white">Publish Proposal</h4>
              <form onSubmit={handlePublishProposal} className="flex flex-col gap-3">
                <input className={inputCls} placeholder="Proposal Title" required value={proposalData.title} onChange={e => setProposalData(f => ({ ...f, title: e.target.value }))} />
                <textarea className={`${inputCls} min-h-[90px]`} placeholder="Pitch your initiative…" required value={proposalData.description} onChange={e => setProposalData(f => ({ ...f, description: e.target.value }))} />
                <input type="number" className={inputCls} placeholder="Target Amount (Rs.)" required value={proposalData.targetAmount} onChange={e => setProposalData(f => ({ ...f, targetAmount: e.target.value }))} />
                <input className={inputCls} placeholder="PDF Document URL (optional)" value={proposalData.proposalDocumentUrl} onChange={e => setProposalData(f => ({ ...f, proposalDocumentUrl: e.target.value }))} />
                <Button type="submit" className="w-full" leftIcon={<Plus size={14} />}>Publish</Button>
              </form>
            </Card>

            {/* Pledge inbox */}
            <Card variant="glass" padding="md">
              <h4 className="mb-4 font-bold text-slate-900 dark:text-white">Pledge Inbox</h4>
              <div className="flex flex-col gap-4">
                {club.proposals?.map(prop => (
                  <div key={prop._id}>
                    <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{prop.title}</p>
                    {prop.pledges.length === 0 ? (
                      <p className="text-xs italic text-slate-400">No pledges yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {prop.pledges.map(pledge => (
                          <div key={pledge._id} className="rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white">{pledge.companyName}</p>
                              <StatusBadge status={pledgeStatusMap[pledge.status] || 'PENDING'} />
                            </div>
                            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Rs. {pledge.amount.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">{pledge.contactEmail}</p>
                            {pledge.message && (
                              <p className="mt-1 border-l-2 border-slate-300 pl-2 text-xs italic text-slate-500 dark:border-white/20 dark:text-slate-400">"{pledge.message}"</p>
                            )}
                            {pledge.status === 'Pending' && (
                              <div className="mt-2 flex gap-2">
                                <Button size="xs" variant="success" leftIcon={<CheckCircle size={12} />} className="flex-1" onClick={() => handlePledgeStatus(prop._id, pledge._id, 'Accepted')}>Accept</Button>
                                <Button size="xs" variant="danger" leftIcon={<XCircle size={12} />} className="flex-1" onClick={() => handlePledgeStatus(prop._id, pledge._id, 'Rejected')}>Reject</Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )}

      </div>
    </PageWrapper>
  );
}

export default Sponsorships;
