import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SIDE_MENU_DATA, SIDE_MENU_USER_DATA } from "../../utils/data";
import { UserContext } from "../../context/userContext";

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const [sideMenuData, setSideMenuData] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const normalizedLocationPath =
    typeof location.pathname === "string"
      ? location.pathname.replace(/\/+$/, "") || "/"
      : "/";
  const normalizedActiveMenu =
    typeof activeMenu === "string" ? activeMenu.trim().toLowerCase() : "";

  const handleClick = (route) => {
    if (typeof route !== "string") {
      return;
    }

    const trimmedRoute = route.trim();

    if (!trimmedRoute) {
      return;
    }

    if (trimmedRoute === "logout") {
      handelLogout();
      return;
    }

    navigate(trimmedRoute);
  };

  const handelLogout = () => {
    localStorage.clear();
    clearUser();
    navigate("/login");
  };

  useEffect(() => {
    if (user) {
      setSideMenuData(
        user?.role === "admin" ? SIDE_MENU_DATA : SIDE_MENU_USER_DATA
      );
    }

    return () => {};
  }, [user]);

  return (
    <div className="w-64 h-[calc(100vh-61px)] bg-white border-r border-gray-200/50 sticky top-[61px] z-20">
      <div className="flex flex-col items-center justify-center mb-7 pt-5">
        <div className="relative">
          <img src={user?.profileImageUrl || ""} alt="Profile Image" className="w-20 h-20 bg-slate-400 rounded-full" />
        </div>

        {user?.role === "admin" && <div className="text-[10px] font-medium text-white bg-primary px-3 py-0.5 rounded mt-1">Admin</div>}

        <h5 className="text-gray-950 font-medium leading-6 mt-3">{user?.name || ""}</h5>
        <p className="text-[12px] text-gray-500">{user?.email || ""}</p>
      </div>

      {(Array.isArray(sideMenuData)
        ? sideMenuData.filter((menu) => menu && typeof menu.label === "string")
        : []
      ).map((item, index) => {
        const Icon = item.icon;

        const normalizedLabel =
          typeof item.label === "string" ? item.label.trim().toLowerCase() : "";
        const normalizedPath =
          typeof item.path === "string"
            ? item.path.trim().replace(/\/+$/, "") || "/"
            : "";

        const isActiveLabel =
          normalizedActiveMenu && normalizedLabel && normalizedActiveMenu === normalizedLabel;
        const isActivePath =
          normalizedPath && normalizedPath !== "logout" && normalizedLocationPath === normalizedPath;

        const isActive = isActiveLabel || isActivePath;

        return (
          <button
            key={`menu_${index}`}
            className={`w-full flex items-center gap-4 text-[15px] ${
              isActive
                ? "text-primary bg-linear-to-r from-blue-50/40 to-blue-100/50 border-r-3"
                : ""
            } py-3 px-6 mb-3 cursor-pointer`}
            onClick={() => handleClick(item?.path)}
          >
            {Icon && <Icon className="text-xl" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default SideMenu;
