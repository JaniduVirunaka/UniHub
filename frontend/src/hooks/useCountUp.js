import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Animates a number from 0 to `target` when the element enters the viewport.
 * Non-numeric values are returned as-is with no animation.
 *
 * Usage:
 *   const { ref, displayValue } = useCountUp(stats.memberCount);
 *   <span ref={ref}>{displayValue}</span>
 */
export function useCountUp(target, duration = 1400) {
  const ref = useRef(null);
  const [count, setCount] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const isNumeric = typeof target === 'number' && isFinite(target);

  useEffect(() => {
    if (!isInView || !isNumeric) {
      if (isNumeric) setCount(target);
      return;
    }

    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

    let startTime = null;
    let frameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isInView, target, duration, prefersReducedMotion, isNumeric]);

  return { ref, displayValue: isNumeric ? count : target };
}
