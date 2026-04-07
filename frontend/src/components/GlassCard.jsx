function GlassCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export default GlassCard;
