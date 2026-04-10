/**
 * Shared Framer Motion variant presets.
 * Import the variant you need and spread onto a motion element.
 *
 * Usage:
 *   import { fadeUp, scaleUp, staggerContainer, staggerItem } from '../hooks/animationVariants';
 *
 *   <motion.div variants={fadeUp} initial="hidden" animate="visible">...</motion.div>
 *
 *   <motion.ul variants={staggerContainer()} initial="hidden" animate="visible">
 *     <motion.li variants={staggerItem}>...</motion.li>
 *   </motion.ul>
 */

/** Standard scroll-reveal: fades in and rises 24px */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/** Opacity only — for overlays, backdrops, subtle reveals */
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.25 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/** Scale up from 95% — for modals, popovers, dropdowns */
export const scaleUp = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: [0.34, 1.1, 0.64, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.18 },
  },
};

/** Slide down from 0 height — for mobile nav, accordions, dropdowns */
export const slideDown = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/** Slide in from the right — for drawers, side panels */
export const slideInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    x: 40,
    transition: { duration: 0.2 },
  },
};

/**
 * Stagger container — wraps a list of items that should animate in sequence.
 * @param {number} staggerDelay  seconds between each child (default 0.08)
 */
export const staggerContainer = (staggerDelay = 0.08) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: staggerDelay },
  },
});

/** Stagger item — each child inside a staggerContainer */
export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

/** Page-level route transition */
export const pageTransition = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};
