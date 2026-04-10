import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, PenLine, Trash2, X } from 'lucide-react';
import api from '../../config/api';
import ClubNavigation from '../../components/ClubNavigation';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FormInput from '../../components/FormInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import { staggerContainer, staggerItem, scaleUp } from '../../hooks/animationVariants';

function ImageCarousel({ images, title }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) {
    return (
      <div className="flex h-48 items-center justify-center bg-slate-200/60 dark:bg-slate-800">
        <span className="text-sm italic text-slate-400">No images</span>
      </div>
    );
  }
  return (
    <div className="relative h-48 overflow-hidden bg-black">
      <img src={`http://localhost:5000${images[idx]}`} alt={`${title} — ${idx + 1}`}
        className="h-full w-full object-cover opacity-90 transition-opacity"
        onError={e => { e.target.src = 'https://placehold.co/400x200?text=Image+not+found'; }}
      />
      {images.length > 1 && (
        <>
          <button type="button" aria-label="Previous image" onClick={() => setIdx(p => p === 0 ? images.length - 1 : p - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          ><ChevronLeft size={16} /></button>
          <button type="button" aria-label="Next image" onClick={() => setIdx(p => p === images.length - 1 ? 0 : p + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          ><ChevronRight size={16} /></button>
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs text-white backdrop-blur-sm">{idx + 1}/{images.length}</span>
        </>
      )}
    </div>
  );
}

function AchievementShowcase() {
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', dateAwarded: '', images: [] });
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { fetchClubData(); }, [id]);
  const fetchClubData = () => api.get(`/clubs/${id}`).then(r => setClub(r.data)).catch(console.error);

  if (!club) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner text="Loading Trophy Room…" /></div>;

  const isSupervisor = club.supervisor === currentUser?.id;
  const isPresident = club.president?._id === currentUser?.id || club.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const canManage = isPresident || isSupervisor || club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Secretary', 'Assistant Secretary'].includes(b.role));

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('userId', currentUser?.id);
    ['title', 'description', 'dateAwarded'].forEach(k => data.append(k, formData[k]));
    formData.images.forEach(f => data.append('images', f));
    const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
    const req = editingId
      ? api.put(`/clubs/${id}/achievements/${editingId}`, data, cfg)
      : api.post(`/clubs/${id}/achievements`, data, cfg);
    req.then(r => { alert(r.data.message); resetForm(); fetchClubData(); })
       .catch(err => alert(err.response?.data?.message || 'Error.'));
  };

  const handleDelete = (achvId) => {
    if (!window.confirm('Delete this achievement and its photos?')) return;
    api.delete(`/clubs/${id}/achievements/${achvId}`, { data: { requestorId: currentUser?.id } })
      .then(r => { alert(r.data.message); fetchClubData(); })
      .catch(() => alert('Error deleting.'));
  };

  const resetForm = () => { setFormData({ title: '', description: '', dateAwarded: '', images: [] }); setEditingId(null); setShowForm(false); };
  const openEdit = (a) => { setFormData({ title: a.title, description: a.description, dateAwarded: a.dateAwarded, images: [] }); setEditingId(a._id); setShowForm(true); };

  return (
    <PageWrapper
      title="Trophy Room"
      subtitle={`Celebrating the milestones of ${club.name}`}
      rightContent={
        canManage && (
          <Button size="sm" leftIcon={showForm ? <X size={14} /> : <Plus size={14} />} onClick={() => { setShowForm(p => !p); setEditingId(null); }}>
            {showForm ? 'Cancel' : 'New Achievement'}
          </Button>
        )
      }
    >
      <ClubNavigation club={club} />

      {/* Form */}
      <AnimatePresence>
        {showForm && canManage && (
          <motion.div key="form" variants={scaleUp} initial="hidden" animate="visible" exit="exit" className="my-6">
            <Card variant="glass" padding="lg">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Achievement' : 'Upload Achievement'}</h3>
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <FormInput label="Title" value={formData.title} onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Best Tech Club 2025" />
                <FormInput label="Date / Event" value={formData.dateAwarded} onChange={e => setFormData(f => ({ ...f, dateAwarded: e.target.value }))} required placeholder="e.g. March 15, 2026" />
                <div className="sm:col-span-2">
                  <FormInput label="Description" value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Photos {editingId && <span className="text-xs text-slate-400">(new upload replaces old)</span>}
                  </label>
                  <input type="file" accept="image/*" multiple required={!editingId} onChange={e => setFormData(f => ({ ...f, images: Array.from(e.target.files) }))}
                    className="w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-amber-700 hover:file:bg-amber-100 dark:file:bg-amber-900/40 dark:file:text-amber-300"
                  />
                  <p className="mt-1 text-xs text-slate-400">Hold CTRL / CMD to select multiple photos.</p>
                </div>
                <div className="flex gap-3 sm:col-span-2">
                  <Button type="submit" variant="success" className="flex-1">{editingId ? 'Save Changes' : 'Publish'}</Button>
                  <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {!club.achievements?.length ? (
        <p className="mt-10 text-center text-slate-400">No achievements yet. The trophy case is waiting!</p>
      ) : (
        <motion.ul
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate="visible"
          className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[...club.achievements].reverse().map(achv => {
            const imgs = achv.imageUrls?.length ? achv.imageUrls : achv.imageUrl ? [achv.imageUrl] : [];
            return (
              <motion.li key={achv._id} variants={staggerItem} className="flex">
                <Card variant="glass" padding="none" className="flex w-full flex-col overflow-hidden">
                  <ImageCarousel images={imgs} title={achv.title} />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-500 dark:text-amber-400">{achv.dateAwarded}</p>
                    <h3 className="font-bold text-slate-900 dark:text-white">{achv.title}</h3>
                    <p className="flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{achv.description}</p>
                    {(canManage || isSupervisor) && (
                      <div className="flex gap-2 border-t border-slate-200/60 pt-3 dark:border-white/10">
                        <Button size="sm" variant="ghost" leftIcon={<PenLine size={13} />} className="flex-1" onClick={() => openEdit(achv)}>Edit</Button>
                        <Button size="sm" variant="danger" leftIcon={<Trash2 size={13} />} className="flex-1" onClick={() => handleDelete(achv._id)}>Delete</Button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </PageWrapper>
  );
}

export default AchievementShowcase;
