import React, { Suspense, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";

import UserProvider, { UserContext } from "./context/userContext.jsx";
import { Toaster } from "react-hot-toast";
import { getDefaultRouteForRole } from "./utils/roleUtils";
import LoadingOverlay from "./components/LoadingOverlay";
const AdminDashboard = React.lazy(() => import("./pages/Admin/Dashboard"));
const Login = React.lazy(() => import("./pages/Auth/Login"));
const AdminTasks = React.lazy(() => import("./pages/Admin/Tasks"));
const AdminManageEmployees = React.lazy(() => import("./pages/Admin/ManageEmployees"));
const AdminManageClients = React.lazy(() => import("./pages/Admin/ManageClients"));
const AdminUserDetails = React.lazy(() => import("./pages/Admin/UserDetails"));
const AdminMatters = React.lazy(() => import("./pages/Admin/Matters"));
const AdminDocuments = React.lazy(() => import("./pages/Admin/Documents"));
const ProfileSettings = React.lazy(() => import("./pages/Profile/ProfileSettings"));
const SignUp = React.lazy(() => import("./pages/Auth/SignUp"));
const Unauthorized = React.lazy(() => import("./pages/Errors/Unauthorized"));
const UserDashboard = React.lazy(() => import("./pages/User/UserDashboard"));
const MyTasks = React.lazy(() => import("./pages/User/MyTasks"));
const ViewTaskDetails = React.lazy(() => import("./pages/User/ViewTaskDetails"));
const UserMatters = React.lazy(() => import("./pages/User/Matters"));
const UserDocuments = React.lazy(() => import("./pages/User/Documents"));
const OwnerDashboard = React.lazy(() => import("./pages/Owner/Dashboard"));
const OwnerTasks = React.lazy(() => import("./pages/Owner/Tasks"));
const OwnerManageEmployees = React.lazy(() => import("./pages/Owner/ManageEmployees"));
const OwnerManageClients = React.lazy(() => import("./pages/Owner/ManageClients"));
const OwnerUserDetails = React.lazy(() => import("./pages/Owner/UserDetails"));
const OwnerMatters = React.lazy(() => import("./pages/Owner/Matters"));
const OwnerDocuments = React.lazy(() => import("./pages/Owner/Documents"));
const ClientHome = React.lazy(() => import("./pages/Client/Home"));
const ClientProjects = React.lazy(() => import("./pages/Client/ClientProjects"));
const ClientViewTaskDetails = React.lazy(() => import("./pages/Client/ViewTaskDetails"));

const App = () => {
  return (
    <UserProvider>
      <div>
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
                <Route path="/admin/matters/*" element={<AdminMatters />} />
                <Route path="/admin/documents/*" element={<AdminDocuments />} />
                <Route path="/admin/employees" element={<AdminManageEmployees />} />
                <Route path="/admin/clients" element={<AdminManageClients />} />
                <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
                <Route path="/admin/profile-settings" element={<ProfileSettings />} />
              </Route>

              {/* Owner Routes */}
              <Route element={<PrivateRoute allowedRoles={["owner"]} />}>
                <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                <Route path="/owner/tasks" element={<OwnerTasks />} />
                <Route path="/owner/matters/*" element={<OwnerMatters />} />
                <Route path="/owner/documents/*" element={<OwnerDocuments />} />
                <Route path="/owner/employees" element={<OwnerManageEmployees />} />
                <Route path="/owner/clients" element={<OwnerManageClients />} />
                <Route path="/owner/users/:userId" element={<OwnerUserDetails />} />
                <Route path="/owner/profile-settings" element={<ProfileSettings />} />
              </Route>

              {/* Member Routes */}
              <Route element={<PrivateRoute allowedRoles={["member", "user"]} />}>
                <Route path="/user/dashboard" element={<UserDashboard />} />
                <Route path="/user/tasks" element={<MyTasks />} />
                <Route path="/user/task-details/:id" element={<ViewTaskDetails />} />
                <Route path="/user/matters/*" element={<UserMatters />} />
                <Route path="/user/documents/*" element={<UserDocuments />} />
                <Route path="/user/profile-settings" element={<ProfileSettings />} />
              </Route>

              {/* Client Routes */}
              <Route element={<PrivateRoute allowedRoles={["client"]} />}>
                <Route path="/client">
                  <Route index element={<Navigate to="home" replace />} />
                  <Route path="home" element={<ClientHome />} />
                  <Route path="projects" element={<ClientProjects />} />
                  <Route path="task-details/:id" element={<ClientViewTaskDetails />} />
                  <Route path="profile-settings" element={<ProfileSettings />} />
                </Route>
              </Route>

              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Suspense>
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

const RootRedirect = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <LoadingOverlay fullScreen message="Preparing your workspace..." />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const destination = getDefaultRouteForRole(user.role) || "/login";
  
  return (
    <>
      <LoadingOverlay
        fullScreen
        message="Redirecting you to your workspace..."
      />
      <Navigate to={destination} replace />
    </>
  );
};