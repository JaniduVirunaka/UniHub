import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../config/api';
import ClubNavigation from '../../components/ClubNavigation';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../hooks/animationVariants';

const BOARD_ROLES = [
  'President', 'Vice President', 'Secretary', 'Assistant Secretary',
  'Treasurer', 'Assistant Treasurer', 'Event Coordinator', 'Public Relations', 'Editor',
];

function ClubAbout() {
  const { id } = useParams();
  const [club, setClub] = useState(null);

  useEffect(() => {
    api.get(`/clubs/${id}`).then(res => setClub(res.data)).catch(console.error);
  }, [id]);

  if (!club) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner /></div>;

  return (
    <PageWrapper>
      {/* Club header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-200/60 text-2xl dark:bg-white/10">
          {club.logoUrl
            ? <img src={`http://localhost:5000${club.logoUrl}`} alt={club.name} className="h-full w-full object-cover" />
            : <span>🎓</span>}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{club.name}</h1>
      </div>

      <ClubNavigation club={club} />

      <div className="mt-6 grid gap-6">

        {/* Mission */}
        <Card variant="glass" padding="lg">
          <h3 className="mb-3 text-lg font-bold text-emerald-600 dark:text-emerald-400">Our Mission</h3>
          <p className="text-base italic leading-relaxed text-slate-700 dark:text-slate-200">
            "{club.mission}"
          </p>
        </Card>

        {/* Executive Board */}
        <Card variant="glass" padding="lg">
          <h3 className="mb-5 border-b border-slate-200/60 pb-3 text-lg font-bold text-indigo-600 dark:border-white/10 dark:text-indigo-400">
            Executive Board
          </h3>
          <motion.div
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="visible"
            className="grid gap-3 sm:grid-cols-2 md:grid-cols-3"
          >
            {BOARD_ROLES.map(role => {
              const name = role === 'President'
                ? club.president?.name
                : club.topBoard?.find(b => b.role === role)?.user?.name;
              const vacant = !name;
              return (
                <motion.div key={role} variants={staggerItem}
                  className="rounded-2xl bg-white/60 p-4 text-center shadow-sm border border-white/80 dark:bg-white/5 dark:border-white/10"
                >
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">{role}</p>
                  <p className={`font-semibold ${vacant ? 'italic text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                    {vacant ? 'Vacant' : name}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </Card>

        {/* Rules */}
        <Card variant="glass" padding="lg">
          <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Rules & Regulations</h3>
          <p className="whitespace-pre-wrap leading-relaxed text-slate-600 dark:text-slate-300">
            {club.rulesAndRegulations}
          </p>
        </Card>

      </div>
    </PageWrapper>
  );
}

export default ClubAbout;
