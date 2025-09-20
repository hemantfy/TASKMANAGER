import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/40 blur-3xl" />
        <div className="absolute top-1/2 right-[-10%] h-[28rem] w-[28rem] -translate-y-1/2 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute bottom-[-20%] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:px-12">
        <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-3xl border border-white/10 bg-white/10 shadow-2xl shadow-blue-900/40 backdrop-blur-xl lg:grid-cols-[1.05fr_1fr]">
          <div className="hidden flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-10 text-white lg:flex xl:p-12">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-blue-50/80">
              Raval & Trivedi Associates Task Manager 
              </span>
              <h2 className="mt-8 text-3xl font-semibold leading-tight xl:text-4xl">
                Organize your work with clarity and inspire your team to deliver.
              </h2>
              <p className="mt-5 max-w-md text-sm text-blue-50/80 xl:text-base">
                Plan your roadmap, watch progress in real time, and celebrate every milestone. Beautiful dashboards and smart automation keep everyone aligned.
              </p>

              <div className="mt-10 grid gap-5">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-lg shadow-black/10 backdrop-blur">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-blue-100/80">
                    <span>Weekly Focus</span>
                    <span>On Track</span>
                  </div>
                  <div className="mt-5 flex items-end gap-3">
                    <p className="text-4xl font-semibold">92%</p>
                    <span className="text-sm text-blue-50/80">Team completion rate</span>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-white/20">
                    <span className="block h-full w-[92%] rounded-full bg-white" />
                  </div>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg shadow-blue-900/10 backdrop-blur">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Automated status reports</p>
                    <p className="text-xs text-blue-50/80">
                      Turn project updates into visual stories that keep your stakeholders inspired.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col justify-center bg-white/90 px-6 py-10 text-slate-900 backdrop-blur-sm sm:px-10 md:px-12 lg:px-10 xl:px-12">
            <div className="absolute inset-x-10 top-0 h-1 rounded-b-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-semibold text-white shadow-lg shadow-blue-500/40">
                TM
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Task Manager</p>
                <p className="text-base font-semibold text-slate-900">Productivity Suite</p>
              </div>
            </div>
            <div className="w-full">{children}</div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default AuthLayout;