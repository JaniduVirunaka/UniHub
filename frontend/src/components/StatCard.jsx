import { motion } from "framer-motion";

function StatCard({ title, value, subtitle, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-white">{value}</h3>
          {subtitle && <p className="mt-2 text-sm text-slate-300">{subtitle}</p>}
        </div>

        <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;
