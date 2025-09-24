import React, { useContext, useState } from "react";
import AuthLayout from "../../components/layouts/AuthLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changePasswordError, setChangePasswordError] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [pendingRoleRedirect, setPendingRoleRedirect] = useState(null);

  const { updateUser, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Handle Login Form Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate email
    if (!email.trim()) {
      setError("Please enter an email address.");
      return;
    }
    
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    // Validate password
    if (!password.trim()) {
      setError("Please enter a password.");
      return;
    }
    
    
    try{
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });

      const { token, role, mustChangePassword } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
      
     if (mustChangePassword) {
          setPendingRoleRedirect(role);
          setShowChangePasswordModal(true);
        } else {
          // Redirect based on role
          if (role === "admin") {
            navigate("/admin/dashboard");
          } else {
            navigate("/user/dashboard");
          }
        }
      }
    } catch (error) {
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  const handleChangePasswordInput = ({ target: { name, value } }) => {
    setChangePasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleForcePasswordChange = async (event) => {
    event.preventDefault();
    if (isChangingPassword) return;

    setChangePasswordError(null);

    if (!changePasswordForm.currentPassword || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword) {
      setChangePasswordError("Please complete all fields.");
      return;
    }

    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setChangePasswordError("New password and confirm password do not match.");
      return;
    }

    try {
      setIsChangingPassword(true);
      await axiosInstance.put(API_PATHS.PROFILE.CHANGE_PASSWORD, {
        currentPassword: changePasswordForm.currentPassword,
        newPassword: changePasswordForm.newPassword,
      });

      const profileResponse = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
      const token = localStorage.getItem("token");
      updateUser({ ...profileResponse.data, token });

      setShowChangePasswordModal(false);
      setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });

      const role = pendingRoleRedirect || profileResponse?.data?.role;
      setPendingRoleRedirect(null);
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (error) {
      if (error.response && error.response.data?.message) {
        setChangePasswordError(error.response.data.message);
      } else {
        setChangePasswordError("Failed to update password. Please try again.");
      }
    } finally {
      setIsChangingPassword(false);      
    }
  };

  return (
    <AuthLayout>
      <>
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-3xl font-semibold text-slate-900">Welcome back</h3>
          <p className="text-sm text-slate-500">
            It&apos;s great to see you again. Sign in to orchestrate your team&apos;s next success story.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Email Address
            </label>
            <input
              id="email"
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              placeholder="you@company.com"
              type="email"
              className="auth-input"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Password
            </label>
            <input
              id="password"
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              placeholder="Enter your password"
              type="password"
              className="auth-input"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={({ target }) => setRememberMe(target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Remember me on this device
            </label>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm">
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit">
            Continue to dashboard
          </button>
        </form>
        
        <div className="text-center text-sm text-slate-600">
            Need access? Please reach out to your workspace admin to get an account.
          </div>
        </div>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">Update your password</h3>
              <p className="mt-1 text-sm text-slate-500">
                For security, please replace the temporary password provided by your admin with one of your own.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleForcePasswordChange}>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="currentPassword">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={changePasswordForm.currentPassword}
                    onChange={handleChangePasswordInput}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    autoComplete="current-password"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="newPassword">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={changePasswordForm.newPassword}
                    onChange={handleChangePasswordInput}
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
                    value={changePasswordForm.confirmPassword}
                    onChange={handleChangePasswordInput}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    autoComplete="new-password"
                  />
                </div>

                {changePasswordError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm">
                    {changePasswordError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setChangePasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setPendingRoleRedirect(null);
                      clearUser();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(79,70,229,0.35)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Updating..." : "Save Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    </AuthLayout>
  );
};

export default Login;
