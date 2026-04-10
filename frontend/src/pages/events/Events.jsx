import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { eventService, registrationService } from '../../services/services';
import { EventCard } from '../../components/EventCard';
import { ConfirmationModal } from '../../components/Modals';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../hooks/animationVariants';

function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showTicketConfirm, setShowTicketConfirm] = useState(false);
  const [selectedTicketEvent, setSelectedTicketEvent] = useState(null);

  const fetchEvents = useCallback(() => {
    eventService.getAllEvents()
      .then(res => setEvents(res.data))
      .catch(err => console.error('Error fetching events:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleRegisterClick = (event) => {
    if (!user) { navigate('/login'); return; }
    if (event.ticketPrice > 0) {
      setSelectedTicketEvent(event);
      setShowTicketConfirm(true);
    } else {
      setSelectedEvent(event);
      setShowConfirm(true);
    }
  };

  const handleBuyTicket = (event) => {
    if (!user) { navigate('/login'); return; }
    setSelectedTicketEvent(event);
    setShowTicketConfirm(true);
  };

  const confirmTicketFlow = () => {
    if (!selectedTicketEvent) return;
    addToCart(selectedTicketEvent, 1);
    setShowTicketConfirm(false);
    setSelectedTicketEvent(null);
    navigate('/events/cart');
  };

  const handleConfirmRegister = async () => {
    try {
      await registrationService.registerEvent(selectedEvent._id);
      alert(`Successfully registered for: ${selectedEvent.title}`);
      setShowConfirm(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner text="Loading events…" />
      </div>
    );
  }

  return (
    <PageWrapper title="Campus Events" subtitle="Discover and register for upcoming events">
      {!user && (
        <Card variant="glass" padding="md" className="mb-6 flex flex-wrap items-center justify-between gap-4 border border-indigo-300/40">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Sign in to register for events and purchase tickets.
          </p>
          <div className="flex shrink-0 gap-2">
            <Button as={Link} to="/login" size="sm">Sign In</Button>
            <Button as={Link} to="/signup" variant="secondary" size="sm">Sign Up</Button>
          </div>
        </Card>
      )}

      {events.length === 0 ? (
        <Card variant="glass" padding="lg" className="text-center">
          <p className="text-slate-400">No events available yet. Check back later.</p>
        </Card>
      ) : (
        <motion.div
          variants={staggerContainer(0.07)}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {events.map(event => (
            <motion.div key={event._id} variants={staggerItem}>
              <EventCard
                event={event}
                onRegister={handleRegisterClick}
                onBuy={handleBuyTicket}
                user={user}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <ConfirmationModal
        isOpen={showConfirm}
        title="Confirm Registration"
        message={`Are you sure you want to register for "${selectedEvent?.title}"?`}
        onYes={handleConfirmRegister}
        onNo={() => { setShowConfirm(false); setSelectedEvent(null); }}
      />

      <ConfirmationModal
        isOpen={showTicketConfirm}
        title="Go To Ticket Purchase"
        message={`Do you want to add "${selectedTicketEvent?.title}" to your cart and proceed to ticket purchase?`}
        onYes={confirmTicketFlow}
        onNo={() => { setShowTicketConfirm(false); setSelectedTicketEvent(null); }}
      />
    </PageWrapper>
  );
}

export default Events;
