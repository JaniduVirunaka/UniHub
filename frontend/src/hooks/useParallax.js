import { useRef } from 'react';
import { useScroll, useTransform, useReducedMotion } from 'framer-motion';

/**
 * Subtle parallax effect — the target element's background drifts at a slower
 * rate than the user's scroll, creating depth. Apply `y` as a motion style on
 * a decorative background layer inside a `overflow-hidden` container.
 *
 * @param {number} speed  0 = no movement, 1 = moves at full scroll speed (default 0.2)
 *
 * Usage:
 *   const { ref, y } = useParallax(0.2);
 *   <div ref={ref} className="relative overflow-hidden">
 *     <motion.div style={{ y }} className="absolute inset-0 ...decorative layer..." />
 *     <div className="relative z-10">Content</div>
 *   </div>
 */
export function useParallax(speed = 0.2) {
  const ref = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const range = speed * 100;
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReducedMotion ? ['0%', '0%'] : [`-${range / 2}%`, `${range / 2}%`]
  );

  return { ref, y };
}
