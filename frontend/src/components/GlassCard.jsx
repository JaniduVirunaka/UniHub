function GlassCard({ children, className = '' }) {
  return (
    <div
      className={[
        'rounded-3xl p-5 shadow-xl',
        // Light mode glass
        'bg-white/60 backdrop-blur-md border border-white/80',
        // Dark mode glass
        'dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-2xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export default GlassCard;
