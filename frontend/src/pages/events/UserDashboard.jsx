import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { eventService, registrationService } from '../../services/services';
import { EventCard } from '../../components/EventCard';
import { ConfirmationModal } from '../../components/Modals';

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
      const eventsRes = await eventService.getAllEvents();
      setEvents(eventsRes.data);

      const myEventsRes = await registrationService.getMyEvents();
      setMyEvents(myEventsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const onFocus = () => fetchData();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchData]);

  const handleRegisterClick = (event) => {
    // Ticketed events should continue to ticket/cart flow
    if (event.ticketPrice > 0) {
      setSelectedTicketEvent(event);
      setShowTicketConfirm(true);
      return;
    }

    // Free events/clubs follow confirmation + one-click registration
    setSelectedEvent(event);
    setShowConfirm(true);
  };

  const handleConfirmRegister = async () => {
    try {
      await registrationService.registerEvent(selectedEvent._id);
      alert(`Successfully registered for: ${selectedEvent.title}`);
      setShowConfirm(false);
      setSelectedEvent(null);

      const myEventsRes = await registrationService.getMyEvents();
      setMyEvents(myEventsRes.data);

      await fetchData();
    } catch (error) {
      alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const confirmTicketFlow = () => {
    if (!selectedTicketEvent) return;
    addToCart(selectedTicketEvent, 1);
    setShowTicketConfirm(false);
    setSelectedTicketEvent(null);
    navigate('/events/cart');
  };

  const handleBuyTicket = (event) => {
    setSelectedTicketEvent(event);
    setShowTicketConfirm(true);
  };

  const filteredEvents = events.filter((event) => {
    if (!event.ticketPrice || event.ticketPrice <= 0) return true;
    const min = priceRange.min === '' ? 0 : Number(priceRange.min);
    const max = priceRange.max === '' ? Number.MAX_SAFE_INTEGER : Number(priceRange.max);
    return event.ticketPrice >= min && event.ticketPrice <= max;
  });

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">Welcome, {user?.name}!</h1>
          <p className="text-gray-600">Student ID: {user?.studentId}</p>
          <p className="text-gray-600">Department: {user?.department} | Year: {user?.year}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">{events.length}</div>
            <p className="text-gray-600">Available Events</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">{myEvents.length}</div>
            <p className="text-gray-600">Registered Events</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <p className="text-gray-600">Pending Payments</p>
          </div>
        </div>

        {/* Available Events */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Available Events</h2>
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h3 className="font-semibold mb-3">Ticket Price Range Filter</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Min price (e.g. 100)"
                value={priceRange.min}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                placeholder="Max price (e.g. 1000)"
                value={priceRange.max}
                onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded"
              />
            </div>
          </div>
          {loading ? (
            <p>Loading events...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onRegister={handleRegisterClick}
                  onBuy={handleBuyTicket}
                />
              ))}
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
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
          message={`Do you want to add "${selectedTicketEvent?.title}" to cart and continue to ticket purchase page?`}
          onYes={confirmTicketFlow}
          onNo={() => {
            setShowTicketConfirm(false);
            setSelectedTicketEvent(null);
          }}
        />
      </div>
    </div>
  );
};
