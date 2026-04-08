import React, { useState, useEffect } from 'react';
import { EventCalendar } from '../../components/EventCalendar';
import { authService, registrationService } from '../../services/services';

export const MyEvents = () => {
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState({}); // eventId -> reviews[]

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const response = await registrationService.getMyEvents();
        setRegisteredEvents(response.data);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchMyEvents();
  }, []);

  const loadReviews = async (eventId) => {
    try {
      const res = await authService.getReviewsForEvent(eventId);
      setReviews((prev) => ({ ...prev, [eventId]: res.data }));
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  };

  const handleReviewSubmit = (eventId) => async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const rating = parseInt(formData.get('rating'), 10);
    const review = formData.get('review');
    try {
      await authService.createReview({ eventId, rating, review });
      alert('Review submitted');
      e.target.reset();
      loadReviews(eventId);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to submit review');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Events</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Events</h1>
          <p className="text-gray-700">View your registered events in calendar format</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <EventCalendar events={registeredEvents} />
        </div>

        {registeredEvents.length > 0 && (
          <div className="mt-8 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Upcoming Events List</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {registeredEvents.map((event) => (
                <div key={event._id} className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="font-bold text-lg text-blue-800 mb-2">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {event.time}</p>
                    <p><strong>Location:</strong> {event.location}</p>
                    {event.ticketPrice > 0 && (
                      <p><strong>Ticket Price:</strong> Rs. {event.ticketPrice}</p>
                    )}
                    {event.registrationStatus && (
                      <p>
                        <strong>Status:</strong>{' '}
                        <span className={event.registrationStatus === 'pending_payment' ? 'text-orange-600' : 'text-green-700'}>
                          {event.registrationStatus}
                        </span>
                      </p>
                    )}
                  </div>

                  {event.ticketPrice > 0 && new Date(event.date).getTime() <= Date.now() && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Review & Rate</h4>
                        <button
                          onClick={() => loadReviews(event._id)}
                          className="text-sm text-blue-700 hover:text-blue-900 font-semibold"
                        >
                          Load reviews
                        </button>
                      </div>

                      <form onSubmit={handleReviewSubmit(event._id)} className="space-y-3">
                        <div className="flex gap-3 items-center">
                          <label className="text-sm font-semibold">Rating</label>
                          <select name="rating" className="border rounded px-3 py-2" required defaultValue="5">
                            <option value="5">5</option>
                            <option value="4">4</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                          </select>
                        </div>
                        <textarea
                          name="review"
                          className="w-full border rounded px-3 py-2"
                          rows={3}
                          placeholder="Write your review..."
                          required
                        />
                        <button className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">
                          Submit Review
                        </button>
                      </form>

                      {Array.isArray(reviews[event._id]) && reviews[event._id].length > 0 && (
                        <div className="mt-4 space-y-2">
                          {reviews[event._id].map((r) => (
                            <div key={r._id} className="bg-gray-50 border rounded p-3">
                              <div className="text-sm font-semibold">
                                {r.user?.name || 'User'} - {r.rating}/5
                              </div>
                              <div className="text-sm text-gray-700">{r.review}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
