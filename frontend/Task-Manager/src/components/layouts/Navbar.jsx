import React from "react";
import NotificationBell from "../Notifications/NotificationBell";
import logo from "../../assets/images/logo.png";

const Navbar = ({ activeMenu: _activeMenu }) => {
  return (
    <header className="sticky top-0 z-30 border-b border-white/30 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4 px-4 py-4 sm:gap-6 lg:px-8">
        <div className="flex flex-1 items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
           <img
              src={logo}
              srcSet={`${logo} 1x, ${logo} 2x`}
              sizes="44px"
              alt="Task Manager logo"
              loading="eager"
              decoding="async"
              className="h-11 w-11 shrink-0 rounded-2xl object-cover shadow-lg shadow-primary/30"
              style={{ imageRendering: "-webkit-optimize-contrast" }}
            />
            <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/70">Task Manager</p>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">RAVAL & TRIVEDI ASSOCIATES</h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default Navbar;