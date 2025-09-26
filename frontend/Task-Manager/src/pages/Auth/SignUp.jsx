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
  const [gender, setGender] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");

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
    
    if (!gender) {
      setError("Please select your gender.");
      return;
    }

    if (!officeLocation) {
      setError("Please select your office location.");
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
        gender,
        officeLocation,
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
                        <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" htmlFor="gender">
                Gender
              </label>
              <div className="input-box">
                <select
                  id="gender"
                  value={gender}
                  onChange={({ target }) => setGender(target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
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
            <div className="space-y-2">
              <label
                className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500"
                htmlFor="officeLocation"
              >
                Office Location
              </label>
              <div className="input-box">
                <select
                  id="officeLocation"
                  value={officeLocation}
                  onChange={({ target }) => setOfficeLocation(target.value)}
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                >
                  <option value="" disabled>
                    Select office location
                  </option>
                  <option value="Ahmedabad">Ahmedabad</option>
                  <option value="Gift City">Gift City</option>
                </select>
              </div>
            </div>
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