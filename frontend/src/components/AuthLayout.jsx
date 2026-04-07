import { motion } from "framer-motion";

function AuthLayout({ title, subtitle, sideTitle, sideText, children }) {
  return (
    <div className="flex min-h-[calc(100vh-90px)] items-center justify-center px-4 py-8 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl lg:grid-cols-2"
      >
        <div className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-blue-500/20 p-10 lg:block">
          <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-48 w-48 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1 text-sm text-emerald-200">
                ITP Sport Platform
              </div>

              <h2 className="mt-6 text-4xl font-black leading-tight text-white">
                {sideTitle}
              </h2>

              <p className="mt-4 max-w-md text-base leading-7 text-slate-200">
                {sideText}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-sm text-slate-300">
                  Clean role-based access for admins, captains, vice captains, and students.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
                <p className="text-sm text-slate-300">
                  Smart workflows for sport requests, approvals, team leadership, and student participation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-slate-300 md:text-base">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default AuthLayout;