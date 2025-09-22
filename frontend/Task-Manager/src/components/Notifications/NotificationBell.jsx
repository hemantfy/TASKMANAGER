import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import moment from "moment";
import { LuBell, LuLoader } from "react-icons/lu";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { UserContext } from "../../context/userContext";

const STATUS_STYLES = {
  info: "bg-blue-50 text-blue-600",
  warning: "bg-amber-50 text-amber-600",
  success: "bg-emerald-50 text-emerald-600",
  danger: "bg-rose-50 text-rose-600",
};

const NotificationBell = () => {
  const { user } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_NOTIFICATIONS
      );
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return undefined;

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const toggleDropdown = () => {
    if (!open) {
      fetchNotifications();
    }
    setOpen((prev) => !prev);
  };

  const hasNotifications = notifications.length > 0;
  const badgeCount = notifications.length > 9 ? "9+" : notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 shadow-[0_10px_25px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-primary"
      >
        <LuBell className="text-xl" />
        {hasNotifications && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            <button
              type="button"
              onClick={fetchNotifications}
              className="text-xs font-medium text-primary transition hover:text-primary/80"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
                <LuLoader className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : hasNotifications ? (
              notifications.map((notification) => {
                const statusClass =
                  STATUS_STYLES[notification.status] || STATUS_STYLES.info;
                let indicator = "★";
                if (notification.type === "task_due_soon") {
                  indicator = "!";
                } else if (notification.type === "task_completed") {
                  indicator = "✓";
                }

                return (
                  <div
                    key={notification.id}
                    className="flex gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0"
                  >
                    <div
                      className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${statusClass}`}
                    >
                      {indicator}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm font-medium text-slate-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {notification.message}
                      </p>
                      <span className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                        {notification.date
                          ? moment(notification.date).fromNow()
                          : "Just now"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm text-slate-500">
                You're all caught up!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;