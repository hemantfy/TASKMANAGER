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
    confirmPassword: "",
    gender: "",
    officeLocation: "",
    isAdmin: false,
  });
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);

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
      role: formData.isAdmin ? "admin" : "member",
      gender: formData.gender,
      officeLocation: formData.officeLocation,
    };

    if (!payload.name || !payload.email || !payload.password || !payload.gender || !payload.officeLocation) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Temporary password and confirmation do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosInstance.post(API_PATHS.USERS.CREATE_USER, payload);
      toast.success("Team member added successfully.");
      setShowCreateForm(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        gender: "",
        officeLocation: "",
        isAdmin: false,
      });
      await getAllUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      const message = error?.response?.data?.message || "Unable to add member. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    const userId = typeof user === "object" ? user?._id : user;
    const userName = typeof user === "object" ? user?.name : "";

    if (!userId) {
      toast.error("Unable to delete user. Please try again.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${userName || "this user"}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    const confirmTaskCleanup = window.confirm(
      "Deleting this team member will also remove any tasks assigned exclusively to them. Tasks shared with other members will remain available to the rest of the assignees. Do you want to proceed?"
    );

    if (!confirmTaskCleanup) return;

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

  const openResetPasswordModal = (user) => {
    setSelectedUser(user);
    setResetPasswordData({ newPassword: "", confirmPassword: "" });
    setShowResetPasswordModal(true);
  };

  const handleResetPasswordChange = ({ target: { name, value } }) => {
    setResetPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetPasswordSubmit = async (event) => {
    event.preventDefault();
    if (!selectedUser || isResettingPassword) return;

    if (!resetPasswordData.newPassword || !resetPasswordData.confirmPassword) {
      toast.error("Please enter and confirm the new password.");
      return;
    }

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    try {
      setIsResettingPassword(true);
      await axiosInstance.put(API_PATHS.USERS.RESET_USER_PASSWORD(selectedUser._id), {
        newPassword: resetPasswordData.newPassword,
      });
      toast.success("Password reset successfully. The user will be asked to change it on next login.");
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setResetPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error resetting password:", error);
      const message =
        error?.response?.data?.message || "Failed to reset password. Please try again.";
      toast.error(message);
    } finally {
      setIsResettingPassword(false);
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
              Password
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

            <div className="md:col-span-1">
              <label
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                htmlFor="gender"
              >
                Gender
              </label>
              <div className="custom-select mt-2">
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="custom-select__field"
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-1">
              <label
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                htmlFor="officeLocation"
              >
                Office Location
              </label>
              <div className="custom-select mt-2">
                <select
                  id="officeLocation"
                  name="officeLocation"
                  value={formData.officeLocation}
                  onChange={handleInputChange}
                  className="custom-select__field"
                >
                  <option value="" disabled>
                    Select office location
                  </option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Gift City">Gift City</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-1">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter the password"
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
          <UserCard
          key={user._id}
          userInfo={user}
          onDelete={() => handleDeleteUser(user._id)}
          onResetPassword={() => openResetPasswordModal(user)}
        />
        ))}
      </section>
      
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">
              Reset password for {selectedUser.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Create a temporary password. The user will be prompted to set their own password at next login.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleResetPasswordSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="newPassword">
                Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={resetPasswordData.newPassword}
                  onChange={handleResetPasswordChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={resetPasswordData.confirmPassword}
                  onChange={handleResetPasswordChange}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  autoComplete="new-password"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setSelectedUser(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(79,70,229,0.35)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? "Updating..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageUsers;