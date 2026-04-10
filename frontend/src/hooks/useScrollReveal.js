import { useEffect, useRef } from 'react';
import { useAnimation, useInView, useReducedMotion } from 'framer-motion';

/**
 * Triggers a reveal animation when the element enters the viewport.
 * Returns ref + motion props to spread directly onto a motion element.
 *
 * Usage:
 *   const { ref, ...reveal } = useScrollReveal();
 *   <motion.div ref={ref} {...reveal}>...</motion.div>
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const controls = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, {
    once: true,
    margin: '-60px',
    ...options,
  });

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  if (prefersReducedMotion) {
    return { ref, initial: false, animate: false, variants: {} };
  }

  return {
    ref,
    initial: 'hidden',
    animate: controls,
    variants: {
      hidden: { opacity: 0, y: 24 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
      },
    },
  };
}