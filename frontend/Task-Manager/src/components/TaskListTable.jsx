import React from "react";
import { LuCalendar, LuClock3, LuUser } from "react-icons/lu";
import { formatDateLabel } from "../utils/dateUtils";

const TaskListTable = ({ tableData, onTaskClick, className = "" }) => {
  const safeTableData = Array.isArray(tableData)
    ? tableData
    : tableData?.tasks && Array.isArray(tableData.tasks)
    ? tableData.tasks
    : [];

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-gradient-to-r from-emerald-500 to-lime-400 text-white";
      case "Pending":
        return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
      case "In Progress":
        return "bg-gradient-to-r from-sky-500 to-cyan-500 text-white";
      default:
        return "bg-gradient-to-r from-slate-500 to-slate-400 text-white";
    }
  };

  const getPriorityBadgeColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-gradient-to-r from-rose-500 to-red-500 text-white";
      case "Medium":
        return "bg-gradient-to-r from-amber-400 to-orange-400 text-white";
      case "Low":
        return "bg-gradient-to-r from-emerald-400 to-teal-400 text-white";
      default:
        return "bg-gradient-to-r from-slate-500 to-slate-400 text-white";
    }
  };

  const getAssigneeNames = (assignedTo) => {
    if (!assignedTo) {
      return "Unassigned";
    }

    const assigneeList = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    const names = assigneeList
      .map((assignee) => {
        if (typeof assignee === "string") {
          return assignee;
        }

        if (assignee && typeof assignee === "object") {
          return assignee.name || assignee.fullName || assignee.email || "";
        }

        return "";
      })
      .filter(Boolean);

    return names.length ? names.join(", ") : "Unassigned";
  };

  const formatDate = (value) => formatDateLabel(value);

 const handleTaskActivation = (task) => {
    if (typeof onTaskClick === "function" && task) {
      onTaskClick(task);
    }
  };

  const interactiveRowProps = (task) => {
    if (typeof onTaskClick !== "function") {
      return {};
    }

    return {
      onClick: () => handleTaskActivation(task),
      onKeyDown: (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleTaskActivation(task);
        }
      },
      role: "button",
      tabIndex: 0,
    };
  };

  const getInteractiveRowClasses = (baseClasses) => {
    if (typeof onTaskClick !== "function") {
      return baseClasses;
    }

    return `${baseClasses} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60`;
  };

  const containerClassName = [
    "mt-4 overflow-hidden rounded-[28px] border border-white/60 bg-white/80 shadow-[0_20px_45px_rgba(15,23,42,0.08)]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-white/60">
          <thead className="bg-white/70">
            <tr className="text-left text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Priority</th>
              <th className="hidden px-6 py-4 md:table-cell">Due Date</th>
              <th className="hidden px-6 py-4 md:table-cell">Assigned To</th>
              <th className="hidden px-6 py-4 md:table-cell">Created On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/50 bg-white/60">
            {safeTableData.map((task, index) => (
              <tr
                key={task._id}
                className={getInteractiveRowClasses(
                  `text-sm text-slate-600 transition hover:bg-white ${
                    index % 2 === 0 ? "bg-white/80" : "bg-white/60"
                  }`
                )}
                {...interactiveRowProps(task)}
              >
                <td className="px-6 py-4 text-[13px] font-medium text-slate-900">
                  <span className="line-clamp-1">{task.title}</span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getStatusBadgeColor(
                      task.status
                    )}`}
                  >
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getPriorityBadgeColor(
                      task.priority
                    )}`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="hidden px-6 py-4 text-[13px] font-medium text-slate-700 md:table-cell">
                  {formatDate(task.dueDate)}
                </td>
                <td className="hidden px-6 py-4 text-[13px] font-medium text-slate-700 md:table-cell">
                  {getAssigneeNames(task.assignedTo)}
                </td>
                <td className="hidden px-6 py-4 text-[13px] font-medium text-slate-700 md:table-cell">
                  {formatDate(task.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {safeTableData.length ? (
          safeTableData.map((task) => (
            <article
              key={task._id}
              className={getInteractiveRowClasses(
                "rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
              )}
              {...interactiveRowProps(task)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {task.title}
                </h3>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${getStatusBadgeColor(
                    task.status
                  )}`}
                >
                  {task.status}
                </span>
              </div>

              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {task.priority}
              </div>

              <dl className="mt-4 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <LuCalendar className="text-slate-400" />
                  <dt className="font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Due
                  </dt>
                  <dd className="text-slate-600">{formatDate(task.dueDate)}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <LuUser className="text-slate-400" />
                  <dt className="font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Assignees
                  </dt>
                  <dd className="text-slate-600">
                    {getAssigneeNames(task.assignedTo)}
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <LuClock3 className="text-slate-400" />
                  <dt className="font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Created
                  </dt>
                  <dd className="text-slate-600">{formatDate(task.createdAt)}</dd>
                </div>
              </dl>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white/90 py-6 text-center text-sm text-slate-500">
            No tasks available yet.
          </p>
        )}
      </div>      
    </div>
  );
};

export default TaskListTable;
