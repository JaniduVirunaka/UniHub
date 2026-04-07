import { motion } from "framer-motion";

function PageWrapper({ title, subtitle, children, rightContent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="min-h-screen px-4 py-6 md:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            {title && (
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {rightContent && <div>{rightContent}</div>}
        </div>

        {children}
      </div>
    </motion.div>
  );
}

export default PageWrapper;
