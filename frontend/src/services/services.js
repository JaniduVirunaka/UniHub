import api from '../config/api';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getReviewsForEvent: (eventId) => api.get(`/reviews/event/${eventId}`),
  createReview: (data) => api.post('/reviews', data),
  getAllReviews: () => api.get('/reviews/all')
};

export const eventService = {
  getAllEvents: () => api.get('/events'),
  getEventById: (eventId) => api.get(`/events/${eventId}`),
  checkAvailability: (eventId) => api.get(`/events/${eventId}/availability`),
  createEvent: (eventData) => api.post('/events', eventData),
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`),
  uploadEventImage: (formData) => api.post('/upload/event-poster', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const registrationService = {
  registerEvent: (eventId) => api.post('/registrations/register-event', { eventId }),
  getMyEvents: () => api.get('/registrations/my-events'),
  cancelRegistration: (registrationId) => api.delete(`/registrations/${registrationId}`),
  getAllRegistrations: (params) => api.get('/registrations/all', { params }),
  getStats: () => api.get('/registrations/stats'),
  verifyPayment: (registrationId, action) =>
    api.patch(`/registrations/${registrationId}/verify-payment`, { action })
};

export const cartService = {
  addToCart: (eventId, quantity, selectedTicketName) => api.post('/cart/add', { eventId, quantity, selectedTicketName }),
  getCart: () => api.get('/cart'),
  checkout: (items) => api.post('/cart/checkout', { items })
};
