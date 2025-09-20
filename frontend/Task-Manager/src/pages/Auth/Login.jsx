import React, { useContext, useState } from 'react';
import AuthLayout from '../../components/layouts/AuthLayout';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);

  const { updateUser } = useContext(UserContext);
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
      
      const { token, role } = response.data;
      
      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data);
      
        // Redirect based on role
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
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

  return (
    <AuthLayout>
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
            <button
              type="button"
              className="text-left text-sm font-medium text-blue-600 transition hover:text-blue-500"
            >
              Forgot password?
            </button>
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
          Don&apos;t have an account?{' '}
          <Link className="font-semibold text-blue-600 transition hover:text-blue-500" to="/signUp">
            Create one now
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
