import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { eventService, registrationService } from '../../services/services';
import { EventCard } from '../../components/EventCard';
import { ConfirmationModal } from '../../components/Modals';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../hooks/animationVariants';
import { useCountUp } from '../../hooks/useCountUp';
import { Calendar, Ticket, CreditCard, SlidersHorizontal } from 'lucide-react';

function StatPill({ icon, value, label, color }) {
  const count = useCountUp(value, 800);
  return (
    <Card variant="glass" padding="md" className="flex items-center gap-4">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{count}</p>
        <p className="text-sm text-slate-500 dark:text-slate-300">{label}</p>
      </div>
    </Card>
  );
}

export const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTicketConfirm, setShowTicketConfirm] = useState(false);
  const [selectedTicketEvent, setSelectedTicketEvent] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const fetchData = useCallback(async () => {
    try {
      const [eventsRes, myEventsRes] = await Promise.all([
        eventService.getAllEvents(),
        registrationService.getMyEvents(),
      ]);
      setEvents(eventsRes.data);
      setMyEvents(myEventsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchData]);

  const handleRegisterClick = (event) => {
    if (event.ticketPrice > 0) {
      setSelectedTicketEvent(event); setShowTicketConfirm(true);
    } else {
      setSelectedEvent(event); setShowConfirm(true);
    }
  };

  const handleConfirmRegister = async () => {
    try {
      await registrationService.registerEvent(selectedEvent._id);
      alert(`Successfully registered for: ${selectedEvent.title}`);
      setShowConfirm(false); setSelectedEvent(null);
      await fetchData();
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const confirmTicketFlow = () => {
    if (!selectedTicketEvent) return;
    addToCart(selectedTicketEvent, 1);
    setShowTicketConfirm(false); setSelectedTicketEvent(null);
    navigate('/events/cart');
  };

  const handleBuyTicket = (event) => { setSelectedTicketEvent(event); setShowTicketConfirm(true); };

  const filteredEvents = events.filter(event => {
    if (!event.ticketPrice || event.ticketPrice <= 0) return true;
    const min = priceRange.min === '' ? 0 : Number(priceRange.min);
    const max = priceRange.max === '' ? Number.MAX_SAFE_INTEGER : Number(priceRange.max);
    return event.ticketPrice >= min && event.ticketPrice <= max;
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner text="Loading your dashboard…" />
      </div>
    );
  }

  return (
    <PageWrapper title={`Welcome back, ${user?.name?.split(' ')[0]}!`} subtitle={`${user?.department} · Year ${user?.year} · ${user?.studentId}`}>
      {/* Stat Pills */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatPill icon={<Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />} value={events.length} label="Available Events" color="bg-indigo-50 dark:bg-indigo-900/30" />
        <StatPill icon={<Ticket size={20} className="text-emerald-600 dark:text-emerald-400" />} value={myEvents.length} label="Registered Events" color="bg-emerald-50 dark:bg-emerald-900/30" />
        <StatPill icon={<CreditCard size={20} className="text-amber-600 dark:text-amber-400" />} value={0} label="Pending Payments" color="bg-amber-50 dark:bg-amber-900/30" />
      </div>

      {/* Price Filter */}
      <Card variant="glass" padding="md" className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Ticket Price Range Filter</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="number"
            placeholder="Min price (e.g. 100)"
            value={priceRange.min}
            onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          <input
            type="number"
            placeholder="Max price (e.g. 1000)"
            value={priceRange.max}
            onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </Card>

      {/* Events Grid */}
      <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Available Events</h2>
      {filteredEvents.length === 0 ? (
        <Card variant="glass" padding="lg" className="text-center">
          <p className="text-slate-400">No events match your filter criteria.</p>
        </Card>
      ) : (
        <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredEvents.map(event => (
            <motion.div key={event._id} variants={staggerItem}>
              <EventCard event={event} onRegister={handleRegisterClick} onBuy={handleBuyTicket} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Registration"
        message={`Are you sure you want to register for "${selectedEvent?.title}"?`}
        onYes={handleConfirmRegister}
        onNo={() => setShowConfirm(false)}
      />
      <ConfirmationModal
        isOpen={showTicketConfirm}
        title="Go To Ticket Purchase"
        message={`Do you want to add "${selectedTicketEvent?.title}" to cart and continue to ticket purchase?`}
        onYes={confirmTicketFlow}
        onNo={() => { setShowTicketConfirm(false); setSelectedTicketEvent(null); }}
      />
    </PageWrapper>
  );
};
