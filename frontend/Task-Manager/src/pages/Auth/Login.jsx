import React, { useContext, useState } from 'react'
import AuthLayout from '../../components/layouts/AuthLayout';
import {useNavigate, Link} from 'react-router-dom'
import Input from '../../components/inputs/input';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const {updateUser} = useContext(UserContext)
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
    
    // If validation passes, proceed with login logic
    console.log("Form is valid, proceeding with login...");
    // Login API call here
    try{
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      });
      
      const { token, role } = response.data;
      
      if (token) {
        localStorage.setItem("token", token);
        updateUser(response.data)
      
        // Redirect based on role
        if (role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/user/dashboard");
        }
      }      
    } catch (error){
      if (error.response && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }      
    }
  };

  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center">
        <h3 className="text-2xl font-semibold mb-2">Welcome Back</h3>
        <p className="text-xs text-slate-700 mt-[5px] mb-6">
          Please enter your details to log in
        </p>
        <form onSubmit={handleLogin}>
          <input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            placeholder="Email Address"
            type="text"
            className="w-full p-3 border border-gray-300 rounded mb-4"
          />
          <input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            placeholder="Password"
            type="password"
            className="w-full p-3 border border-gray-300 rounded mb-4"
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
            LOGIN
          </button>
        </form>
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        <p className="text-[13px] text-slate-800 mt-3 text-center">
          Don't have an account?{" "}
          <Link className="font-medium text-blue-600 underline hover:text-blue-800" to="/signUp">
            SignUp
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login
