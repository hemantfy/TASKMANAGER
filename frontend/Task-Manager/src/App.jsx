import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";
import Dashboard from "./pages/Admin/Dashboard";
import Login from "./pages/Auth/Login";
import ManageTasks from "./pages/Admin/ManageTasks";
import CreateTask from "./pages/Admin/CreateTask";
import ManageUsers from "./pages/Admin/ManageUsers";
import UserDetails from "./pages/Admin/UserDetails";
import ProfileSettings from "./pages/Profile/ProfileSettings";
import SignUp from "./pages/Auth/SignUp";
import Unauthorized from "./pages/Errors/Unauthorized";

import UserDashboard from "./pages/User/UserDashboard";
import MyTasks from "./pages/User/MyTasks";
import ViewTaskDetails from "./pages/User/ViewTaskDetails";
import UserProvider, { UserContext } from "./context/userContext";
import { Toaster } from "react-hot-toast";
import { getDefaultRouteForRole } from "./utils/roleUtils";


const App = () => {
  return (
    
    <UserProvider>
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signUp" element={<SignUp />} />


          {/* Admin Routes */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/tasks" element={<ManageTasks />} />
            <Route path="/admin/create-task" element={<CreateTask />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/users/:userId" element={<UserDetails />} />
            <Route path="/admin/profile-settings" element={<ProfileSettings />} />
          </Route>

          {/* Owner Routes */}
          <Route element={<PrivateRoute allowedRoles={["owner"]} />}>
            <Route path="/owner/dashboard" element={<Dashboard />} />
            <Route path="/owner/tasks" element={<ManageTasks />} />
            <Route path="/owner/create-task" element={<CreateTask />} />
            <Route path="/owner/users" element={<ManageUsers />} />
            <Route path="/owner/users/:userId" element={<UserDetails />} />
            <Route path="/owner/profile-settings" element={<ProfileSettings />} />
          </Route>

          {/* User Routes */}
          <Route element={<PrivateRoute allowedRoles={["user", "admin", "owner"]} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<MyTasks />} />
            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
            <Route path="/user/profile-settings" element={<ProfileSettings />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Default Route*/}
        </Routes>
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
