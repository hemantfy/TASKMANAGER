import React from "react";

const UserCard = ({ userInfo }) => {
  const stats = [
    { label: "Pending", count: userInfo?.pendingTasks || 0, status: "Pending" },
    { label: "In Progress", count: userInfo?.inProgressTasks || 0, status: "In Progress" },
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

        <div className="mt-6 grid grid-cols-3 gap-2">
          {stats.map((item) => (
            <StatCard key={item.label} label={item.label} count={item.count} status={item.status} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserCard;

const StatCard = ({ label, count, status }) => {
  const getAccent = () => {
    switch (status) {
      case "In Progress":
        return "from-cyan-400 via-sky-500 to-blue-500";
      case "Completed":
        return "from-emerald-400 via-lime-400 to-green-500";
      default:
        return "from-purple-500 via-pink-500 to-rose-500";
    }
  };

  const accent = getAccent();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 p-3 text-center shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <span className={`absolute inset-0 -z-10 bg-gradient-to-br ${accent} opacity-[0.12]`} />
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{count}</p>
    </div>
  );
};

