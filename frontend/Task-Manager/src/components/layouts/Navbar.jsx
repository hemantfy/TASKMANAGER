import React, { useCallback, useEffect, useState } from "react";
import { LuMoonStar, LuSun } from "react-icons/lu";
import NotificationBell from "../Notifications/NotificationBell";
import logo from "../../assets/images/logo.png";

const Navbar = ({ activeMenu: _activeMenu }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

  const applyThemePreference = useCallback((shouldUseDarkTheme) => {
    const root = document.documentElement;

    if (shouldUseDarkTheme) {
      root.classList.add("dark");
      localStorage.setItem("task-manager-theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("task-manager-theme", "light");
    }
  }, []);

  useEffect(() => {
    const storedPreference = localStorage.getItem("task-manager-theme");
    const prefersDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDarkTheme = storedPreference
      ? storedPreference === "dark"
      : prefersDarkMode;

    setIsDarkMode(shouldUseDarkTheme);
    applyThemePreference(shouldUseDarkTheme);

    const handleSystemThemeChange = (event) => {
      if (localStorage.getItem("task-manager-theme")) return;
      setIsDarkMode(event.matches);
      applyThemePreference(event.matches);
    };

    const mediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQueryList.addEventListener("change", handleSystemThemeChange);

    return () => mediaQueryList.removeEventListener("change", handleSystemThemeChange);
  }, [applyThemePreference]);

  const handleThemeToggle = () => {
    setIsDarkMode((previous) => {
      const nextValue = !previous;
      applyThemePreference(nextValue);
      return nextValue;
    });
  };

  return (
    <header className="app-header sticky top-0 z-30 border-b border-white/30 bg-white/70 backdrop-blur-xl">
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
             <p className="app-header-subtitle text-xs font-semibold uppercase tracking-[0.32em] text-primary/70">
                Task Manager
              </p>
              <h1 className="app-header-title text-lg font-semibold text-slate-900 sm:text-xl">
                RAVAL & TRIVEDI ASSOCIATES
              </h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button
            type="button"
            onClick={handleThemeToggle}
            className="theme-toggle inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/60 text-slate-600 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/90 hover:to-sky-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label={isDarkMode ? "Activate light mode" : "Activate dark mode"}
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <LuSun className="h-5 w-5" /> : <LuMoonStar className="h-5 w-5" />}
          </button>
          <NotificationBell />
        </div>
      </div>
    </header>
  );
};

export default Navbar;