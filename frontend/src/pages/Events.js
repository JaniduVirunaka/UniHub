import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Teammate will need to uncomment this when ready

function Events() {
  // TODO: [Teammate Name] - Initialize state for events
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // TODO: [Teammate Name] - Fetch all events from your backend endpoint
    // Example:
    // axios.get('http://localhost:5000/api/events')
    //   .then(res => setEvents(res.data))
    //   .catch(err => console.error("Error fetching events:", err));
  }, []);

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h2 style={{ color: 'var(--primary-color)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
        Campus Events
      </h2>
      
      <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
        Discover and RSVP to upcoming workshops, guest lectures, and social gatherings.
      </p>

      {/* TODO: [Teammate Name] - Build the UI to map through the 'events' array here */}
      <div style={{ padding: '20px', backgroundColor: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '8px', textAlign: 'center' }}>
        <h3 style={{ color: '#6b7280' }}>🚧 Events Module Under Construction 🚧</h3>
        <p style={{ color: '#9ca3af' }}>Sakurani is currently developing this feature. Check back soon!</p>
      </div>
    </div>
  );
}

export default Events;