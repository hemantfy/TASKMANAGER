import React, { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../../context/userContext";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import BirthdayModal from "../modals/BirthdayModal";
import LoadingOverlay from "../LoadingOverlay";

const DashboardLayout = ({ children, activeMenu }) => {
  const { user, loading } = useContext(UserContext);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);

  const shouldShowBirthday = useMemo(() => {
    if (!user?.birthdate) {
      return false;
    }

    const birthDate = new Date(user.birthdate);
    if (Number.isNaN(birthDate.getTime())) {
      return false;
    }

    const today = new Date();
    return (
      birthDate.getDate() === today.getDate() &&
      birthDate.getMonth() === today.getMonth()
    );
  }, [user?.birthdate]);

  useEffect(() => {
    if (!shouldShowBirthday || !user?._id) {
      setShowBirthdayModal(false);
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const storageKey = `birthdayShown:${user._id}`;
    const todayKey = new Date().toISOString().slice(0, 10);
    const alreadyShown = window.localStorage.getItem(storageKey);

    if (alreadyShown === todayKey) {
      setShowBirthdayModal(false);
      return;
    }

    window.localStorage.setItem(storageKey, todayKey);
    setShowBirthdayModal(true);
  }, [shouldShowBirthday, user?._id]);

  if (loading) {
    return (
      <LoadingOverlay
        fullScreen
        message="Preparing your workspace..."
      />
    );
  }

  if (!user) {
    return (
      <LoadingOverlay
        fullScreen
        message="Redirecting to sign in..."
      />
    );
  }

  return (
    <div className="relative min-h-screen">
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[-10%] top-[-20%] h-72 w-72 rounded-full bg-gradient-to-br from-blue-200/80 via-indigo-100/70 to-transparent blur-3xl" />
      <div className="absolute right-[-20%] top-[12%] h-96 w-96 rounded-full bg-gradient-to-bl from-purple-200/70 via-sky-100/80 to-transparent blur-3xl" />
      <div className="absolute bottom-[-25%] left-1/3 h-80 w-80 rounded-full bg-gradient-to-br from-cyan-100/80 via-blue-100/70 to-transparent blur-3xl" />
    </div>

      <Navbar activeMenu={activeMenu} />

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
      
      {showBirthdayModal && (
        <BirthdayModal
          name={user?.name}
          onClose={() => setShowBirthdayModal(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
