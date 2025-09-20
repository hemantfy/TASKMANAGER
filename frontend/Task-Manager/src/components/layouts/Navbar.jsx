import React, { useState } from "react";
import { HiOutlineMenu, HiOutlineX } from "react-icons/hi";
import SideMenu from "./SideMenu";

const Navbar = ({ activeMenu }) => {
  const [openSideMenu, setOpenSideMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-white/30 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4 px-4 py-4 sm:gap-6 lg:px-8">
        <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-primary lg:hidden"
            onClick={() => {
            setOpenSideMenu((prev) => !prev);
        }}
        >
            {openSideMenu ? <HiOutlineX className="text-xl" /> : <HiOutlineMenu className="text-xl" />}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/90 via-indigo-500 to-sky-400 text-white shadow-lg shadow-primary/30">
            <span className="text-lg font-semibold">TM</span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/70">Task Manager</p>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Productivity Control Center</h1>
          </div>
        </div>
        </div>
        {openSideMenu && (
        <div className="border-t border-white/40 bg-white/80 px-4 pb-6 pt-3 shadow-[0_20px_45px_rgba(15,23,42,0.1)] lg:hidden">
          <SideMenu activeMenu={activeMenu} />
        </div>
      )}
    </header>
  );
};

export default Navbar;