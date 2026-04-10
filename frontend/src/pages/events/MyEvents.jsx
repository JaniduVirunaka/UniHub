import { useState, useEffect, useCallback } from 'react';
import { EventCalendar } from '../../components/EventCalendar';
import { authService, registrationService } from '../../services/services';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../hooks/animationVariants';
import { Calendar, MapPin, Clock, Ticket } from 'lucide-react';

const StarRating = ({ value, onChange }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button" onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
          className="text-2xl leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          aria-label={`Rate ${star} stars`}
        >
          <span className={(hovered || value) >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>★</span>
        </button>
      ))}
    </div>
  );
};

const StarDisplay = ({ value }) => (
  <span className="inline-flex gap-0.5">
    {[1, 2, 3, 4, 5].map(star => (
      <span key={star} className={value >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'}>★</span>
    ))}
  </span>
);

const regStatusMap = {
  pending_payment: 'PENDING',
  registered: 'APPROVED',
  cancelled: 'INACTIVE',
};

export const MyEvents = () => {
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState({});
  const [reviewsLoading, setReviewsLoading] = useState({});
  const [ratings, setRatings] = useState({});

  useEffect(() => {
    registrationService.getMyEvents()
      .then(res => setRegisteredEvents(res.data))
      .catch(err => setError(err?.response?.data?.message || err.message || 'Failed to load events'))
      .finally(() => setLoading(false));
  }, []);

  const loadReviews = useCallback(async (eventId) => {
    setReviewsLoading(p => ({ ...p, [eventId]: true }));
    try {
      const res = await authService.getReviewsForEvent(eventId);
      setReviews(p => ({ ...p, [eventId]: res.data }));
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setReviewsLoading(p => ({ ...p, [eventId]: false }));
    }
  }, []);

  useEffect(() => {
    registeredEvents
      .filter(ev => ev.ticketPrice > 0 && new Date(ev.date).getTime() <= Date.now())
      .forEach(ev => { if (!reviews[ev._id]) loadReviews(ev._id); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registeredEvents]);

  const handleReviewSubmit = (eventId) => async (e) => {
    e.preventDefault();
    const rating = ratings[eventId] || parseInt(new FormData(e.target).get('rating'), 10);
    const review = new FormData(e.target).get('review');
    if (!rating) { alert('Please select a star rating'); return; }
    try {
      await authService.createReview({ eventId, rating, review });
      alert('Review submitted');
      e.target.reset();
      setRatings(p => ({ ...p, [eventId]: 0 }));
      loadReviews(eventId);
    } catch (err) {
      alert(err?.response?.data?.message || err.message || 'Failed to submit review');
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner text="Loading your events…" /></div>;
  if (error) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <p className="text-4xl">⚠️</p>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Error Loading Events</h2>
      <p className="text-slate-500 dark:text-slate-400">{error}</p>
    </div>
  );

  return (
    <PageWrapper title="My Events" subtitle="Your registered events and calendar">
      {/* Calendar */}
      <Card variant="glass" padding="md" className="mb-8 max-w-4xl">
        <EventCalendar events={registeredEvents} />
      </Card>

      {registeredEvents.length > 0 && (
        <>
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Upcoming Events List</h2>
          <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="visible"
            className="grid max-w-4xl gap-4 md:grid-cols-2"
          >
            {registeredEvents.map(event => {
              const isPast = new Date(event.date).getTime() <= Date.now();
              const isPaid = event.ticketPrice > 0;
              const showReviewSection = isPaid && isPast;

              return (
                <motion.div key={event._id} variants={staggerItem}>
                  <Card variant="glass" padding="md">
                    <h3 className="mb-2 font-bold text-indigo-600 dark:text-indigo-400">{event.title}</h3>
                    <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">{event.description}</p>

                    <div className="mb-3 flex flex-col gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-slate-400" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-slate-400" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{event.location}</span>
                      </div>
                      {isPaid && (
                        <div className="flex items-center gap-2">
                          <Ticket size={13} className="text-slate-400" />
                          <span>Rs. {event.ticketPrice}</span>
                        </div>
                      )}
                    </div>

                    {event.registrationStatus && (
                      <div className="mb-3">
                        <StatusBadge status={regStatusMap[event.registrationStatus] || 'PENDING'} />
                      </div>
                    )}

                    {showReviewSection && (
                      <div className="mt-4 border-t border-slate-200/60 pt-4 dark:border-white/10">
                        <h4 className="mb-3 font-semibold text-slate-900 dark:text-white">Review &amp; Rate</h4>
                        <form onSubmit={handleReviewSubmit(event._id)} className="flex flex-col gap-3">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Your Rating</label>
                            <StarRating
                              value={ratings[event._id] || 0}
                              onChange={v => setRatings(p => ({ ...p, [event._id]: v }))}
                            />
                            <input type="hidden" name="rating" value={ratings[event._id] || ''} />
                          </div>
                          <textarea name="review" rows={3} required placeholder="Write your review…"
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400"
                          />
                          <Button type="submit" size="sm">Submit Review</Button>
                        </form>

                        <div className="mt-4">
                          {reviewsLoading[event._id] ? (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-500" />
                              Loading reviews…
                            </div>
                          ) : Array.isArray(reviews[event._id]) && reviews[event._id].length > 0 ? (
                            <div className="flex flex-col gap-2">
                              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {reviews[event._id].length} review{reviews[event._id].length !== 1 ? 's' : ''}
                              </p>
                              {reviews[event._id].map(r => (
                                <div key={r._id} className="rounded-xl bg-slate-50/60 p-3 dark:bg-white/5">
                                  <div className="mb-1 flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{r.user?.name || 'User'}</span>
                                    <StarDisplay value={r.rating} />
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-300">{r.review}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm italic text-slate-400">No reviews yet. Be the first!</p>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </>
      )}

      {registeredEvents.length === 0 && (
        <Card variant="glass" padding="lg" className="text-center">
          <p className="text-slate-400">You haven't registered for any events yet.</p>
        </Card>
      )}
    </PageWrapper>
  );
};
