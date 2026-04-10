import { motion } from 'framer-motion';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';

export function EventCard({ event, onBuy, onRegister, user }) {
  const { ref, ...reveal } = useScrollReveal();

  const handlePrimaryAction = () => {
    if (event.ticketPrice > 0) {
      if (onRegister) { onRegister(event); return; }
      if (onBuy) onBuy(event);
      return;
    }
    if (onRegister) onRegister(event);
  };

  const isPaid = event.ticketPrice > 0;
  const label = !user
    ? (isPaid ? 'Sign in to buy ticket' : 'Sign in to register')
    : (isPaid ? 'Register & Buy Ticket' : 'Register');

  return (
    <motion.div
      ref={ref}
      {...reveal}
      className={[
        'flex flex-col overflow-hidden rounded-3xl shadow-xl transition-all duration-200',
        'hover:-translate-y-1 hover:shadow-2xl',
        // Light
        'bg-white/60 backdrop-blur-md border border-white/80',
        // Dark
        'dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-slate-200 dark:bg-slate-800">
        {event.thumbnail ? (
          <img
            src={event.thumbnail}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Calendar size={40} className="text-slate-400 dark:text-slate-600" />
          </div>
        )}
        {isPaid && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-indigo-600/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Ticket size={12} />
            LKR {event.ticketPrice}
          </span>
        )}
        {!isPaid && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            Free
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white line-clamp-2">
          {event.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
          {event.description}
        </p>

        <ul className="flex flex-col gap-1.5 text-sm text-slate-600 dark:text-slate-300">
          <li className="flex items-center gap-2">
            <Calendar size={14} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
            {event.date}
          </li>
          <li className="flex items-center gap-2">
            <MapPin size={14} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
            {event.location}
          </li>
          <li className="flex items-center gap-2">
            <Ticket size={14} className="shrink-0 text-indigo-500 dark:text-indigo-400" />
            {event.availableTickets} tickets left
          </li>
        </ul>

        <motion.button
          type="button"
          onClick={handlePrimaryAction}
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          className={[
            'mt-auto w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
            isPaid
              ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500'
              : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500',
          ].join(' ')}
        >
          {label}
        </motion.button>
      </div>
    </motion.div>
  );
}
