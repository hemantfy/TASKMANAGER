import React from "react";
import { getRoleLabel } from "../utils/roleUtils";

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};

const Avatar = ({ name, profileImageUrl }) => {
  if (profileImageUrl) {
    return (
      <img
        src={profileImageUrl}
        alt={name || "Team member"}
        className="h-10 w-10 flex-shrink-0 rounded-full object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-sky-500 to-teal-400 text-xs font-semibold uppercase text-white shadow-sm">
      {getInitials(name)}
    </div>
  );
};

const formatRatio = (numerator, denominator) => {
  if (!denominator) {
    return "0 / 0";
  }

  return `${numerator} / ${denominator}`;
};

const formatPercentage = (value) => {
  if (!Number.isFinite(value)) {
    return "0%";
  }

  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
};

const LeaderboardTable = ({ entries }) => {
  const data = Array.isArray(entries) ? entries : [];

  if (!data.length) {
    return (
      <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/90 py-6 text-center text-sm text-slate-500">
        Leaderboard data will appear once tasks are assigned and completed.
      </p>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-white/60">
          <thead className="bg-white/70">
            <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-6 py-4">Rank</th>
              <th className="px-6 py-4">Team Member</th>
              <th className="px-6 py-4">Score</th>
              <th className="px-6 py-4">Completed</th>
              <th className="px-6 py-4">On-Time</th>
              <th className="px-6 py-4">Late</th>
              <th className="px-6 py-4">Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/50 bg-white/60">
            {data.map((entry, index) => (
              <tr
                key={entry.userId || index}
                className={`text-sm text-slate-600 transition hover:bg-white ${
                  index % 2 === 0 ? "bg-white/80" : "bg-white/60"
                }`}
              >
                <td className="px-6 py-4 text-[13px] font-semibold text-slate-900">
                  #{entry.rank}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={entry.name}
                      profileImageUrl={entry.profileImageUrl}
                    />
                    <div>
                      <p className="text-[13px] font-semibold text-slate-900">
                        {entry.name}
                      </p>
                      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">
                        {getRoleLabel(entry.role)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-[13px] font-semibold text-slate-900">
                  {Number(entry.score || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                  {formatRatio(entry.completedTasks, entry.totalAssigned)}
                  <span className="ml-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-500">
                    {formatPercentage(entry.completionRate)}
                  </span>
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                  {entry.onTimeCompletions}
                  <span className="ml-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">
                    {formatPercentage(entry.onTimeRate)}
                  </span>
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                  {entry.lateCompletions}
                </td>
                <td className="px-6 py-4 text-[13px] font-medium text-slate-700">
                  {entry.overdueTasks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {data.map((entry, index) => (
          <article
            key={entry.userId || index}
            className="rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-500">
                Rank #{entry.rank}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {Number(entry.score || 0).toLocaleString()} pts
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Avatar name={entry.name} profileImageUrl={entry.profileImageUrl} />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{entry.name}</h3>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                  {getRoleLabel(entry.role)}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-slate-600">
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Completed
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {formatRatio(entry.completedTasks, entry.totalAssigned)}
                </dd>
                <dd className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-500">
                  {formatPercentage(entry.completionRate)}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="font-semibold uppercase tracking-[0.22em] text-slate-400">
                  On-Time
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {entry.onTimeCompletions}
                </dd>
                <dd className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-500">
                  {formatPercentage(entry.onTimeRate)}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Late
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {entry.lateCompletions}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <dt className="font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Overdue
                </dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {entry.overdueTasks}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardTable;