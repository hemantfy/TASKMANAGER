import React, { useContext, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LuLogOut } from "react-icons/lu";
import { UserContext } from "../../context/userContext";
import { SIDE_MENU_DATA, SIDE_MENU_USER_DATA } from "../../utils/data";
import { hasPrivilegedAccess, normalizeRole } from "../../utils/roleUtils";

const normalizePath = (path) => {
  if (typeof path !== "string") return "";
  return path.trim().replace(/\/+$/, "") || "/";
};

const MobileNavigation = () => {
  const { user, clearUser } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  const normalizedRole = normalizeRole(user?.role);

  const menuItems = useMemo(() => {
    if (!user) return [];

    const source = hasPrivilegedAccess(normalizedRole)
      ? SIDE_MENU_DATA
      : SIDE_MENU_USER_DATA;

    // Only include items with a valid path and exclude the "logout" pseudo-item
    return (source || []).filter((item) => item?.path && item.path !== "logout");
  }, [normalizedRole, user]);

  if (!user || menuItems.length === 0) {
    return null;
  }

  const currentPath = normalizePath(location.pathname);
  const shouldEnableScroll = menuItems.length > 4;

  const handleNavigation = useCallback(
    (path) => {
      if (path === "logout") {
        const confirmed = window.confirm("Are you sure you want to logout?");

        if (confirmed) {
          try {
            localStorage.clear();
          } catch {
            // ignore storage errors
          }
          clearUser?.();
          navigate("/login");
        }
        return;
      }

      const normalizedDestination = normalizePath(path);
      if (normalizedDestination) {
        navigate(normalizedDestination);
      }
    },
    [clearUser, navigate]
  );

  const isItemActive = useCallback(
    (path) => {
      const normalizedDestination = normalizePath(path);

      if (!normalizedDestination || normalizedDestination === "logout") {
        return false;
      }

      if (normalizedDestination === "/") {
        return currentPath === normalizedDestination;
      }

      return (
        currentPath === normalizedDestination ||
        currentPath.startsWith(`${normalizedDestination}/`)
      );
    },
    [currentPath]
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 lg:hidden">
      <nav
        aria-label="Primary navigation"
        className="pointer-events-auto w-full max-w-[460px] rounded-[26px] border border-white/60 bg-white/95 px-3 py-2 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur"
      >
        <ul
          className={`mobile-nav-scroll flex items-stretch gap-2 ${
            shouldEnableScroll ? "overflow-x-auto pb-1" : "justify-center"
          }`}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(item.path);

            return (
              <li key={item.path} className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleNavigation(item.path)}
                  className={`flex h-full min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium uppercase tracking-[0.24em] transition ${
                    active
                      ? "bg-gradient-to-r from-primary/90 via-indigo-500 to-sky-500 text-white shadow-[0_12px_24px_rgba(59,130,246,0.35)]"
                      : "text-slate-500 hover:text-primary"
                  }`}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition ${
                      active
                        ? "border-white/50 bg-white/20 text-white"
                        : "border-slate-200 bg-white/80 text-primary/70"
                    }`}
                  >
                    {Icon ? <Icon /> : item.label?.slice(0, 1) || "•"}
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.28em]">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}

          {/* Logout */}
          <li className="flex-shrink-0">
            <button
              type="button"
              onClick={() => handleNavigation("logout")}
              className="flex h-full min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-rose-500 transition hover:text-rose-600"
              aria-label="Logout"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-white/90 text-lg text-rose-500">
                <LuLogOut />
              </span>
              <span className="text-[10px] tracking-[0.28em]">Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default MobileNavigation;
