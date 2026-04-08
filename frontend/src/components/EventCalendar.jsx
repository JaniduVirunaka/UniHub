import React, { useState, useEffect } from 'react';

export const EventCalendar = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return events.filter(event => {
      const eventDate = new Date(event.date).toDateString();
      return eventDate === dateStr;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            ‹ Prev
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Next ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center font-semibold text-gray-600 bg-gray-100 rounded">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isToday = day === new Date().getDate() &&
                         currentDate.getMonth() === new Date().getMonth() &&
                         currentDate.getFullYear() === new Date().getFullYear();

          return (
            <div
              key={index}
              className={`min-h-[80px] p-2 border rounded cursor-pointer transition hover:bg-gray-50 ${
                day ? 'bg-white' : 'bg-gray-50'
              } ${isToday ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}
              onClick={() => day && setSelectedDate(day)}
            >
              {day && (
                <>
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event, eventIndex) => (
                      <div
                        key={eventIndex}
                        className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded truncate"
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">
            Events on {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
          </h3>
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map((event, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <h4 className="font-medium text-blue-800">{event.title}</h4>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <p className="text-sm text-gray-500">
                    Time: {event.time} | Location: {event.location}
                  </p>
                  {event.ticketPrice > 0 && (
                    <p className="text-sm text-green-600">Ticket Price: Rs. {event.ticketPrice}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No events on this date.</p>
          )}
        </div>
      )}

      {events.length === 0 && (
        <div className="mt-6 text-center py-8 text-gray-500">
          <div className="text-4xl mb-4">📅</div>
          <p className="text-lg">No registered events yet</p>
          <p className="text-sm">Register for events to see them in your calendar</p>
        </div>
      )}
    </div>
  );
};
