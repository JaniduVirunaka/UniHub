import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function ActionCard({ to, title, text, icon, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Link
        to={to}
        className="block rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/10"
      >
        <div className="mb-4 inline-flex rounded-2xl bg-cyan-400/15 p-3 text-cyan-300">
          {icon}
        </div>

        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
      </Link>
    </motion.div>
  );
}

export default ActionCard;