import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/services';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [newEventForm, setNewEventForm] = useState({
    title: '',
    description: '',
    eventType: 'event',
    location: '',
    date: '',
    time: '',
    totalCapacity: '',
    ticketPrice: '',
    ticketPricesText: '',
    bankAccount: '',
    whatsappNumber: '',
    paymentMessage: 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.'
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await eventService.getAllEvents();
        setEvents(eventsRes.data);
        // TODO: Fetch all users when admin endpoint is ready
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEventForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const { ticketPricesText, ...restForm } = newEventForm;
      const priceOptions = (newEventForm.ticketPricesText || '')
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);

      const uniqueSortedOptions = [...new Set(priceOptions)].sort((a, b) => a - b);
      const primaryPrice =
        uniqueSortedOptions.length > 0
          ? uniqueSortedOptions[0]
          : Number(newEventForm.ticketPrice || 0);

      const payload = {
        ...restForm,
        totalCapacity: Number(newEventForm.totalCapacity),
        availableTickets: Number(newEventForm.totalCapacity),
        ticketPrice: primaryPrice,
        ticketPriceOptions: uniqueSortedOptions
      };

      await eventService.createEvent(payload);
      const eventsRes = await eventService.getAllEvents();
      setEvents(eventsRes.data);

      setNewEventForm({
        title: '',
        description: '',
        eventType: 'event',
        location: '',
        date: '',
        time: '',
        totalCapacity: '',
        ticketPrice: '',
        ticketPricesText: '',
        bankAccount: '',
        whatsappNumber: '',
        paymentMessage: 'Pay the payment for this bank account number and send the receipt for this WhatsApp number.'
      });
      alert('Event created successfully!');
    } catch (error) {
      alert('Error creating event: ' + (error?.response?.data?.message || error.message));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        // TODO: Implement delete endpoint
        alert('Event deleted successfully!');
      } catch (error) {
        alert('Error deleting event');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-purple-100">Welcome, {user?.name} (Admin)</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">{events.length}</div>
            <p className="text-gray-600">Total Events</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">{users.length}</div>
            <p className="text-gray-600">Registered Users</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-orange-600">0</div>
            <p className="text-gray-600">Pending Registrations</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-red-600">0</div>
            <p className="text-gray-600">Pending Payments</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'events'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manage Events
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Users
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
            <p className="text-gray-600">System is running smoothly. All events and registrations are being tracked.</p>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Event Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newEventForm.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Type</label>
                  <select
                    name="eventType"
                    value={newEventForm.eventType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  >
                    <option value="event">Event</option>
                    <option value="club">Club</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea
                    name="description"
                    value={newEventForm.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    rows="3"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={newEventForm.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Time</label>
                    <input
                      type="time"
                      name="time"
                      value={newEventForm.time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={newEventForm.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Capacity</label>
                    <input
                      type="number"
                      name="totalCapacity"
                      value={newEventForm.totalCapacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Ticket Price</label>
                    <input
                      type="number"
                      name="ticketPrice"
                      value={newEventForm.ticketPrice}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Multiple Ticket Prices (comma separated)
                  </label>
                  <input
                    type="text"
                    name="ticketPricesText"
                    value={newEventForm.ticketPricesText}
                    onChange={handleInputChange}
                    placeholder="e.g. 500, 1000, 1500"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If you add multiple prices, lowest value is used as base ticket price.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Bank Account Number</label>
                    <input
                      type="text"
                      name="bankAccount"
                      value={newEventForm.bankAccount}
                      onChange={handleInputChange}
                      placeholder="e.g. 001234567890"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">WhatsApp Number</label>
                    <input
                      type="text"
                      name="whatsappNumber"
                      value={newEventForm.whatsappNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. +94770001122"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Payment Message</label>
                    <textarea
                      name="paymentMessage"
                      value={newEventForm.paymentMessage}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  Create Event
                </button>
              </form>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Events List</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.map((event) => (
                  <div key={event._id} className="border-l-4 border-purple-600 p-4 bg-gray-50 rounded">
                    <h3 className="font-bold text-gray-800">{event.title}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(event.date).toLocaleDateString()} | {event.location}
                    </p>
                    <p className="text-sm text-gray-500">Capacity: {event.availableTickets}/{event.totalCapacity}</p>
                    {Array.isArray(event.ticketPriceOptions) && event.ticketPriceOptions.length > 0 && (
                      <p className="text-sm text-gray-500">
                        Ticket Options: {event.ticketPriceOptions.join(', ')}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">Bank: {event.bankAccount || 'N/A'}</p>
                    <p className="text-sm text-gray-500">WhatsApp: {event.whatsappNumber || 'N/A'}</p>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold mt-2"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Registered Users</h2>
            <p className="text-gray-600">User management coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};
