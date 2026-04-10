import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { eventService, registrationService } from '../../services/services';
import { EventCard } from '../../components/EventCard';
import { ConfirmationModal } from '../../components/Modals';

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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRegisterClick = (event) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (event.ticketPrice > 0) {
      setSelectedTicketEvent(event);
      setShowTicketConfirm(true);
    } else {
      setSelectedEvent(event);
      setShowConfirm(true);
    }
  };

  const handleBuyTicket = (event) => {
    if (!user) {
      navigate('/login');
      return;
    }
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
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-600">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Campus Events</h2>

      {!user && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm text-blue-800">
            Sign in to register for events and purchase tickets.
          </p>
          <div className="flex shrink-0 gap-2">
            <Link to="/login"  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Sign In</Link>
            <Link to="/signup" className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100">Sign Up</Link>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <p className="text-gray-500">No events available yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <EventCard
              key={event._id}
              event={event}
              onRegister={handleRegisterClick}
              onBuy={handleBuyTicket}
              user={user}
            />
          ))}
        </div>
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
    </div>
  );
}

export default Events;
