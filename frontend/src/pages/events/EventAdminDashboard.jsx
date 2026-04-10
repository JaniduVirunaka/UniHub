import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventService, registrationService } from '../../services/services';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import { scaleUp, staggerContainer, staggerItem } from '../../hooks/animationVariants';
import { useCountUp } from '../../hooks/useCountUp';
import { Calendar, Users, Clock, BarChart2, Trash2, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

function KpiCard({ icon, value, label, color }) {
  const count = useCountUp(value, 900);
  return (
    <Card variant="glass" padding="md" className="flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{count}</p>
        <p className="text-sm text-slate-500 dark:text-slate-300">{label}</p>
      </div>
    </Card>
  );
}

const regStatusBadgeMap = { pending_payment: 'PENDING', registered: 'APPROVED', cancelled: 'INACTIVE' };

const TABS = ['dashboard', 'events', 'registrations'];
const TAB_LABELS = { dashboard: 'Dashboard', events: 'Manage Events', registrations: 'Registrations' };

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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [newEventForm, setNewEventForm] = useState({
    title: '', description: '', eventType: 'event', location: '',
    date: '', time: '', totalCapacity: '', ticketPrice: '', ticketPricesText: '',
    bankAccount: '', whatsappNumber: '',
    paymentMessage: 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.',
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
  }, [activeTab, fetchRegistrations]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setNewEventForm(p => ({ ...p, [name]: value }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const { ticketPricesText, ...restForm } = newEventForm;
      const priceOptions = (newEventForm.ticketPricesText || '')
        .split(',').map(v => Number(v.trim())).filter(v => Number.isFinite(v) && v > 0);
      const sorted = [...new Set(priceOptions)].sort((a, b) => a - b);
      const primaryPrice = sorted.length > 0 ? sorted[0] : Number(newEventForm.ticketPrice || 0);

      await eventService.createEvent({
        ...restForm,
        totalCapacity: Number(newEventForm.totalCapacity),
        availableTickets: Number(newEventForm.totalCapacity),
        ticketPrice: primaryPrice,
        ticketPriceOptions: sorted,
      });

      const eventsRes = await eventService.getAllEvents();
      setEvents(eventsRes.data);
      await fetchStats();
      setNewEventForm({
        title: '', description: '', eventType: 'event', location: '',
        date: '', time: '', totalCapacity: '', ticketPrice: '', ticketPricesText: '',
        bankAccount: '', whatsappNumber: '',
        paymentMessage: 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.',
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
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Description</label>
                <textarea name="description" value={newEventForm.description} onChange={handleInputChange} rows={3} className={`${inputCls} min-h-[80px]`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</label>
                  <input type="date" name="date" value={newEventForm.date} onChange={handleInputChange} className={inputCls} required />
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Capacity</label>
                  <input type="number" name="totalCapacity" value={newEventForm.totalCapacity} onChange={handleInputChange} className={inputCls} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ticket Price</label>
                  <input type="number" name="ticketPrice" value={newEventForm.ticketPrice} onChange={handleInputChange} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Multiple Ticket Prices (comma separated)</label>
                <input name="ticketPricesText" value={newEventForm.ticketPricesText} onChange={handleInputChange} placeholder="e.g. 500, 1000, 1500" className={inputCls} />
                <p className="mt-1 text-xs text-slate-400">Lowest value is used as base ticket price.</p>
              </div>
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
              <Button type="submit" className="w-full" leftIcon={<Plus size={14} />}>Create Event</Button>
            </form>
          </Card>

          {/* Events list */}
          <Card variant="glass" padding="lg">
            <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Events List</h2>
            <div className="flex max-h-[600px] flex-col gap-3 overflow-y-auto pr-1">
              {events.map(event => (
                <div key={event._id} className="rounded-2xl border-l-4 border-indigo-500 bg-slate-50/60 p-4 dark:bg-white/5">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{event.title}</h3>
                    <Button size="xs" variant="danger" leftIcon={<Trash2 size={12} />} aria-label="Delete event" onClick={() => handleDeleteEvent(event._id)} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {new Date(event.date).toLocaleDateString()} · {event.location}
                  </p>
                  <p className="text-xs text-slate-400">Capacity: {event.availableTickets}/{event.totalCapacity}</p>
                  {Array.isArray(event.ticketPriceOptions) && event.ticketPriceOptions.length > 0 && (
                    <p className="text-xs text-slate-400">Ticket Options: Rs. {event.ticketPriceOptions.join(', ')}</p>
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
