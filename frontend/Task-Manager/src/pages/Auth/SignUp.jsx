import React, { useContext, useState } from 'react';
import AuthLayout from '../../components/layouts/AuthLayout';
import { Link, useNavigate } from 'react-router-dom';
import ProfilePhotoSelector from '../../components/inputs/ProfilePhotoSelector';
import Input from '../../components/inputs/input';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import uploadImage from '../../utils/uploadImage';
import { UserContext } from '../../context/userContext';

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminInviteToken, setAdminInviteToken] = useState("");

  const [error, setError] = useState(null);

  const {updateUser} = useContext(UserContext);
  const navigate = useNavigate();

  // Handle SignUp Form Submit
  const handleSignUp = async (e) => {
    e.preventDefault();

    let profileImageUrl = '';
    
    // Clear previous errors
    setError(null);
    if (!fullName) {
      setError("Please enter full name.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    
    // Validate password
    if (!password.trim()) {
      setError("Please enter a password.");
      return;
    }
    // SignUp API call here.
    try{
      // Upload image if present
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes.imageUrl || "";
      }

      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        name: fullName,
        email,
        password,
        profileImageUrl,
        adminInviteToken,
      });
      
      const { token, role } = response.data;
      
      if (token) {
        updateUser(response.data, { rememberMe: true });
      }   
      
      // Redirect based on role
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/dashboard");
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
     <div className="space-y-5">
        <div className="space-y-2">
          <h3 className="text-3xl font-semibold text-slate-900">Create your account</h3>
          <p className="text-sm text-slate-500">
            Join a community of makers who plan smarter, ship faster, and celebrate the wins together.
          </p>
        </div>
        <form onSubmit={handleSignUp} className="mt-6 space-y-6">
          <div className="flex justify-center">
            <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Input
              value={fullName}
              onChange={({ target }) => setFullName(target.value)}
              label="Full Name"
              placeholder="Alex Johnson"
              type="text"
            />
            <Input
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Email Address"
              placeholder="alex@studio.com"
              type="email"
            />
            <Input
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              label="Password"
              placeholder="Minimum 8 characters"
              type="password"
            />
            <Input
              value={adminInviteToken}
              onChange={({ target }) => setAdminInviteToken(target.value)}
              label="Admin Invite Token"
              placeholder="6 digit token (optional)"
              type="text"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm">
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit">
            Launch my workspace
          </button>

          <p className="text-center text-xs text-slate-500">
            By continuing, you agree to our{' '}
            <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-semibold text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
            .
          </p>
          </form>

        <div className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link className="font-semibold text-blue-600 transition hover:text-blue-500" to="/login">
            Log in instead
          </Link>
        </div>
          
        
      </div>
    </AuthLayout>
  );
};

export default SignUp;