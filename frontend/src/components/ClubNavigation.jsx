import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Vote, Landmark } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function ClubNavigation({ club }) {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!club) return null;

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isSupervisor = currentUser?.role === 'supervisor';
  const isPresident = club.president?._id === currentUser?.id || club.president === currentUser?.id;
  const isTopBoard = club.topBoard?.some(b => (b.user?._id || b.user) === currentUser?.id);
  const isMember = club.members?.some(m => (m._id || m) === currentUser?.id);
  const hasFullAccess = isSupervisor || isPresident || isTopBoard || isMember;

  const isActive = (path, hash = '') =>
    location.pathname === path && location.hash === hash;

  const tabCls = (path, hash = '') =>
    `inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
      isActive(path, hash)
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
    }`;

  return (
    <nav aria-label="Club navigation" className="relative z-[99] mb-6 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/60 bg-white/60 px-3 py-2 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <Link to={`/clubs/${club._id}`} className={tabCls(`/clubs/${club._id}`)}>🏠 Main Hub</Link>
      <Link to={`/clubs/${club._id}/about`} className={tabCls(`/clubs/${club._id}/about`)}>📖 About</Link>
      <Link to={`/clubs/${club._id}/achievements`} className={tabCls(`/clubs/${club._id}/achievements`)}>🏆 Trophy Room</Link>
      <Link to={`/clubs/${club._id}/sponsorships`} className={tabCls(`/clubs/${club._id}/sponsorships`)}>🤝 Sponsorships</Link>

      {hasFullAccess && (
        <div className="relative"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button
            type="button"
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
            onClick={() => setDropdownOpen(p => !p)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Settings size={13} />
            Member Portals ▾
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 top-full z-[1000] mt-1 min-w-[200px] overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-slate-900/90"
              >
                <Link
                  to={`/clubs/${club._id}/elections`}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/10"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Vote size={14} className="text-violet-500" />
                  Voting Booth
                </Link>
                <Link
                  to={`/clubs/${club._id}/finance`}
                  className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Landmark size={14} className="text-emerald-500" />
                  Financial Hub
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </nav>
  );
}

export default ClubNavigation;
