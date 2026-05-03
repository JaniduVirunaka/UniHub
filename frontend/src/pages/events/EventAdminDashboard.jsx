import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService, eventService, registrationService } from '../../services/services';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import { scaleUp, staggerContainer, staggerItem } from '../../hooks/animationVariants';
import { useCountUp } from '../../hooks/useCountUp';
import { Calendar, Users, Clock, BarChart2, Trash2, Plus, X, ChevronLeft, ChevronRight, Star, MapPin, MessageSquare, Pencil, Save } from 'lucide-react';

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

function KpiCard({ icon, value, label, color }) {
  const { ref: countRef, displayValue } = useCountUp(value, 900);
  return (
    <Card variant="glass" padding="md" className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color}`}>{icon}</div>
      <div>
        <p ref={countRef} className="text-2xl font-extrabold text-slate-900 dark:text-white">{displayValue}</p>
        <p className="text-sm text-slate-500 dark:text-slate-300">{label}</p>
      </div>
    </Card>
  );
}

const regStatusBadgeMap = { pending_payment: 'PENDING', registered: 'APPROVED', cancelled: 'INACTIVE' };

const TABS = ['dashboard', 'events', 'registrations', 'reviews'];
const TAB_LABELS = { dashboard: 'Dashboard', events: 'Manage Events', registrations: 'Registrations', reviews: 'Reviews' };

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, pendingPayments: 0, registeredCount: 0, cancelledCount: 0 });
  const [registrations, setRegistrations] = useState([]);
  const [regTotal, setRegTotal] = useState(0);
  const [regFilter, setRegFilter] = useState('');
  const [regEventFilter, setRegEventFilter] = useState('');
  const [regPage, setRegPage] = useState(1);
  const [verifyModal, setVerifyModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [reviews, setReviews] = useState([]);

  const [newEventForm, setNewEventForm] = useState({
    title: '', description: '', eventType: 'event', location: '',
    date: '', time: '', totalCapacity: '',
    isUnlimitedCapacity: false,
    isTicketed: false,
    tickets: [],
    bankAccount: '', whatsappNumber: '',
    paymentMessage: 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.',
    imageFile: null,
  });

  const fetchStats = useCallback(async () => {
    try {
      const res = await registrationService.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      const params = { page: regPage, limit: 20 };
      if (regFilter) params.status = regFilter;
      if (regEventFilter) params.eventId = regEventFilter;
      const res = await registrationService.getAllRegistrations(params);
      setRegistrations(res.data.registrations);
      setRegTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch registrations', err);
    }
  }, [regPage, regFilter, regEventFilter]);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await authService.getAllReviews();
      setReviews(res.data);
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await eventService.getAllEvents();
        setEvents(res.data);
        await fetchStats();
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'registrations') fetchRegistrations();
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab, fetchRegistrations, fetchReviews]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewEventForm(p => ({ ...p, [name]: value }));
  };

  const handleImageChange = e => {
    if (e.target.files && e.target.files[0]) {
      setNewEventForm(p => ({ ...p, imageFile: e.target.files[0] }));
    }
  };

  const handleUnlimitedToggle = () => {
    setNewEventForm(p => ({
      ...p,
      isUnlimitedCapacity: !p.isUnlimitedCapacity,
      totalCapacity: !p.isUnlimitedCapacity ? '' : p.totalCapacity
    }));
  };

  const handleTicketedToggle = () => {
    setNewEventForm(p => {
      const nowTicketed = !p.isTicketed;
      return {
        ...p,
        isTicketed: nowTicketed,
        tickets: nowTicketed && p.tickets.length === 0 ? [{ name: '', price: '' }] : p.tickets,
      };
    });
  };

  const handleAddTicket = () => {
    setNewEventForm(p => ({ ...p, tickets: [...p.tickets, { name: '', price: '' }] }));
  };

  const handleRemoveTicket = (idx) => {
    setNewEventForm(p => ({ ...p, tickets: p.tickets.filter((_, i) => i !== idx) }));
  };

  const handleTicketChange = (idx, field, value) => {
    setNewEventForm(p => ({
      ...p,
      tickets: p.tickets.map((t, i) => i === idx ? { ...t, [field]: value } : t),
    }));
  };

  const openEditModal = (event) => {
    const dateStr = event.date ? new Date(event.date).toISOString().split('T')[0] : '';
    setEditModal({
      eventId: event._id,
      form: {
        title:               event.title        || '',
        description:         event.description  || '',
        eventType:           event.eventType    || 'event',
        location:            event.location     || '',
        date:                dateStr,
        time:                event.time         || '',
        isUnlimitedCapacity: (event.totalCapacity >= 999999),
        totalCapacity:       event.totalCapacity >= 999999 ? '' : String(event.totalCapacity || ''),
        isTicketed:          event.isTicketed   || false,
        tickets:             Array.isArray(event.tickets) && event.tickets.length > 0
                               ? event.tickets.map(t => ({ name: t.name, price: String(t.price) }))
                               : [],
        bankAccount:         event.bankAccount    || '',
        whatsappNumber:      event.whatsappNumber || '',
        paymentMessage:      event.paymentMessage || 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.',
        imageFile:           null,
        existingImage:       event.posterImage || event.thumbnail || null,
      },
    });
  };

  const setEditForm = (updater) =>
    setEditModal(prev => ({ ...prev, form: updater(prev.form) }));

  const handleEditInputChange = e => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };

  const handleEditImageChange = e => {
    if (e.target.files?.[0]) setEditForm(f => ({ ...f, imageFile: e.target.files[0] }));
  };

  const handleEditUnlimitedToggle = () =>
    setEditForm(f => ({ ...f, isUnlimitedCapacity: !f.isUnlimitedCapacity, totalCapacity: !f.isUnlimitedCapacity ? '' : f.totalCapacity }));

  const handleEditTicketedToggle = () =>
    setEditForm(f => {
      const nowTicketed = !f.isTicketed;
      return { ...f, isTicketed: nowTicketed, tickets: nowTicketed && f.tickets.length === 0 ? [{ name: '', price: '' }] : f.tickets };
    });

  const handleEditAddTicket    = () => setEditForm(f => ({ ...f, tickets: [...f.tickets, { name: '', price: '' }] }));
  const handleEditRemoveTicket = (idx) => setEditForm(f => ({ ...f, tickets: f.tickets.filter((_, i) => i !== idx) }));
  const handleEditTicketChange = (idx, field, value) =>
    setEditForm(f => ({ ...f, tickets: f.tickets.map((t, i) => i === idx ? { ...t, [field]: value } : t) }));

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    const form = editModal.form;
    try {
      let thumbnailUrl = form.existingImage || '';
      if (form.imageFile) {
        const fd = new FormData();
        fd.append('posterImage', form.imageFile);
        const uploadRes = await eventService.uploadEventImage(fd);
        thumbnailUrl = `http://localhost:5000/uploads/events/${uploadRes.data.filename}`;
      }

      const isTicketed = form.isTicketed;
      const cleanTickets = isTicketed
        ? form.tickets.filter(t => t.name.trim() && Number(t.price) >= 0).map(t => ({ name: t.name.trim(), price: Number(t.price) }))
        : [];
      const primaryPrice = cleanTickets.length > 0 ? Math.min(...cleanTickets.map(t => t.price)) : 0;
      const priceOptions = cleanTickets.length > 0 ? [...new Set(cleanTickets.map(t => t.price))].sort((a, b) => a - b) : [];

      await eventService.updateEvent(editModal.eventId, {
        title:             form.title,
        description:       form.description,
        eventType:         form.eventType,
        location:          form.location,
        date:              form.date,
        time:              form.time,
        totalCapacity:     form.isUnlimitedCapacity ? 999999 : Number(form.totalCapacity),
        isTicketed,
        ticketPrice:       primaryPrice,
        ticketPriceOptions: priceOptions,
        tickets:           cleanTickets,
        thumbnail:         thumbnailUrl,
        posterImage:       thumbnailUrl,
        bankAccount:       form.bankAccount,
        whatsappNumber:    form.whatsappNumber,
        paymentMessage:    form.paymentMessage,
      });

      const eventsRes = await eventService.getAllEvents();
      setEvents(eventsRes.data);
      setEditModal(null);
      await fetchStats();
    } catch (error) {
      alert('Error updating event: ' + (error?.response?.data?.message || error.message));
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      let thumbnailUrl = '';
      if (newEventForm.imageFile) {
        const formData = new FormData();
        formData.append('posterImage', newEventForm.imageFile);
        const uploadRes = await eventService.uploadEventImage(formData);
        thumbnailUrl = `http://localhost:5000/uploads/events/${uploadRes.data.filename}`;
      }

      const isTicketed = newEventForm.isTicketed;
      const cleanTickets = isTicketed
        ? newEventForm.tickets
            .filter(t => t.name.trim() && Number(t.price) >= 0)
            .map(t => ({ name: t.name.trim(), price: Number(t.price) }))
        : [];
      const primaryPrice = cleanTickets.length > 0
        ? Math.min(...cleanTickets.map(t => t.price))
        : 0;
      const priceOptions = cleanTickets.length > 0
        ? [...new Set(cleanTickets.map(t => t.price))].sort((a, b) => a - b)
        : [];

      await eventService.createEvent({
        title: newEventForm.title,
        description: newEventForm.description,
        eventType: newEventForm.eventType,
        location: newEventForm.location,
        date: newEventForm.date,
        time: newEventForm.time,
        totalCapacity: newEventForm.isUnlimitedCapacity ? 999999 : Number(newEventForm.totalCapacity),
        availableTickets: newEventForm.isUnlimitedCapacity ? 999999 : Number(newEventForm.totalCapacity),
        isTicketed,
        ticketPrice: primaryPrice,
        ticketPriceOptions: priceOptions,
        tickets: cleanTickets,
        thumbnail: thumbnailUrl,
        posterImage: thumbnailUrl,
        bankAccount: newEventForm.bankAccount,
        whatsappNumber: newEventForm.whatsappNumber,
        paymentMessage: newEventForm.paymentMessage,
      });

      const eventsRes = await eventService.getAllEvents();
      setEvents(eventsRes.data);
      await fetchStats();
      setNewEventForm({
        title: '', description: '', eventType: 'event', location: '',
        date: '', time: '', totalCapacity: '',
        isUnlimitedCapacity: false,
        isTicketed: false,
        tickets: [],
        bankAccount: '', whatsappNumber: '',
        paymentMessage: 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.',
        imageFile: null,
      });
      alert('Event created successfully!');
    } catch (error) {
      alert('Error creating event: ' + (error?.response?.data?.message || error.message));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventService.deleteEvent(eventId);
      const res = await eventService.getAllEvents();
      setEvents(res.data);
      await fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleVerifyPayment = async (action) => {
    if (!verifyModal) return;
    try {
      await registrationService.verifyPayment(verifyModal.registration._id, action);
      setVerifyModal(null);
      await Promise.all([fetchRegistrations(), fetchStats()]);
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update payment status');
    }
  };

  const totalPages = Math.ceil(regTotal / 20);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner text="Loading admin dashboard…" /></div>;

  return (
    <PageWrapper
      title="Admin Dashboard"
      subtitle={`Welcome, ${user?.name}`}
    >
      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />} value={events.length} label="Total Events" color="bg-indigo-50 dark:bg-indigo-900/30" />
        <KpiCard icon={<Users size={20} className="text-emerald-600 dark:text-emerald-400" />} value={stats.registeredCount} label="Verified Registrations" color="bg-emerald-50 dark:bg-emerald-900/30" />
        <KpiCard icon={<Clock size={20} className="text-amber-600 dark:text-amber-400" />} value={stats.pendingPayments} label="Pending Payments" color="bg-amber-50 dark:bg-amber-900/30" />
        <KpiCard icon={<BarChart2 size={20} className="text-violet-600 dark:text-violet-400" />} value={stats.totalRegistrations} label="Total Registrations" color="bg-violet-50 dark:bg-violet-900/30" />
      </div>

      {/* Tab Bar */}
      <div className="mb-6 flex gap-2 border-b border-slate-200/60 pb-1 dark:border-white/10">
        {TABS.map(tab => (
          <Button key={tab} size="sm"
            variant={activeTab === tab ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </Button>
        ))}
      </div>

      {/* Tab: Dashboard */}
      {activeTab === 'dashboard' && (
        <Card variant="glass" padding="lg">
          <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Dashboard Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">System is running smoothly. All events and registrations are being tracked.</p>
        </Card>
      )}

      {/* Tab: Manage Events */}
      {activeTab === 'events' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create form */}
          <Card variant="glass" padding="lg">
            <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">Create New Event</h2>
            <form onSubmit={handleCreateEvent} className="flex flex-col gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Title</label>
                <input name="title" value={newEventForm.title} onChange={handleInputChange} className={inputCls} required />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</label>
                <select name="eventType" value={newEventForm.eventType} onChange={handleInputChange} className={inputCls}>
                  <option value="event">Event</option>
                  <option value="club">Club</option>
                </select>
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Event Poster / Image</label>
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp, image/gif" 
                  onChange={handleImageChange} 
                  className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                />
                {newEventForm.imageFile && (
                  <div className="mt-2 h-32 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                    <img 
                      src={URL.createObjectURL(newEventForm.imageFile)} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</label>
                <textarea name="description" value={newEventForm.description} onChange={handleInputChange} rows={3} className={`${inputCls} min-h-[80px]`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                  <input type="date" name="date" min={new Date().toISOString().split('T')[0]} value={newEventForm.date} onChange={handleInputChange} className={inputCls} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Time</label>
                  <input type="time" name="time" value={newEventForm.time} onChange={handleInputChange} className={inputCls} required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Location</label>
                <input name="location" value={newEventForm.location} onChange={handleInputChange} className={inputCls} required />
              </div>
              
              {/* Unlimited Capacity Toggle */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={newEventForm.isUnlimitedCapacity}
                  onClick={handleUnlimitedToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${newEventForm.isUnlimitedCapacity ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${newEventForm.isUnlimitedCapacity ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">No capacity limit</span>
              </div>

              {!newEventForm.isUnlimitedCapacity && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Capacity</label>
                  <input type="number" name="totalCapacity" value={newEventForm.totalCapacity} onChange={handleInputChange} className={inputCls} required={!newEventForm.isUnlimitedCapacity} />
                </div>
              )}

              {/* Ticketed Event Toggle */}
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={newEventForm.isTicketed}
                  onClick={handleTicketedToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${newEventForm.isTicketed ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${newEventForm.isTicketed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">This is a ticketed event</span>
              </div>

              {/* Dynamic Ticket Rows */}
              {newEventForm.isTicketed && (
                <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/20">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Ticket Types</label>
                    <button
                      type="button"
                      onClick={handleAddTicket}
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800"
                    >
                      <Plus size={12} /> Add Ticket
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {newEventForm.tickets.map((ticket, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Ticket name (e.g. VIP)"
                          value={ticket.name}
                          onChange={e => handleTicketChange(idx, 'name', e.target.value)}
                          className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={ticket.price}
                          onChange={e => handleTicketChange(idx, 'price', e.target.value)}
                          className="w-24 shrink-0 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          min="0"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveTicket(idx)}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          aria-label="Remove ticket"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {newEventForm.tickets.length === 0 && (
                      <p className="py-2 text-center text-xs italic text-slate-400">No tickets added yet. Click "Add Ticket" above.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Payment fields — only when ticketed */}
              {newEventForm.isTicketed && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bank Account Number</label>
                    <input name="bankAccount" value={newEventForm.bankAccount} onChange={handleInputChange} placeholder="e.g. 001234567890" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">WhatsApp Number</label>
                    <input name="whatsappNumber" value={newEventForm.whatsappNumber} onChange={handleInputChange} placeholder="e.g. +94770001122" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment Message</label>
                    <textarea name="paymentMessage" value={newEventForm.paymentMessage} onChange={handleInputChange} rows={2} className={`${inputCls} min-h-[60px]`} />
                  </div>
                </>
              )}

              <Button type="submit" className="w-full" leftIcon={<Plus size={14} />}>Create Event</Button>
            </form>
          </Card>

          {/* Events list */}
          <Card variant="glass" padding="lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Events List</h2>
            <div className="flex flex-col gap-3 pr-1">
              {events.map(event => (
                <div key={event._id} className="rounded-2xl border-l-4 border-indigo-500 bg-slate-50/60 p-4 dark:bg-white/5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{event.title}</h3>
                    <div className="flex shrink-0 gap-1.5">
                      <Button size="xs" variant="secondary" leftIcon={<Pencil size={12} />} aria-label="Edit event" onClick={() => openEditModal(event)} />
                      <Button size="xs" variant="danger"    leftIcon={<Trash2 size={12} />} aria-label="Delete event" onClick={() => handleDeleteEvent(event._id)} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(event.date).toLocaleDateString()} · {event.location}
                  </p>
                  <p className="text-xs text-slate-400">
                    Capacity: {event.totalCapacity >= 999999 ? 'Unlimited' : `${event.availableTickets}/${event.totalCapacity}`}
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${event.isTicketed ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                    {event.isTicketed ? 'Ticketed' : 'Free'}
                  </span>
                  {Array.isArray(event.tickets) && event.tickets.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {event.tickets.map((t, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {t.name}: Rs. {t.price}
                        </span>
                      ))}
                    </div>
                  )}
                  {event.bankAccount && <p className="text-xs text-slate-400">Bank: {event.bankAccount}</p>}
                  {event.whatsappNumber && <p className="text-xs text-slate-400">WhatsApp: {event.whatsappNumber}</p>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Registrations */}
      {activeTab === 'registrations' && (
        <Card variant="glass" padding="lg">
          <h2 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">Registrations</h2>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3">
            <select value={regFilter} onChange={e => { setRegFilter(e.target.value); setRegPage(1); }} className={`${inputCls} w-auto`}>
              <option value="">All Statuses</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="registered">Registered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={regEventFilter} onChange={e => { setRegEventFilter(e.target.value); setRegPage(1); }} className={`${inputCls} w-auto`}>
              <option value="">All Events</option>
              {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/60 dark:border-white/10 dark:bg-white/5">
                  {['Student', 'Event', 'Event Date', 'Tickets', 'Registered At', 'Status', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center italic text-slate-400">No registrations found</td>
                  </tr>
                ) : (
                  registrations.map(reg => (
                    <tr key={reg._id} className="transition hover:bg-slate-50/40 dark:hover:bg-white/5">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">{reg.userId?.name || '—'}</div>
                        <div className="text-xs text-slate-400">{reg.userId?.email || ''}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{reg.eventId?.title || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {reg.eventId?.date ? new Date(reg.eventId.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{reg.ticketsBooked}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(reg.registeredAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={regStatusBadgeMap[reg.status] || 'PENDING'} />
                      </td>
                      <td className="px-4 py-3">
                        {reg.status === 'pending_payment' && (
                          <Button size="xs" variant="primary" onClick={() => setVerifyModal({ registration: reg })}>
                            Verify
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" leftIcon={<ChevronLeft size={14} />} disabled={regPage === 1} onClick={() => setRegPage(p => p - 1)}>Prev</Button>
              <span className="text-sm text-slate-500 dark:text-slate-400">{regPage} / {totalPages}</span>
              <Button size="sm" variant="ghost" rightIcon={<ChevronRight size={14} />} disabled={regPage === totalPages} onClick={() => setRegPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </Card>
      )}

      {/* Tab: Reviews */}
      {activeTab === 'reviews' && (() => {
        const reviewsByEvent = reviews.reduce((acc, r) => {
          const id = r.event?._id;
          if (!id) return acc;
          if (!acc[id]) acc[id] = { event: r.event, items: [] };
          acc[id].items.push(r);
          return acc;
        }, {});
        const groups = Object.values(reviewsByEvent);

        return (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Event Reviews</h2>
              {reviews.length > 0 && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} across {groups.length} {groups.length === 1 ? 'event' : 'events'}
                </span>
              )}
            </div>

            {reviews.length === 0 ? (
              <Card variant="glass" padding="lg">
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <MessageSquare size={32} className="text-slate-300 dark:text-slate-600" />
                  <p className="text-slate-500 dark:text-slate-400">No reviews yet.</p>
                </div>
              </Card>
            ) : (
              groups.map(({ event, items }) => {
                const avg = (items.reduce((s, r) => s + r.rating, 0) / items.length).toFixed(1);
                const poster = event.posterImage || event.thumbnail;

                return (
                  <Card key={event._id} variant="glass" padding="lg">
                    {/* Event summary */}
                    <div className="flex gap-4">
                      {poster && (
                        <img
                          src={poster}
                          alt={event.title}
                          className="h-20 w-28 shrink-0 rounded-2xl object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">{event.title}</h3>
                          <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1 dark:bg-amber-900/20">
                            <Star size={13} className="fill-amber-400 text-amber-400" />
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{avg}</span>
                            <span className="text-xs text-slate-400">/ 5</span>
                          </div>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                          {event.date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(event.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} />
                              {event.location}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${event.isTicketed ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                            {event.isTicketed ? 'Ticketed' : 'Free'}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:bg-white/10 dark:text-slate-400">
                            {items.length} {items.length === 1 ? 'review' : 'reviews'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="my-4 border-t border-slate-200/60 dark:border-white/10" />

                    {/* Reviews list */}
                    <div className="flex flex-col gap-3">
                      {items.map(review => (
                        <div key={review._id} className="rounded-2xl bg-slate-50/60 p-4 dark:bg-white/5">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                {review.user?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{review.user?.name || 'Anonymous'}</p>
                                <p className="text-[10px] text-slate-400">
                                  {new Date(review.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={13} className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200 dark:fill-slate-600 dark:text-slate-600'} />
                              ))}
                            </div>
                          </div>
                          {review.review && (
                            <p className="text-sm text-slate-700 dark:text-slate-300">{review.review}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        );
      })()}

      {/* Edit Event Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            key="edit-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 backdrop-blur-sm"
            onClick={() => setEditModal(null)}
          >
            <motion.div
              variants={scaleUp} initial="hidden" animate="visible" exit="exit"
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xl rounded-3xl border border-white/80 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/90"
              role="dialog" aria-modal="true" aria-labelledby="edit-event-title"
            >
              <div className="mb-5 flex items-center justify-between border-b border-slate-200/60 pb-4 dark:border-white/10">
                <h3 id="edit-event-title" className="text-lg font-bold text-slate-900 dark:text-white">Edit Event</h3>
                <Button size="sm" variant="ghost" leftIcon={<X size={14} />} aria-label="Close" onClick={() => setEditModal(null)} />
              </div>

              <form onSubmit={handleUpdateEvent} className="flex flex-col gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Title</label>
                  <input name="title" value={editModal.form.title} onChange={handleEditInputChange} className={inputCls} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Type</label>
                  <select name="eventType" value={editModal.form.eventType} onChange={handleEditInputChange} className={inputCls}>
                    <option value="event">Event</option>
                    <option value="club">Club</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Event Poster / Image</label>
                  {editModal.form.existingImage && !editModal.form.imageFile && (
                    <div className="mb-2 h-32 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                      <img src={editModal.form.existingImage} alt="Current poster" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp, image/gif"
                    onChange={handleEditImageChange}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 dark:text-slate-400 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
                  />
                  {editModal.form.imageFile && (
                    <div className="mt-2 h-32 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10">
                      <img src={URL.createObjectURL(editModal.form.imageFile)} alt="New poster preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</label>
                  <textarea name="description" value={editModal.form.description} onChange={handleEditInputChange} rows={3} className={`${inputCls} min-h-[80px]`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                    <input type="date" name="date" value={editModal.form.date} onChange={handleEditInputChange} className={inputCls} required />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Time</label>
                    <input type="time" name="time" value={editModal.form.time} onChange={handleEditInputChange} className={inputCls} required />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Location</label>
                  <input name="location" value={editModal.form.location} onChange={handleEditInputChange} className={inputCls} required />
                </div>

                {/* Unlimited capacity toggle */}
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                  <button
                    type="button" role="switch" aria-checked={editModal.form.isUnlimitedCapacity}
                    onClick={handleEditUnlimitedToggle}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${editModal.form.isUnlimitedCapacity ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${editModal.form.isUnlimitedCapacity ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">No capacity limit</span>
                </div>
                {!editModal.form.isUnlimitedCapacity && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Capacity</label>
                    <input type="number" name="totalCapacity" value={editModal.form.totalCapacity} onChange={handleEditInputChange} className={inputCls} required={!editModal.form.isUnlimitedCapacity} />
                  </div>
                )}

                {/* Ticketed toggle */}
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50/60 p-3 dark:bg-white/5">
                  <button
                    type="button" role="switch" aria-checked={editModal.form.isTicketed}
                    onClick={handleEditTicketedToggle}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${editModal.form.isTicketed ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${editModal.form.isTicketed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">This is a ticketed event</span>
                </div>

                {editModal.form.isTicketed && (
                  <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/40 p-4 dark:border-indigo-500/20 dark:bg-indigo-950/20">
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Ticket Types</label>
                      <button type="button" onClick={handleEditAddTicket} className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 active:bg-indigo-800">
                        <Plus size={12} /> Add Ticket
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {editModal.form.tickets.map((ticket, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input type="text" placeholder="Ticket name (e.g. VIP)" value={ticket.name} onChange={e => handleEditTicketChange(idx, 'name', e.target.value)}
                            className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                          <input type="number" placeholder="Price" value={ticket.price} onChange={e => handleEditTicketChange(idx, 'price', e.target.value)} min="0"
                            className="w-24 shrink-0 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" required />
                          <button type="button" onClick={() => handleEditRemoveTicket(idx)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-950/30" aria-label="Remove ticket">
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {editModal.form.tickets.length === 0 && (
                        <p className="py-2 text-center text-xs italic text-slate-400">No tickets added yet. Click "Add Ticket" above.</p>
                      )}
                    </div>
                  </div>
                )}

                {editModal.form.isTicketed && (
                  <>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Bank Account Number</label>
                      <input name="bankAccount" value={editModal.form.bankAccount} onChange={handleEditInputChange} placeholder="e.g. 001234567890" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">WhatsApp Number</label>
                      <input name="whatsappNumber" value={editModal.form.whatsappNumber} onChange={handleEditInputChange} placeholder="e.g. +94770001122" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Payment Message</label>
                      <textarea name="paymentMessage" value={editModal.form.paymentMessage} onChange={handleEditInputChange} rows={2} className={`${inputCls} min-h-[60px]`} />
                    </div>
                  </>
                )}

                <div className="mt-2 flex gap-3">
                  <Button type="submit" className="flex-1" leftIcon={<Save size={14} />}>Save Changes</Button>
                  <Button type="button" variant="secondary" leftIcon={<X size={14} />} onClick={() => setEditModal(null)}>Cancel</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verify Payment Modal */}
      <AnimatePresence>
        {verifyModal && (
          <motion.div
            key="verify-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setVerifyModal(null)}
          >
            <motion.div
              variants={scaleUp} initial="hidden" animate="visible" exit="exit"
              onClick={e => e.stopPropagation()}
              className="mx-4 w-full max-w-md rounded-3xl border border-white/80 bg-white/80 p-6 shadow-2xl backdrop-blur-xl dark:border-slate-700/40 dark:bg-slate-900/80"
              role="dialog" aria-modal="true" aria-labelledby="verify-title"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 id="verify-title" className="text-lg font-bold text-slate-900 dark:text-white">Verify Payment</h3>
                <Button size="sm" variant="ghost" leftIcon={<X size={14} />} aria-label="Close" onClick={() => setVerifyModal(null)} />
              </div>
              <div className="mb-4 flex flex-col gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                <p><strong>Student:</strong> {verifyModal.registration.userId?.name}</p>
                <p><strong>Event:</strong> {verifyModal.registration.eventId?.title}</p>
                <p><strong>Tickets:</strong> {verifyModal.registration.ticketsBooked}</p>
              </div>
              <p className="mb-5 text-slate-700 dark:text-slate-200">Has payment been received for this registration?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setVerifyModal(null)}>Cancel</Button>
                <Button variant="danger" onClick={() => handleVerifyPayment('reject')}>Reject</Button>
                <Button variant="success" onClick={() => handleVerifyPayment('approve')}>Approve</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
};
