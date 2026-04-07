import { motion } from "framer-motion";

function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-4">
      <div className="relative h-14 w-14">
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-emerald-400/20"
        />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
        />
      </div>

      <motion.p
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="text-sm text-slate-300"
      >
        {text}
      </motion.p>
    </div>
  );
}

export default LoadingSpinner;