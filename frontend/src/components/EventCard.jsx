import React from 'react';

export const EventCard = ({ event, onBuy, onRegister, reviews, onLoadReviews, onReviewSubmit, user }) => {
  const handlePrimaryAction = () => {
    if (event.ticketPrice > 0) {
      if (onRegister) {
        // Main flow: registration action routes ticketed events to ticket UI
        onRegister(event);
        return;
      }
      if (onBuy) onBuy(event);
      return;
    }
    if (onRegister) onRegister(event);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      <div className="h-48 bg-gray-300 flex items-center justify-center">
        {event.thumbnail ? (
          <img src={event.thumbnail} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-500">No Image</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">{event.title}</h3>
        <p className="text-gray-600 text-sm mb-3">{event.description}</p>
        <div className="mb-4">
          <p className="text-sm"><strong>Date:</strong> {event.date}</p>
          <p className="text-sm"><strong>Location:</strong> {event.location}</p>
          <p className="text-sm"><strong>Available:</strong> {event.availableTickets} tickets</p>
        </div>
        <button
          onClick={handlePrimaryAction}
          className={`w-full px-4 py-2 text-white font-bold rounded transition ${
            event.ticketPrice > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {event.ticketPrice > 0 ? 'Register & Buy Ticket' : 'Register'}
        </button>
      </div>
    </div>
  );
};
