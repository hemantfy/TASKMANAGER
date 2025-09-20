import React, { useContext } from "react";
import { UserContext } from "../../context/userContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="relative min-h-screen">
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[-10%] top-[-20%] h-72 w-72 rounded-full bg-gradient-to-br from-blue-200/80 via-indigo-100/70 to-transparent blur-3xl" />
      <div className="absolute right-[-20%] top-[12%] h-96 w-96 rounded-full bg-gradient-to-bl from-purple-200/70 via-sky-100/80 to-transparent blur-3xl" />
      <div className="absolute bottom-[-25%] left-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-100/80 via-blue-100/70 to-transparent blur-3xl" />
    </div>

      <Navbar activeMenu={activeMenu} />

      {user && (
        <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 pb-14 pt-6 lg:px-8">
          <div className="hidden shrink-0 lg:block lg:w-[260px] xl:w-[280px]">
            <SideMenu activeMenu={activeMenu} />
          </div>

          <main className="relative w-full flex-1 rounded-[28px] border border-white/40 bg-white/70 p-4 shadow-[0_26px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
              {children}
            </div>
          </main>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
