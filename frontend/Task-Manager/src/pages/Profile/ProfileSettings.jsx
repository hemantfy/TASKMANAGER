import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  LuTriangleAlert,
  LuCamera,
  LuLoader,
  LuShieldCheck,
  LuTrash2,
} from "react-icons/lu";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { UserContext } from "../../context/userContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { getToken } from "../../utils/tokenStorage";
import { FaUser } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { normalizeRole } from "../../utils/roleUtils";

const ProfileSettings = () => {
  const { user, updateUser, clearUser } = useContext(UserContext);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [birthdate, setBirthdate] = useState(
    user?.birthdate ? user.birthdate.slice(0, 10) : ""
  );
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountStep, setDeleteAccountStep] = useState("token");
  const [inviteToken, setInviteToken] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const navigate = useNavigate();

  const gender = user?.gender || "Not specified";
  const officeLocation = user?.officeLocation || "Not specified";

  const currentProfileImage = useMemo(() => {
    return previewUrl || user?.profileImageUrl || "";
  }, [previewUrl, user?.profileImageUrl]);

    const normalizedRole = useMemo(
    () => normalizeRole(user?.role),
    [user?.role]
  );
  const isOwner = normalizedRole === "owner";

  useEffect(() => {
    setDisplayName(user?.name || "");
    setBirthdate(user?.birthdate ? user.birthdate.slice(0, 10) : "");
  }, [user?.name, user?.birthdate]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (!displayName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const response = await axiosInstance.put(API_PATHS.PROFILE.UPDATE_PROFILE, {
        name: displayName.trim(),
        birthdate: birthdate || null,
      });

      const existingToken = getToken();

      const { token: newToken, message, ...updatedUserData } = response.data || {};

      updateUser({
        ...(user || {}),
        ...updatedUserData,
        token: newToken || existingToken,
      });

      toast.success(message || "Profile updated successfully");
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelectedImage(null);
      setPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handlePhotoSubmit = async (event) => {
    event.preventDefault();

    if (!selectedImage) {
      toast.error("Please choose an image to upload");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", selectedImage);

    try {
      setIsUpdatingPhoto(true);
      const response = await axiosInstance.put(
        API_PATHS.PROFILE.UPDATE_PHOTO,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const updatedImageUrl = response.data?.profileImageUrl || "";
      const existingToken = getToken();

      updateUser({
        ...(user || {}),
        profileImageUrl: updatedImageUrl,
        token: existingToken,
      });

      setSelectedImage(null);
      setPreviewUrl(null);
      toast.success(response.data?.message || "Profile photo updated");
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to update photo";
      toast.error(message);
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

    const openDeleteAccountModal = () => {
    setInviteToken("");
    setDeleteAccountStep("token");
    setShowDeleteAccountModal(true);
  };

  const closeDeleteAccountModal = () => {
    if (isDeletingAccount) {
      return;
    }

    setShowDeleteAccountModal(false);
    setInviteToken("");
    setDeleteAccountStep("token");
  };

  const handleInviteTokenSubmit = (event) => {
    event.preventDefault();

    const trimmedToken = inviteToken.trim();
    if (!trimmedToken) {
      toast.error("Please enter the invite token to continue.");
      return;
    }

    setDeleteAccountStep("confirm");
  };

  const handleConfirmDeleteAccount = async () => {
    const trimmedToken = inviteToken.trim();

    if (!trimmedToken) {
      toast.error("Invite token is required to delete your account.");
      setDeleteAccountStep("token");
      return;
    }

    if (!user?._id) {
      toast.error("Unable to delete account. Please try again.");
      return;
    }

    try {
      setIsDeletingAccount(true);
      await axiosInstance.delete(API_PATHS.USERS.DELETE_USER(user._id), {
        data: { adminInviteToken: trimmedToken },
      });
      toast.success("Your account has been deleted.");
      setShowDeleteAccountModal(false);
      setInviteToken("");
      setDeleteAccountStep("token");
      clearUser();
      navigate("/login");
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to delete account.";
      toast.error(message);
      setDeleteAccountStep("token");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password should be at least 6 characters long");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const response = await axiosInstance.put(
        API_PATHS.PROFILE.CHANGE_PASSWORD,
        {
          currentPassword,
          newPassword,
        }
      );

      toast.success(response.data?.message || "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to update password";
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <DashboardLayout activeMenu="Profile Setting">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 px-4 py-7 text-white shadow-[0_20px_45px_rgba(59,130,246,0.25)] sm:px-6 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.2),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/70">Account</p>
            <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">Profile Settings</h2>
            <p className="text-sm text-white/80">
              Update your profile photo and keep your credentials secure.
            </p>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={openDeleteAccountModal}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600 sm:mt-0"
            >
              <LuTrash2 className="text-sm" /> Delete Account
            </button>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleProfileSubmit} className="card flex flex-col gap-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Profile Information</h3>
              <p className="mt-1 text-sm text-slate-500">
                Update your display name and share your birthdate to receive a special greeting.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="displayName" className="text-sm font-medium text-slate-600">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none"
                placeholder="Enter your name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="birthdate" className="text-sm font-medium text-slate-600">
                Birthdate
              </label>
              <input
                id="birthdate"
                type="date"
                value={birthdate}
                onChange={(event) => setBirthdate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none"
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-600">Gender</p>
              <div className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner">
                {gender}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-slate-600">Office Name</p>
              <div className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner">
                {officeLocation}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900 via-indigo-800 to-primary px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(30,64,175,0.35)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUpdatingProfile ? (
                <>
                  <LuLoader className="mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>

        <form onSubmit={handlePhotoSubmit} className="card flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Profile Photo</h3>
              <p className="mt-1 text-sm text-slate-500">
                Upload a clear photo so your team can recognise you instantly.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative">
              <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-gradient-to-tr from-primary/30 to-cyan-200/40 blur-2xl" />
              {currentProfileImage ? <img
                src={currentProfileImage}
                alt="Profile"
                className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg shadow-primary/20"
              /> : <FaUser className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg shadow-primary/20 text-primary p-3"/>}
              <label
                htmlFor="profileImage"
                className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-primary via-indigo-500 to-sky-400 text-white shadow-[0_12px_24px_rgba(79,70,229,0.35)]"
              >
                <LuCamera className="text-lg" />
              </label>
            </div>

            <div className="flex-1 text-sm text-slate-600">
              <p className="font-medium text-slate-700">Recommended formats</p>
              <p className="mt-1 text-slate-500">JPEG or PNG up to 5MB.</p>
              <input
                id="profileImage"
                name="profileImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={isUpdatingPhoto || !selectedImage}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary via-indigo-500 to-sky-400 px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(59,130,246,0.35)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUpdatingPhoto ? (
                <>
                  <LuLoader className="mr-2 animate-spin" /> Updating...
                </>
              ) : (
                "Save Photo"
              )}
            </button>
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="card flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-sky-500 text-white shadow-[0_12px_24px_rgba(14,165,233,0.35)]">
              <LuShieldCheck className="text-lg" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Change Password</h3>
              <p className="text-sm text-slate-500">
                Ensure your new password is unique and hard to guess.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="currentPassword" className="text-sm font-medium text-slate-600">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none"
                placeholder="Enter current password"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-slate-600">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none"
                placeholder="Enter new password"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-600">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-primary focus:outline-none"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-slate-900 via-indigo-800 to-primary px-6 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(30,64,175,0.35)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUpdatingPassword ? (
                <>
                  <LuLoader className="mr-2 animate-spin" /> Updating...
                </>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </form>
      </div>

      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Delete Owner Account
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This action permanently removes your profile and related
                  data.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteAccountModal}
                className="rounded-full border border-slate-200 p-1 text-slate-400 transition hover:border-slate-300 hover:text-slate-500"
                disabled={isDeletingAccount}
                aria-label="Close delete account dialog"
              >
                ×
              </button>
            </div>

            {deleteAccountStep === "token" ? (
              <form className="mt-6 space-y-4" onSubmit={handleInviteTokenSubmit}>
                <div className="space-y-2">
                  <label
                    htmlFor="ownerInviteToken"
                    className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                  >
                    Admin Invite Token
                  </label>
                  <input
                    id="ownerInviteToken"
                    type="text"
                    value={inviteToken}
                    onChange={(event) => setInviteToken(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                    placeholder="Enter the invite token"
                    autoComplete="off"
                    disabled={isDeletingAccount}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeDeleteAccountModal}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-600"
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-600"
                    disabled={isDeletingAccount}
                  >
                    Continue
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-3 text-rose-600">
                  <LuTriangleAlert className="text-lg" />
                  <p className="text-sm font-medium">
                    Deleting your owner account will remove access for this
                    user immediately.
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  Please confirm that you wish to permanently delete your
                  account. This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteAccountStep("token")}
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-300 hover:text-slate-600"
                    disabled={isDeletingAccount}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteAccount}
                    className="inline-flex items-center justify-center rounded-2xl border border-rose-300 bg-rose-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_24px_rgba(244,63,94,0.35)] transition hover:bg-rose-600 disabled:opacity-70"
                    disabled={isDeletingAccount}
                  >
                    {isDeletingAccount ? (
                      <>
                        <LuLoader className="mr-2 animate-spin" /> Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}      
    </DashboardLayout>
  );
};

export default ProfileSettings;