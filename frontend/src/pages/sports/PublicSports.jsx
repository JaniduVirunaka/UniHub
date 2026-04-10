import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Layers3, LogIn } from 'lucide-react';
import axiosInstance from '../../api/axios';
import PageWrapper from '../../components/PageWrapper';
import LoadingSpinner from '../../components/LoadingSpinner';
import GlassCard from '../../components/GlassCard';

function PublicSports() {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/sports')
      .then(res => setSports(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Campus Sports" subtitle="Explore the sports teams available at UniHub.">
        <LoadingSpinner text="Loading sports..." />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Campus Sports" subtitle="Explore the sports teams available at UniHub.">
      {/* Guest banner */}
      <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-4">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          You're browsing as a guest. Sign in to join a team and track your requests.
        </p>
        <div className="flex shrink-0 gap-2">
          <Link to="/login"  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300">Sign In</Link>
          <Link to="/signup" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10">Sign Up</Link>
        </div>
      </div>

      {sports.length === 0 ? (
        <GlassCard><p className="text-slate-600 dark:text-slate-300">No sports found.</p></GlassCard>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {sports.map(sport => (
            <GlassCard key={sport._id} className="relative transition hover:-translate-y-1 hover:z-10 hover:bg-white/10">
              <div className="mb-4 inline-flex rounded-2xl bg-emerald-400/15 p-3 text-emerald-600 dark:text-emerald-300">
                <Trophy size={22} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{sport.name}</h3>
              <p className="mt-3 min-h-[48px] text-sm leading-6 text-slate-600 dark:text-slate-300">
                {sport.description || 'No description available for this sport yet.'}
              </p>
              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Layers3 size={16} className="text-cyan-600 dark:text-cyan-300" />
                  <span>Category: {sport.category || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <Users size={16} className="text-cyan-600 dark:text-cyan-300" />
                  <span>Members: {sport.members?.length || 0}</span>
                </div>
              </div>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-white/20 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <LogIn size={16} />
                Sign in to join
              </Link>
            </GlassCard>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}

export default PublicSports;
