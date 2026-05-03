import api from '../config/api';

export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  uploadProfilePicture: (formData) => api.post('/upload/profile-picture', formData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getReviewsForEvent: (eventId) => api.get(`/reviews/event/${eventId}`),
  createReview: (data) => api.post('/reviews', data),
  getAllReviews: () => api.get('/reviews/all'),
  uploadProfilePicture: (formData) => api.post('/upload/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  changePassword: (data) => api.put('/auth/change-password', data)
};

export const eventService = {
  getAllEvents: () => api.get('/events'),
  getEventById: (eventId) => api.get(`/events/${eventId}`),
  checkAvailability: (eventId) => api.get(`/events/${eventId}/availability`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (eventId, data) => api.put(`/events/${eventId}`, data),
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

export const paymentService = {
  createPayment: (registrationId, method = 'paypal') => api.post('/payments/create', { registrationId, method }),
  approvePayment: (paymentId) => api.get(`/payments/approve/${paymentId}`),
  rejectPayment: (paymentId) => api.get(`/payments/reject/${paymentId}`)
};

export const notificationService = {
  getNotifications: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read')
};

export const cartService = {
  addToCart: (eventId, quantity, selectedTicketName) => api.post('/cart/add', { eventId, quantity, selectedTicketName }),
  getCart: () => api.get('/cart'),
  checkout: (items) => api.post('/cart/checkout', { items })
};
