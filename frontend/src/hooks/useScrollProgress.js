import { useScroll, useSpring } from 'framer-motion';

/**
 * Returns a spring-smoothed MotionValue (0–1) tracking page scroll progress.
 * Use as the `scaleX` style on a fixed progress bar element.
 *
 * Usage:
 *   const scaleX = useScrollProgress();
 *   <motion.div style={{ scaleX, transformOrigin: 'left' }} className="fixed top-0 left-0 right-0 h-0.5 ..." />
 */
export function useScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  return scaleX;
}
