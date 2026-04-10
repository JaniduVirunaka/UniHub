import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useScrollReveal } from '../hooks/useScrollReveal';

function ActionCard({ to, title, text, icon }) {
  const { ref, ...reveal } = useScrollReveal();

  return (
    <motion.div ref={ref} {...reveal}>
      <Link
        to={to}
        className={[
          'block rounded-3xl p-6 shadow-xl transition-all duration-200',
          'hover:-translate-y-1',
          // Light mode
          'bg-white/60 backdrop-blur-md border border-white/80 hover:bg-white/80 hover:shadow-2xl',
          // Dark mode
          'dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10 dark:hover:bg-white/10',
        ].join(' ')}
      >
        <div className="mb-4 inline-flex rounded-2xl bg-cyan-400/15 p-3 text-cyan-600 dark:text-cyan-300">
          {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">{text}</p>
      </Link>
    </motion.div>
  );
}

export default ActionCard;
