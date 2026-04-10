import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Ticket, ShoppingCart, ShieldCheck } from 'lucide-react';

function EventsLayout() {
  const { user } = useAuth();
  const isEventUser = user && ['student', 'admin', 'president', 'supervisor'].includes(user.role);

  return (
    <div>
      {/* Events sub-navbar */}
      <div className="border-b border-slate-200/60 bg-white/60 backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2 md:px-8">
          <NavLink
            to="/events"
            end
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 dark:bg-white/15 dark:text-white'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
              }`
            }
          >
            <Calendar size={14} />
            Browse Events
          </NavLink>

          {isEventUser && (
            <NavLink
              to="/events/my-events"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 dark:bg-white/15 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                }`
              }
            >
              <Ticket size={14} />
              My Events
            </NavLink>
          )}

          {isEventUser && (
            <NavLink
              to="/events/cart"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 dark:bg-white/15 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                }`
              }
            >
              <ShoppingCart size={14} />
              Cart
            </NavLink>
          )}

          {user?.role === 'admin' && (
            <NavLink
              to="/events/admin"
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 dark:bg-white/15 dark:text-white'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-slate-200'
                }`
              }
            >
              <ShieldCheck size={14} />
              Admin
            </NavLink>
          )}
        </div>
      </div>

      <Outlet />
    </div>
  );
}

export default EventsLayout;
