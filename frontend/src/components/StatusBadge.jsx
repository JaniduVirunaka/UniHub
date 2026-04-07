function StatusBadge({ status }) {
  const styles = {
    PENDING: "bg-amber-400/15 text-amber-300 border-amber-300/20",
    APPROVED: "bg-emerald-400/15 text-emerald-300 border-emerald-300/20",
    REJECTED: "bg-rose-400/15 text-rose-300 border-rose-300/20"
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${
        styles[status] || "bg-slate-400/10 text-slate-200 border-white/10"
      }`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
