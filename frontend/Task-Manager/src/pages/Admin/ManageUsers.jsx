import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { API_PATHS } from "../../utils/apiPaths";
import axiosInstance from "../../utils/axiosInstance";
import { LuFileSpreadsheet, LuUsers } from "react-icons/lu";
import UserCard from "../../components/Cards/UserCard";
import toast from "react-hot-toast";

const ManageUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    isAdmin: false,
  });

  const getAllUsers = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS);
      if (Array.isArray(response.data)) {
        setAllUsers(response.data);
      } else {
        setAllUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleInputChange = ({ target: { name, value, type, checked } }) => {
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.isAdmin ? "admin" : "user",
    };

    if (!payload.name || !payload.email || !payload.password) {
      toast.error("Please complete all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosInstance.post(API_PATHS.USERS.CREATE_USER, payload);
      toast.success("Team member added successfully.");
      setShowCreateForm(false);
      setFormData({ name: "", email: "", password: "", isAdmin: false });
      await getAllUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      const message = error?.response?.data?.message || "Unable to add member. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this user? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(API_PATHS.USERS.DELETE_USER(userId));
      toast.success("User removed successfully.");
      await getAllUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      const message = error?.response?.data?.message || "Failed to delete user. Please try again.";
      toast.error(message);
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              className="download-btn"
              onClick={() => setShowCreateForm((prev) => !prev)}
            >
              {showCreateForm ? "Close" : "Add Member"}
            </button>
            <button className="download-btn" onClick={handleDownloadReport}>
              <LuFileSpreadsheet className="text-lg" /> Export Roster
            </button>
          </div>
        </div>
      </section>

      {showCreateForm && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Add a new team member</h3>
          <p className="mt-1 text-sm text-slate-500">Provide the member's details and choose their access level.</p>

          <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={handleCreateUser}>
            <div className="md:col-span-1">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Jane Cooper"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                type="text"
                autoComplete="name"
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="member@company.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="md:col-span-1">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="password">
                Temporary Password
              </label>
              <input
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a secure password"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                type="password"
                autoComplete="new-password"
              />
            </div>

            <div className="md:col-span-1 flex items-end">
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600 shadow-inner">
                <input
                  type="checkbox"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Grant admin access to this member
              </label>
            </div>

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(79,70,229,0.35)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding Member..." : "Create Member"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="flex items-center gap-3 text-sm font-medium text-slate-600">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-sky-500 text-white shadow-[0_12px_28px_rgba(126,58,242,0.35)]">
          <LuUsers className="text-base" />
        </span>
        {allUsers.length} talented humans keeping the mission in motion.
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {allUsers?.map((user) => (
          <UserCard key={user._id} userInfo={user} onDelete={() => handleDeleteUser(user._id)} />
        ))}
      </section>
    </DashboardLayout>
  ); 
};

export default ManageUsers;