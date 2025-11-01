import {
  LuClipboardCheck,
  LuFileStack,
  LuFolderTree,
  LuLayoutDashboard,
  LuUsers,
} from "react-icons/lu";

export const SIDE_MENU_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/admin/dashboard",
  },
  {
    id: "02",
    label: "Tasks",
    icon: LuClipboardCheck,
    path: "/admin/tasks",
  },
  {
    id: "03",
    label: "Matters",
    icon: LuFolderTree,
    path: "/admin/matters",
  },
  {
    id: "04",    
    label: "Directory",
    icon: LuUsers,
    path: "/admin/users",
  },
  {
    id: "05",
    label: "Documents",
    icon: LuFileStack,
    path: "/admin/documents",
  },  
];

export const SIDE_MENU_USER_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/user/dashboard",
  },
  {
    id: "02",
    label: "My Tasks",
    icon: LuClipboardCheck,
    path: "/user/tasks",
  },
];

export const SIDE_MENU_CLIENT_DATA = [
  {
    id: "01",
    label: "Dashboard",
    icon: LuLayoutDashboard,
    path: "/client/dashboard",
  },
  {
    id: "02",
    label: "Projects",
    icon: LuClipboardCheck,
    path: "/client/projects",
  },
];

export const PRIORITY_DATA = [
  { label: "Low", value: "Low" },
  { label: "Medium", value: "Medium" },
  { label: "High", value: "High" },
];

export const STATUS_DATA = [
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
];

export const DEFAULT_OFFICE_LOCATIONS = ["Ahmedabad", "Gift City"];