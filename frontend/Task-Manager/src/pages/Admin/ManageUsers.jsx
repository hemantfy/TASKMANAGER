import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { LuFileSpreadsheet, LuUsers } from "react-icons/lu";
import UserCard from "../../components/Cards/UserCard";
import toast from "react-hot-toast";

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([]);

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      if (response.data?.length > 0) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // download task report
  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_USERS, {
        responseType: "blob",
      });
    
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "user_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading expense details:", error);
      toast.error("Failed to download Team Members Report. Please try again later.");
    }    
  };

  useEffect(() => {
    getAllUsers();

    return () => {};
  }, []);

  return (
    <DashboardLayout activeMenu="Team Members">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-primary via-indigo-500 to-purple-500 px-6 py-8 text-white shadow-[0_20px_45px_rgba(126,58,242,0.28)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(251,191,36,0.16),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/70">Dream Team</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">Team Members</h2>
            <p className="mt-3 text-sm text-white/70">
              Celebrate collaboration with clear visibility into progress and wins.
            </p>
          </div>

          <button className="download-btn" onClick={handleDownloadReport}>
            <LuFileSpreadsheet className="text-lg" /> Export Roster
          </button>
        </div>
      </section>

      <section className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-sky-500 text-white shadow-[0_12px_28px_rgba(126,58,242,0.35)]">
          <LuUsers className="text-base" />
        </span>
        {allUsers.length} talented humans keeping the mission in motion.
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {allUsers?.map((user) => (
          <UserCard key={user._id} userInfo={user} />
        ))}
      </section>
    </DashboardLayout>
  );  
};

export default ManageUsers;