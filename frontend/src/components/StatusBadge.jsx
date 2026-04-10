const statusConfig = {
  PENDING:  { light: 'bg-amber-100   text-amber-700   border-amber-300',   dark: 'dark:bg-amber-400/15   dark:text-amber-300   dark:border-amber-300/20' },
  APPROVED: { light: 'bg-emerald-100 text-emerald-700 border-emerald-300', dark: 'dark:bg-emerald-400/15 dark:text-emerald-300 dark:border-emerald-300/20' },
  REJECTED: { light: 'bg-rose-100    text-rose-700    border-rose-300',    dark: 'dark:bg-rose-400/15    dark:text-rose-300    dark:border-rose-300/20' },
  ACTIVE:   { light: 'bg-sky-100     text-sky-700     border-sky-300',     dark: 'dark:bg-sky-400/15     dark:text-sky-300     dark:border-sky-300/20' },
  INACTIVE: { light: 'bg-slate-100   text-slate-600   border-slate-300',   dark: 'dark:bg-slate-400/10   dark:text-slate-300   dark:border-white/10' },
};

function StatusBadge({ status }) {
  const config = statusConfig[status?.toUpperCase()];
  const classes = config
    ? `${config.light} ${config.dark}`
    : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-400/10 dark:text-slate-300 dark:border-white/10';

  return (
    <span
      role="status"
      aria-label={`Status: ${status}`}
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${classes}`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
