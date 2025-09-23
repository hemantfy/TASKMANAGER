import React from "react";
import { LuTrash2 } from "react-icons/lu";

const UserCard = ({ userInfo, onDelete, onResetPassword }) => {
  const stats = [
    { label: "Pending", count: userInfo?.pendingTasks || 0, status: "Pending" },
    { label: "Prog.", count: userInfo?.inProgressTasks || 0, status: "In Progress" },
    { label: "Completed", count: userInfo?.completedTasks || 0, status: "Completed" }
  ];

  return (
    <div className="user-card">
      <div className="relative overflow-hidden rounded-[26px] border border-white/50 bg-white/70 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <span className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(79,70,229,0.18),_transparent_60%)]" />
        <span className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.18),_transparent_60%)]" />

        <div className="relative flex items-center gap-4">
          <img
            src={userInfo?.profileImageUrl}
            alt="Avatar"
            className="h-14 w-14 rounded-2xl border-4 border-white object-cover shadow-[0_12px_24px_rgba(79,70,229,0.25)]"
          />

          <div>
            <p className="text-base font-semibold text-slate-900">{userInfo?.name}</p>
            <p className="text-xs text-slate-500">{userInfo?.email}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/40 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <div className="grid grid-cols-3 divide-x divide-white/50">
            {stats.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1 py-4 text-center">
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  {item.label}
                </span>
                <span className="text-2xl font-semibold text-slate-900">{item.count}</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-400">
                  {item.count === 1 ? "Task" : "Tasks"}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {(typeof onDelete === "function" || typeof onResetPassword === "function") && (
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            {typeof onResetPassword === "function" && (
              <button
                type="button"
                onClick={onResetPassword}
                className="flex items-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-100 hover:text-indigo-700"
              >
                Change Password
              </button>
            )}
            {typeof onDelete === "function" && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-600"
              >
                <LuTrash2 className="text-base" /> Delete User
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCard;