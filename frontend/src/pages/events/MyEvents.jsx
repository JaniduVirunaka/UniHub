import React, { useState, useEffect, useCallback } from 'react';
import { EventCalendar } from '../../components/EventCalendar';
import { authService, registrationService } from '../../services/services';

const StarRating = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none focus:outline-none"
          aria-label={`Rate ${star} stars`}
        >
          <span className={(hovered || value) >= star ? 'text-yellow-400' : 'text-gray-300'}>
            &#9733;
          </span>
        </button>
      ))}
    </div>
  );
};

const StarDisplay = ({ value }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span key={star} className={value >= star ? 'text-yellow-400' : 'text-gray-300'}>
        &#9733;
      </span>
    ))}
  </span>
);

export const MyEvents = () => {
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState({}); // eventId -> reviews[]
  const [reviewsLoading, setReviewsLoading] = useState({}); // eventId -> bool
  const [ratings, setRatings] = useState({}); // eventId -> selected star value

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

  const loadReviews = useCallback(async (eventId) => {
    setReviewsLoading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const res = await authService.getReviewsForEvent(eventId);
      setReviews((prev) => ({ ...prev, [eventId]: res.data }));
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setReviewsLoading((prev) => ({ ...prev, [eventId]: false }));
    }
  }, []);

  // Auto-load reviews for past events when the event list is ready
  useEffect(() => {
    const pastPaidEvents = registeredEvents.filter(
      (ev) => ev.ticketPrice > 0 && new Date(ev.date).getTime() <= Date.now()
    );
    pastPaidEvents.forEach((ev) => {
      if (!reviews[ev._id]) {
        loadReviews(ev._id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registeredEvents]);

  const handleReviewSubmit = (eventId) => async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const rating = ratings[eventId] || parseInt(formData.get('rating'), 10);
    const review = formData.get('review');
    if (!rating) {
      alert('Please select a star rating');
      return;
    }
    try {
      await authService.createReview({ eventId, rating, review });
      alert('Review submitted');
      e.target.reset();
      setRatings((prev) => ({ ...prev, [eventId]: 0 }));
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
              {registeredEvents.map((event) => {
                const isPast = new Date(event.date).getTime() <= Date.now();
                const isPaid = event.ticketPrice > 0;
                const showReviewSection = isPaid && isPast;

                return (
                  <div key={event._id} className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="font-bold text-lg text-blue-800 mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{event.description}</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {event.time}</p>
                      <p><strong>Location:</strong> {event.location}</p>
                      {isPaid && (
                        <p><strong>Ticket Price:</strong> Rs. {event.ticketPrice}</p>
                      )}
                      {event.registrationStatus && (
                        <p>
                          <strong>Status:</strong>{' '}
                          <span className={event.registrationStatus === 'pending_payment' ? 'text-orange-600 font-semibold' : 'text-green-700 font-semibold'}>
                            {event.registrationStatus === 'pending_payment' ? 'Pending Payment Verification' : 'Registered'}
                          </span>
                        </p>
                      )}
                    </div>

                    {showReviewSection && (
                      <div className="mt-4 border-t pt-4">
                        <h4 className="font-semibold mb-3">Review & Rate</h4>

                        <form onSubmit={handleReviewSubmit(event._id)} className="space-y-3">
                          <div>
                            <label className="text-sm font-semibold block mb-1">Your Rating</label>
                            <StarRating
                              value={ratings[event._id] || 0}
                              onChange={(v) => setRatings((prev) => ({ ...prev, [event._id]: v }))}
                            />
                            {/* Hidden input to carry rating value for non-JS fallback */}
                            <input
                              type="hidden"
                              name="rating"
                              value={ratings[event._id] || ''}
                            />
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

                        {/* Reviews list */}
                        <div className="mt-4">
                          {reviewsLoading[event._id] ? (
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                              Loading reviews...
                            </div>
                          ) : Array.isArray(reviews[event._id]) && reviews[event._id].length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-gray-600">
                                {reviews[event._id].length} review{reviews[event._id].length !== 1 ? 's' : ''}
                              </p>
                              {reviews[event._id].map((r) => (
                                <div key={r._id} className="bg-gray-50 border rounded p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold">{r.user?.name || 'User'}</span>
                                    <StarDisplay value={r.rating} />
                                  </div>
                                  <div className="text-sm text-gray-700">{r.review}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
