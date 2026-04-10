import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { eventService, registrationService } from '../../services/services';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalRegistrations: 0, pendingPayments: 0, registeredCount: 0, cancelledCount: 0 });
  const [registrations, setRegistrations] = useState([]);
  const [regTotal, setRegTotal] = useState(0);
  const [regFilter, setRegFilter] = useState('');
  const [regEventFilter, setRegEventFilter] = useState('');
  const [regPage, setRegPage] = useState(1);
  const [verifyModal, setVerifyModal] = useState(null); // { registration }
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
    const fetchData = async () => {
      try {
        const eventsRes = await eventService.getAllEvents();
        setEvents(eventsRes.data);
        await fetchStats();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    }
  }, [activeTab, fetchRegistrations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEventForm(prev => ({ ...prev, [name]: value }));
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
      await fetchStats();

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
        await eventService.deleteEvent(eventId);
        const eventsRes = await eventService.getAllEvents();
        setEvents(eventsRes.data);
        await fetchStats();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete event');
      }
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

  const statusBadge = (status) => {
    const styles = {
      pending_payment: 'bg-orange-100 text-orange-800',
      registered: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-600'
    };
    const labels = {
      pending_payment: 'Pending Payment',
      registered: 'Registered',
      cancelled: 'Cancelled'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const totalPages = Math.ceil(regTotal / 20);

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
            <div className="text-3xl font-bold text-green-600">{stats.registeredCount}</div>
            <p className="text-gray-600">Verified Registrations</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-orange-600">{stats.pendingPayments}</div>
            <p className="text-gray-600">Pending Payments</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl font-bold text-purple-600">{stats.totalRegistrations}</div>
            <p className="text-gray-600">Total Registrations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {['dashboard', 'events', 'registrations'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-semibold transition capitalize ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab === 'registrations' ? 'Registrations' : tab === 'events' ? 'Manage Events' : 'Dashboard'}
            </button>
          ))}
        </div>

        {/* Tab: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
            <p className="text-gray-600">System is running smoothly. All events and registrations are being tracked.</p>
          </div>
        )}

        {/* Tab: Manage Events */}
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

        {/* Tab: Registrations */}
        {activeTab === 'registrations' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4">Registrations</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
              <select
                value={regFilter}
                onChange={(e) => { setRegFilter(e.target.value); setRegPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="registered">Registered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={regEventFilter}
                onChange={(e) => { setRegEventFilter(e.target.value); setRegPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="">All Events</option>
                {events.map((ev) => (
                  <option key={ev._id} value={ev._id}>{ev.title}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Event Date</th>
                    <th className="px-4 py-3">Tickets</th>
                    <th className="px-4 py-3">Registered At</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-500">No registrations found</td>
                    </tr>
                  ) : (
                    registrations.map((reg) => (
                      <tr key={reg._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{reg.userId?.name || '—'}</div>
                          <div className="text-gray-500 text-xs">{reg.userId?.email || ''}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{reg.eventId?.title || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {reg.eventId?.date ? new Date(reg.eventId.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{reg.ticketsBooked}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(reg.registeredAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">{statusBadge(reg.status)}</td>
                        <td className="px-4 py-3">
                          {reg.status === 'pending_payment' && (
                            <button
                              onClick={() => setVerifyModal({ registration: reg })}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Verify Payment
                            </button>
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
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  disabled={regPage === 1}
                  onClick={() => setRegPage((p) => p - 1)}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  {regPage} / {totalPages}
                </span>
                <button
                  disabled={regPage === totalPages}
                  onClick={() => setRegPage((p) => p + 1)}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verify Payment Modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-2">Verify Payment</h3>
            <p className="text-gray-600 mb-1">
              <strong>Student:</strong> {verifyModal.registration.userId?.name}
            </p>
            <p className="text-gray-600 mb-1">
              <strong>Event:</strong> {verifyModal.registration.eventId?.title}
            </p>
            <p className="text-gray-600 mb-4">
              <strong>Tickets:</strong> {verifyModal.registration.ticketsBooked}
            </p>
            <p className="text-gray-700 mb-6">
              Has payment been received for this registration?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setVerifyModal(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerifyPayment('reject')}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
              >
                Reject
              </button>
              <button
                onClick={() => handleVerifyPayment('approve')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
