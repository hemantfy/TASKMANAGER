import React, { Suspense, useContext } from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";

import UserProvider, { UserContext } from "./context/userContext";
import { Toaster } from "react-hot-toast";
import { getDefaultRouteForRole } from "./utils/roleUtils";
const AdminDashboard = React.lazy(() => import("./pages/Admin/Dashboard"));
const Login = React.lazy(() => import("./pages/Auth/Login"));
const AdminTasks = React.lazy(() => import("./pages/Admin/Tasks"));
const AdminManageUsers = React.lazy(() => import("./pages/Admin/ManageUsers"));
const AdminUserDetails = React.lazy(() => import("./pages/Admin/UserDetails"));
const ProfileSettings = React.lazy(() => import("./pages/Profile/ProfileSettings"));
const SignUp = React.lazy(() => import("./pages/Auth/SignUp"));
const Unauthorized = React.lazy(() => import("./pages/Errors/Unauthorized"));
const UserDashboard = React.lazy(() => import("./pages/User/UserDashboard"));
const MyTasks = React.lazy(() => import("./pages/User/MyTasks"));
const ViewTaskDetails = React.lazy(() => import("./pages/User/ViewTaskDetails"));
const OwnerDashboard = React.lazy(() => import("./pages/Owner/Dashboard"));
const OwnerTasks = React.lazy(() => import("./pages/Owner/Tasks"));
const OwnerManageUsers = React.lazy(() => import("./pages/Owner/ManageUsers"));
const OwnerUserDetails = React.lazy(() => import("./pages/Owner/UserDetails"));
const ClientDashboard = React.lazy(() => import("./pages/Client/ClientDashboard"));
const ClientProjects = React.lazy(() => import("./pages/Client/ClientProjects"));
const ClientViewTaskDetails = React.lazy(() => import("./pages/Client/ViewTaskDetails"));

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
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/tasks" element={<AdminTasks />} />
            <Route path="/admin/users" element={<AdminManageUsers />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
            <Route path="/admin/profile-settings" element={<ProfileSettings />} />
          </Route>

          {/* Owner Routes */}
          <Route element={<PrivateRoute allowedRoles={["owner"]} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/tasks" element={<OwnerTasks />} />
            <Route path="/owner/users" element={<OwnerManageUsers />} />
            <Route path="/owner/users/:userId" element={<OwnerUserDetails />} />
            <Route path="/owner/profile-settings" element={<ProfileSettings />} />
          </Route>

          {/* Member Routes */}
          <Route element={<PrivateRoute allowedRoles={["member", "user"]} />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/tasks" element={<MyTasks />} />
            <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
            <Route path="/user/profile-settings" element={<ProfileSettings />} />
          </Route>

          {/* Client Routes */}
          <Route element={<PrivateRoute allowedRoles={["client"]} />}>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/projects" element={<ClientProjects />} />
            <Route
              path="/client/task-details/:id"
              element={<ClientViewTaskDetails />}
            />
            <Route path="/client/profile-settings" element={<ProfileSettings />} />
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
