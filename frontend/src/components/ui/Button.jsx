import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../LoadingSpinner';

const base = [
  'inline-flex items-center justify-center gap-2',
  'rounded-xl font-semibold transition-colors duration-150',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  'focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const variants = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 ' +
    'focus-visible:ring-indigo-500 shadow-sm hover:shadow-md hover:shadow-indigo-500/20',
  secondary:
    'bg-white/60 text-slate-800 border border-slate-200/80 hover:bg-white/90 backdrop-blur-sm ' +
    'focus-visible:ring-slate-400 shadow-sm ' +
    'dark:bg-white/10 dark:text-slate-100 dark:border-white/15 dark:hover:bg-white/20',
  ghost:
    'text-slate-700 hover:bg-slate-100/80 ' +
    'focus-visible:ring-slate-400 ' +
    'dark:text-slate-300 dark:hover:bg-white/10',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 ' +
    'focus-visible:ring-rose-500 shadow-sm hover:shadow-md hover:shadow-rose-500/20',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 ' +
    'focus-visible:ring-emerald-500 shadow-sm hover:shadow-md hover:shadow-emerald-500/20',
  white:
    'bg-white text-indigo-700 hover:bg-indigo-50 active:bg-indigo-100 ' +
    'focus-visible:ring-white shadow-lg shadow-indigo-900/30',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs',
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

/**
 * Unified button component.
 *
 * Props:
 *   variant  — 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'  (default: 'primary')
 *   size     — 'xs' | 'sm' | 'md' | 'lg'  (default: 'md')
 *   isLoading — shows inline spinner and disables interaction
 *   leftIcon  — React node shown before label
 *   rightIcon — React node shown after label
 *   as        — 'a' | Link (renders as anchor or React Router Link)
 *   to        — required when as=Link
 *   href      — required when as='a'
 *   + all standard HTML button props
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    as,
    to,
    href,
    children,
    className = '',
    disabled,
    ...props
  },
  ref
) {
  const classes = `${base} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`;
  const isDisabled = disabled || isLoading;

  const content = (
    <>
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : leftIcon ? (
        <span aria-hidden="true">{leftIcon}</span>
      ) : null}
      {children}
      {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </>
  );

  if (as === 'a' || href) {
    return (
      <motion.a
        ref={ref}
        href={href}
        whileTap={{ scale: 0.96 }}
        whileHover={variant !== 'ghost' ? { scale: 1.02 } : undefined}
        className={classes}
        {...props}
      >
        {content}
      </motion.a>
    );
  }

  if (as === Link || to) {
    return (
      <motion.div whileTap={{ scale: 0.96 }} whileHover={variant !== 'ghost' ? { scale: 1.02 } : undefined}>
        <Link ref={ref} to={to} className={classes} {...props}>
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-disabled={isDisabled}
      whileTap={{ scale: isDisabled ? 1 : 0.96 }}
      whileHover={variant !== 'ghost' && !isDisabled ? { scale: 1.02 } : undefined}
      className={classes}
      {...props}
    >
      {content}
    </motion.button>
  );
});

export default Button;
