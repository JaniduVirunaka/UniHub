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
      <div className="border-b border-white/10 bg-slate-900/40">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2 md:px-8">
          <NavLink
            to="/events"
            end
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <ShieldCheck size={14} />
              Admin
            </NavLink>
          )}
        </div>
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  );
}

export default EventsLayout;
