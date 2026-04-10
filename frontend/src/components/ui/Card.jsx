import { motion } from 'framer-motion';

const variantClasses = {
  glass:
    'bg-white/60 backdrop-blur-md border border-white/80 shadow-lg ' +
    'dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-2xl',
  default:
    'bg-white/80 border border-slate-200/60 shadow-sm ' +
    'dark:bg-slate-900/70 dark:border-slate-700/50 dark:backdrop-blur-sm',
  elevated:
    'bg-white shadow-xl ' +
    'dark:bg-slate-800/80 dark:backdrop-blur-md dark:border dark:border-white/10',
  outlined:
    'border-2 border-slate-200 dark:border-slate-700',
};

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8 md:p-10',
};

const hoverClasses =
  'hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl transition-all duration-200 cursor-pointer';

/**
 * Unified card component.
 *
 * Props:
 *   variant  — 'glass' | 'default' | 'elevated' | 'outlined'  (default: 'glass')
 *   padding  — 'none' | 'sm' | 'md' | 'lg'  (default: 'md')
 *   hover    — boolean, adds lift-on-hover animation
 *   animate  — boolean, participates in Framer Motion stagger (pass variants from parent)
 *   className — additional classes
 *   as       — HTML tag to render (default: 'div')
 */
function Card({
  variant = 'glass',
  padding = 'md',
  hover = false,
  animate = false,
  className = '',
  as: Tag = 'div',
  children,
  ...props
}) {
  const classes = [
    'rounded-2xl',
    variantClasses[variant] ?? variantClasses.glass,
    paddingClasses[padding] ?? paddingClasses.md,
    hover ? hoverClasses : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (animate) {
    return (
      <motion.div className={classes} {...props}>
        {children}
      </motion.div>
    );
  }

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}

export default Card;
