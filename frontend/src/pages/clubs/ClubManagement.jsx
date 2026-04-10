import { useState, useEffect } from 'react';
import api from '../../config/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, CreditCard, PenLine, Trash2, Plus, X, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { staggerContainer, staggerItem, scaleUp } from '../../hooks/animationVariants';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/StatusBadge';
import FormInput from '../../components/FormInput';
import PageWrapper from '../../components/PageWrapper';

const inputCls = [
  'w-full rounded-2xl px-4 py-2.5 text-sm outline-none transition-all duration-150',
  'border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400',
  'dark:border-white/10 dark:bg-slate-950/40 dark:text-white dark:placeholder:text-slate-500',
  'focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30',
].join(' ');

function ClubManagement() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', membershipFee: '', logoFile: null });
  const [editingClubId, setEditingClubId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [viewFilter, setViewFilter] = useState('all');

  const { ref: bannerRef, ...bannerReveal } = useScrollReveal();

  const fetchClubs = () => {
    api.get('/clubs').then(res => setClubs(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchClubs();
    if (currentUser?.role === 'supervisor') {
      api.get('/auth/users').then(res => setUsers(res.data)).catch(console.error);
    }
  }, [currentUser]);

  const handleCreateClub = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('supervisorId', currentUser.id);
    ['name', 'description', 'mission', 'rulesAndRegulations', 'membershipFee'].forEach(k => data.append(k, formData[k]));
    if (formData.presidentId) data.append('presidentId', formData.presidentId);
    if (formData.logoFile) data.append('logo', formData.logoFile);
    api.post('/clubs', data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => { fetchClubs(); setFormData({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', membershipFee: '', logoFile: null }); setShowCreateForm(false); })
      .catch(err => alert(err.response?.data?.message || 'Error creating club.'));
  };

  const handleEditClick = (club) => {
    setEditingClubId(club._id);
    setFormData({ name: club.name, description: club.description, mission: club.mission, rulesAndRegulations: club.rulesAndRegulations || '', membershipFee: club.membershipFee || 0, presidentId: club.president?._id || '', logoFile: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateClub = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('supervisorId', currentUser.id);
    ['name', 'description', 'mission', 'rulesAndRegulations', 'membershipFee', 'presidentId'].forEach(k => data.append(k, formData[k]));
    if (formData.logoFile) data.append('logo', formData.logoFile);
    api.put(`/clubs/${editingClubId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => { fetchClubs(); setEditingClubId(null); setFormData({ name: '', description: '', mission: '', presidentId: '', rulesAndRegulations: '', membershipFee: '', logoFile: null }); setShowCreateForm(false); })
      .catch(err => alert(err.response?.data?.message || 'Error updating club.'));
  };

  const handleDeleteClub = (clubId) => {
    if (window.confirm('Are you sure you want to delete this club?')) {
      api.delete(`/clubs/${clubId}`, { data: { supervisorId: currentUser.id } })
        .then(() => fetchClubs())
        .catch(() => alert('Error deleting club.'));
    }
  };

  const handleApproveAnnouncement = (clubId, annId) => {
    api.put(`/clubs/${clubId}/announcements/${annId}/approve`, { supervisorId: currentUser.id })
      .then(() => fetchClubs()).catch(() => alert('Error approving.'));
  };

  const handleRejectAnnouncement = (clubId, annId) => {
    if (window.confirm('Reject and delete this announcement?')) {
      api.delete(`/clubs/${clubId}/announcements/${annId}`, { data: { supervisorId: currentUser.id } })
        .then(() => fetchClubs()).catch(() => alert('Error rejecting.'));
    }
  };

  const pendingAnnouncements = clubs.flatMap(club =>
    (club.announcements || []).filter(ann => !ann.isApproved).map(ann => ({ ...ann, clubName: club.name, clubId: club._id }))
  );

  const eligibleUsers = users.filter(user => {
    if (user.role !== 'student') return false;
    return !clubs.some(c => {
      if (editingClubId && c._id === editingClubId) return false;
      return c.president?._id === user._id || c.president === user._id;
    });
  });

  const filteredAndSortedClubs = clubs
    .filter(club => {
      if (viewFilter === 'my-clubs' && currentUser) {
        const isMember = club.members.some(m => m._id === currentUser.id);
        const isPresident = club.president?._id === currentUser.id;
        if (!isMember && !isPresident) return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return club.name.toLowerCase().includes(q) || club.description.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'members-desc') return (b.members?.length || 0) - (a.members?.length || 0);
      if (sortOption === 'fee-asc') return (a.membershipFee || 0) - (b.membershipFee || 0);
      return 0;
    });

  const formOpen = showCreateForm || !!editingClubId;

  return (
    <PageWrapper
      title="Campus Directory"
      subtitle="Discover, join, and manage university clubs"
      rightContent={
        currentUser?.role === 'supervisor' && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" leftIcon={<BarChart3 size={15} />} as={Link} to="/supervisor/analytics">
              Analytics
            </Button>
            <Button size="sm" leftIcon={formOpen ? <X size={15} /> : <Plus size={15} />} onClick={() => { setShowCreateForm(p => !p); setEditingClubId(null); }}>
              {formOpen ? 'Close Form' : 'New Club'}
            </Button>
          </div>
        )
      }
    >

      {/* ── Supervisor: Create / Edit form ── */}
      <AnimatePresence>
        {formOpen && currentUser?.role === 'supervisor' && (
          <motion.div
            key="club-form"
            variants={scaleUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mb-8"
          >
            <Card variant="glass" padding="lg">
              <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
                {editingClubId ? 'Edit Club' : 'Register New Club'}
              </h2>
              <form onSubmit={editingClubId ? handleUpdateClub : handleCreateClub} className="grid gap-4 sm:grid-cols-2">
                <FormInput label="Club Name" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} required />
                <FormInput label="Membership Fee (Rs.)" type="number" value={formData.membershipFee} onChange={e => setFormData(f => ({ ...f, membershipFee: e.target.value }))} required />
                <div className="sm:col-span-2">
                  <FormInput label="Description" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} required />
                </div>
                <div className="sm:col-span-2">
                  <FormInput label="Mission" value={formData.mission} onChange={e => setFormData(f => ({ ...f, mission: e.target.value }))} required />
                </div>
                <div className="sm:col-span-2">
                  <FormInput label="Rules & Regulations" value={formData.rulesAndRegulations} onChange={e => setFormData(f => ({ ...f, rulesAndRegulations: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Assign President</label>
                  <select className={inputCls} value={formData.presidentId} onChange={e => setFormData(f => ({ ...f, presidentId: e.target.value }))}>
                    <option value="">-- No President --</option>
                    {eligibleUsers.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Club Logo</label>
                  <input type="file" accept="image/*" onChange={e => setFormData(f => ({ ...f, logoFile: e.target.files[0] }))}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900/40 dark:file:text-indigo-300"
                  />
                </div>
                <div className="flex gap-3 sm:col-span-2">
                  <Button type="submit" className="flex-1">{editingClubId ? 'Save Changes' : 'Register Club'}</Button>
                  <Button type="button" variant="secondary" onClick={() => { setEditingClubId(null); setShowCreateForm(false); }}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Supervisor: Pending announcements ── */}
      {currentUser?.role === 'supervisor' && pendingAnnouncements.length > 0 && (
        <Card variant="default" padding="md" className="mb-8 border-l-4 border-rose-500">
          <h2 className="mb-4 font-bold text-rose-600 dark:text-rose-400">
            Action Centre — {pendingAnnouncements.length} Pending Approval{pendingAnnouncements.length > 1 ? 's' : ''}
          </h2>
          <div className="flex flex-col gap-3">
            {pendingAnnouncements.map(ann => (
              <div key={ann._id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-slate-50/60 p-4 dark:bg-white/5">
                <div>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-rose-500">{ann.clubName}</span>
                  <p className="font-semibold text-slate-900 dark:text-white">{ann.title}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ann.content}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="success" leftIcon={<CheckCircle size={14} />} onClick={() => handleApproveAnnouncement(ann.clubId, ann._id)}>Approve</Button>
                  <Button size="sm" variant="danger" leftIcon={<XCircle size={14} />} onClick={() => handleRejectAnnouncement(ann.clubId, ann._id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Guest banner ── */}
      {!currentUser && (
        <motion.div ref={bannerRef} {...bannerReveal} className="mb-6">
          <Card variant="glass" padding="md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You're browsing as a guest. Sign in to join clubs and access full features.
              </p>
              <div className="flex gap-2">
                <Button as={Link} to="/login" size="sm">Sign In</Button>
                <Button as={Link} to="/signup" variant="secondary" size="sm">Sign Up</Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Search / filter bar ── */}
      <Card variant="glass" padding="sm" className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search clubs…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>
          <select className={`${inputCls} w-auto min-w-[140px]`} value={sortOption} onChange={e => setSortOption(e.target.value)}>
            <option value="name-asc">Sort: A–Z</option>
            <option value="members-desc">Most Members</option>
            <option value="fee-asc">Lowest Fee</option>
          </select>
          {currentUser?.role === 'student' && (
            <div className="flex gap-2">
              <Button size="sm" variant={viewFilter === 'all' ? 'primary' : 'ghost'} onClick={() => setViewFilter('all')}>All</Button>
              <Button size="sm" variant={viewFilter === 'my-clubs' ? 'success' : 'ghost'} onClick={() => setViewFilter('my-clubs')}>My Clubs</Button>
            </div>
          )}
        </div>
      </Card>

      {/* ── Club grid ── */}
      {filteredAndSortedClubs.length === 0 ? (
        <Card variant="glass" padding="lg" className="text-center">
          <p className="text-slate-400">No clubs match your criteria.</p>
        </Card>
      ) : (
        <motion.ul
          variants={staggerContainer(0.06)}
          initial="hidden"
          animate="visible"
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredAndSortedClubs.map(club => (
            <motion.li key={club._id} variants={staggerItem} className="flex">
              <Card variant="glass" padding="md" hover className="flex w-full flex-col gap-3">

                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200/60 dark:bg-white/10 text-xl font-bold text-indigo-600 dark:text-indigo-300">
                    {club.logoUrl
                      ? <img src={`http://localhost:5000${club.logoUrl}`} alt={club.name} className="h-full w-full object-cover" />
                      : club.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-bold text-slate-900 dark:text-white">{club.name}</h3>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {currentUser && club.president?._id === currentUser.id && (
                        <StatusBadge status="PRESIDENT" />
                      )}
                      {club.members?.length >= 3 && (
                        <span className="inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600 dark:bg-rose-400/15 dark:text-rose-300">Trending</span>
                      )}
                      {club.elections?.some(e => e.isActive) && (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">Elections</span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="flex-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-3">
                  {club.description}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><Users size={13} />{club.members?.length || 0} members</span>
                  <span className="flex items-center gap-1"><CreditCard size={13} />Rs. {club.membershipFee}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {currentUser
                    ? <Button variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/clubs/${club._id}`)}>View Hub</Button>
                    : <Button as={Link} to="/login" variant="secondary" size="sm" className="flex-1">Login to explore</Button>
                  }
                  {currentUser?.role === 'supervisor' && (
                    <>
                      <Button size="sm" variant="ghost" aria-label={`Edit ${club.name}`} leftIcon={<PenLine size={14} />} onClick={() => handleEditClick(club)} />
                      <Button size="sm" variant="danger" aria-label={`Delete ${club.name}`} leftIcon={<Trash2 size={14} />} onClick={() => handleDeleteClub(club._id)} />
                    </>
                  )}
                </div>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </PageWrapper>
  );
}

export default ClubManagement;
