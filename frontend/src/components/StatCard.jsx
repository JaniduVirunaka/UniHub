import { motion } from 'framer-motion';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';

function StatCard({ title, value, subtitle, icon }) {
  const { ref, ...reveal } = useScrollReveal();
  const { ref: countRef, displayValue } = useCountUp(value);

  return (
    <motion.div
      ref={ref}
      {...reveal}
      className={[
        'rounded-3xl p-5 shadow-xl',
        // Light mode
        'bg-white/60 backdrop-blur-md border border-white/80',
        // Dark mode
        'dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-2xl',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div ref={countRef}>
          <p className="text-sm text-slate-500 dark:text-slate-300">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {displayValue}
          </h3>
          {subtitle && (
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-300">{subtitle}</p>
          )}
        </div>

        <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-600 dark:text-emerald-300">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;
