import { useState } from 'react';

export const EventCalendar = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
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
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  };

  const getEventsForDate = (day) => {
    if (!day) return [];
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
    return events.filter(event => new Date(event.date).toDateString() === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + direction);
      return d;
    });
  };

  const today = new Date();
  const days = getDaysInMonth(currentDate);

  const navBtn = 'rounded-xl px-3 py-1.5 text-sm font-semibold text-white transition';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900/60">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigateMonth(-1)}
            aria-label="Previous month"
            className={`${navBtn} bg-indigo-600 hover:bg-indigo-700`}
          >
            ‹ Prev
          </button>
          <button
            type="button"
            onClick={() => setCurrentDate(new Date())}
            aria-label="Go to today"
            className={`${navBtn} bg-slate-500 hover:bg-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => navigateMonth(1)}
            aria-label="Next month"
            className={`${navBtn} bg-indigo-600 hover:bg-indigo-700`}
          >
            Next ›
          </button>
        </div>
      </div>

      {/* Day-name headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {dayNames.map(day => (
          <div
            key={day}
            className="rounded p-2 text-center text-xs font-semibold text-slate-600 bg-slate-100 dark:bg-slate-800/50 dark:text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isToday =
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();

          return (
            <div
              key={index}
              onClick={() => day && setSelectedDate(day)}
              className={[
                'min-h-[72px] cursor-pointer rounded-lg border p-1.5 transition',
                day
                  ? isToday
                    ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-400/50 dark:bg-indigo-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                  : 'border-slate-100 bg-slate-50 dark:border-white/5 dark:bg-white/[0.02]',
              ].join(' ')}
            >
              {day && (
                <>
                  <div
                    className={`text-sm font-medium ${
                      isToday
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {day}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 2).map((event, i) => (
                      <div
                        key={i}
                        title={event.title}
                        className="truncate rounded px-1 py-0.5 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-500/30 dark:text-indigo-200"
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">
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

      {/* Selected-date event panel */}
      {selectedDate && (
        <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
          <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {selectedDate}, {currentDate.getFullYear()}
          </h3>
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map((event, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5"
                >
                  <h4 className="font-semibold text-indigo-700 dark:text-indigo-300">{event.title}</h4>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{event.description}</p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    {event.time} · {event.location}
                  </p>
                  {event.ticketPrice > 0 && (
                    <p className="mt-0.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Rs. {event.ticketPrice}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No events on this date.</p>
          )}
        </div>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="mt-6 py-8 text-center">
          <div className="mb-4 text-4xl">📅</div>
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">No registered events yet</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Register for events to see them in your calendar
          </p>
        </div>
      )}
    </div>
  );
};