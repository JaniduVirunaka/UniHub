import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { pageTransition } from '../hooks/animationVariants';

function PageWrapper({ title, subtitle, children, rightContent }) {
  const prefersReducedMotion = useReducedMotion();
  const { ref: headingRef, ...headingReveal } = useScrollReveal();

  const transition = prefersReducedMotion ? {} : pageTransition;

  return (
    <motion.div
      variants={transition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen px-4 py-6 md:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">
        {(title || subtitle || rightContent) && (
          <motion.div
            ref={headingRef}
            {...headingReveal}
            className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          >
            <div>
              {title && (
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-300 md:text-base">
                  {subtitle}
                </p>
              )}
            </div>
            {rightContent && <div>{rightContent}</div>}
          </motion.div>
        )}

        {children}
      </div>
    </motion.div>
  );
}

export default PageWrapper;
