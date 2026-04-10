import { useReducedMotion } from 'framer-motion';

/**
 * Returns container + item variants for staggered grid reveals.
 * Pair with useScrollReveal on the container to trigger on scroll.
 *
 * Usage:
 *   const { ref, controls } = useScrollReveal();
 *   const { containerVariants, itemVariants } = useStaggerReveal();
 *
 *   <motion.ul ref={ref} initial="hidden" animate={controls} variants={containerVariants}>
 *     {items.map(item => (
 *       <motion.li key={item.id} variants={itemVariants}>...</motion.li>
 *     ))}
 *   </motion.ul>
 */
export function useStaggerReveal(staggerDelay = 0.08) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return { containerVariants: {}, itemVariants: {} };
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };

  return { containerVariants, itemVariants };
}