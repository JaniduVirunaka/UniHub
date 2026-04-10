import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { scaleUp, fadeIn } from '../hooks/animationVariants';

const glassPanel = [
  'relative w-full max-w-md rounded-3xl p-6 shadow-2xl',
  // Light
  'bg-white/80 backdrop-blur-xl border border-white/80',
  // Dark
  'dark:bg-slate-900/80 dark:backdrop-blur-xl dark:border-white/10',
].join(' ');

export function ConfirmationModal({ isOpen, title, message, onYes, onNo }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onNo}
        >
          <motion.div
            variants={scaleUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
            className={glassPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <h2
              id="confirm-title"
              className="mb-3 text-xl font-bold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">{message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onNo}
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors
                  bg-slate-100 text-slate-700 hover:bg-slate-200
                  dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onYes}
                className="flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-colors
                  bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AlertModal({ isOpen, title, message, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            variants={scaleUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
            className={glassPanel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-title"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2
                id="alert-title"
                className="text-xl font-bold text-slate-900 dark:text-white"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-full p-1 text-slate-400 transition hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition-colors
                bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
