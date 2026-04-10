import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Calendar, Trophy, ArrowRight } from 'lucide-react';
import api from '../config/api';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';
import { staggerContainer, staggerItem } from '../hooks/animationVariants';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function MetricCard({ value, label, color }) {
  const { ref: countRef, displayValue } = useCountUp(value);
  const { ref, ...reveal } = useScrollReveal();

  return (
    <motion.div
      ref={ref}
      {...reveal}
      className="rounded-3xl p-6 text-center shadow-xl bg-white/60 backdrop-blur-md border border-white/80 dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10"
    >
      <div ref={countRef}>
        <p className={`text-4xl font-extrabold tracking-tight ${color}`}>{displayValue}</p>
      </div>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </motion.div>
  );
}

function Home() {
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);

  const { ref: heroRef, ...heroReveal } = useScrollReveal();
  const { ref: eventsRef, ...eventsReveal } = useScrollReveal();

  useEffect(() => {
    api.get('/clubs').then(res => setClubs(res.data.slice(0, 3))).catch(() => {});
    api.get('/events').then(res => setEvents(res.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden px-4 py-24 text-center md:py-32"
        aria-labelledby="hero-heading"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 dark:from-indigo-900 dark:via-slate-900 dark:to-violet-950" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.08)_0%,transparent_60%)]" />

        <motion.div
          ref={heroRef}
          {...heroReveal}
          className="mx-auto max-w-3xl"
        >
          <h1
            id="hero-heading"
            className="text-4xl font-extrabold tracking-tight text-white md:text-6xl"
          >
            Your Campus.{' '}
            <span className="text-yellow-300">Connected.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-indigo-100/90">
            UniHub is the ultimate student experience platform. Discover upcoming events,
            join elite clubs, and track your campus legacy — all in one place.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button as={Link} to="/signup" size="lg"
              className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg shadow-indigo-900/30 focus-visible:ring-white"
            >
              Create Student Account
            </Button>
            <Button as={Link} to="/login" variant="ghost" size="lg"
              className="border border-white/40 !text-white hover:bg-white/10 focus-visible:ring-white"
            >
              Log In
            </Button>
          </div>
        </motion.div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16 md:px-8">
        {/* ── METRICS ── */}
        <section className="-mt-8 mb-16 grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label="Campus impact metrics">
          <MetricCard value="50+" label="Active Clubs"     color="text-indigo-600 dark:text-indigo-400" />
          <MetricCard value="10k+" label="Student Members" color="text-emerald-600 dark:text-emerald-400" />
          <MetricCard value="24/7" label="Campus Events"   color="text-amber-600 dark:text-amber-400" />
        </section>

        {/* ── MAIN GRID ── */}
        <div className="grid gap-8 lg:grid-cols-2">

          {/* CLUBS column */}
          <section aria-labelledby="clubs-heading">
            <div className="mb-5 flex items-center justify-between">
              <h2 id="clubs-heading" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                <Users size={20} className="text-indigo-500" />
                Featured Clubs
              </h2>
              <Button as={Link} to="/clubs" variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                All clubs
              </Button>
            </div>

            <motion.ul
              variants={staggerContainer()}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="flex flex-col gap-4"
            >
              {clubs.length === 0 ? (
                <li className="text-sm text-slate-500 dark:text-slate-400">Loading clubs…</li>
              ) : (
                clubs.map(club => (
                  <motion.li key={club._id} variants={staggerItem}>
                    <Card variant="glass" hover>
                      <h3 className="font-semibold text-indigo-600 dark:text-indigo-400">{club.name}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                        {club.description}
                      </p>
                    </Card>
                  </motion.li>
                ))
              )}
            </motion.ul>
          </section>

          {/* RIGHT column */}
          <div className="flex flex-col gap-6">

            {/* Upcoming Events */}
            <section aria-labelledby="events-heading">
              <div className="mb-5 flex items-center justify-between">
                <h2 id="events-heading" className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                  <Calendar size={20} className="text-amber-500" />
                  Upcoming Events
                </h2>
                <Button as={Link} to="/events" variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                  All events
                </Button>
              </div>

              <motion.div
                ref={eventsRef}
                {...eventsReveal}
              >
                <Card variant="glass" padding="none">
                  <ul className="divide-y divide-slate-200/60 dark:divide-white/10">
                    {events.length === 0 ? (
                      <li className="p-4 text-sm italic text-slate-400 dark:text-slate-500">Loading events…</li>
                    ) : (
                      events.map(ev => (
                        <li key={ev._id} className="flex flex-col gap-0.5 p-4">
                          <span className="font-semibold text-slate-900 dark:text-white">{ev.title}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {ev.date
                              ? new Date(ev.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                              : 'Date TBA'}
                            {ev.location ? ` · ${ev.location}` : ''}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </Card>
              </motion.div>
            </section>

            {/* Campus News */}
            <section aria-labelledby="news-heading">
              <h2 id="news-heading" className="mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
                <Trophy size={20} className="text-emerald-500" />
                Campus News
              </h2>
              <Card variant="glass">
                <p className="text-sm italic text-slate-400 dark:text-slate-500">
                  Global announcements will display here once the backend is integrated.
                </p>
              </Card>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
