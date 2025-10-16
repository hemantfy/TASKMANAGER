import React, { Suspense, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";

import UserProvider, { UserContext } from "./context/userContext";
import { Toaster } from "react-hot-toast";
import { getDefaultRouteForRole } from "./utils/roleUtils";
const Dashboard = React.lazy(() => import("./pages/Admin/Dashboard"));
const Login = React.lazy(() => import("./pages/Auth/Login"));
const Tasks = React.lazy(() => import("./pages/Admin/Tasks"));
const ManageUsers = React.lazy(() => import("./pages/Admin/ManageUsers"));
const UserDetails = React.lazy(() => import("./pages/Admin/UserDetails"));
const ProfileSettings = React.lazy(() => import("./pages/Profile/ProfileSettings"));
const SignUp = React.lazy(() => import("./pages/Auth/SignUp"));
const Unauthorized = React.lazy(() => import("./pages/Errors/Unauthorized"));
const UserDashboard = React.lazy(() => import("./pages/User/UserDashboard"));
const MyTasks = React.lazy(() => import("./pages/User/MyTasks"));
const ViewTaskDetails = React.lazy(() => import("./pages/User/ViewTaskDetails"));

const App = () => {
  return (
    
    <UserProvider>
    <div>
      <Router>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600">
              Loading workspace...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signUp" element={<SignUp />} />


          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/tasks" element={<Tasks />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/users/:userId" element={<UserDetails />} />
            <Route path="/admin/profile-settings" element={<ProfileSettings />} />
          </Route>

          {/* Owner Routes */}
          <Route element={<PrivateRoute allowedRoles={["owner"]} />}>
            <Route path="/owner/dashboard" element={<Dashboard />} />
            <Route path="/owner/tasks" element={<Tasks />} />
            <Route path="/owner/users" element={<ManageUsers />} />
            <Route path="/owner/users/:userId" element={<UserDetails />} />
            <Route path="/owner/profile-settings" element={<ProfileSettings />} />
          </Route>

          {/* Member Routes */}
          <Route element={<PrivateRoute allowedRoles={["member", "user"]} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<MyTasks />} />
            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
            <Route path="/user/profile-settings" element={<ProfileSettings />} />
          </Route>          

          <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Default Route*/}
          </Routes>
        </Suspense>
      </Router>
    </div>

    <Toaster
        toastOptions={{
          className: "",
          style: {
            fontSize: "13px",
          },
        }}
      />
    </UserProvider>
  );
};

export default App;

const Root = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) return <Outlet/>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  const destination = getDefaultRouteForRole(user.role);

  return <Navigate to={destination} />;
};
