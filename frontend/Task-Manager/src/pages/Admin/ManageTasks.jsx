import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuFileSpreadsheet, LuRotateCcw, LuSearch } from "react-icons/lu";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";
import toast from "react-hot-toast";
import LoadingOverlay from "../../components/LoadingOverlay";

const ManageTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const initialFilterStatus = location.state?.filterStatus || "All";

  const [filterStatus, setFilterStatus] = useState(initialFilterStatus);
  const [selectedDate, setSelectedDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const hasActiveFilters =
    filterStatus !== "All" || searchQuery.trim() || selectedDate.trim();

const handleResetFilters = () => {
  setFilterStatus("All");
  setSearchQuery("");
  setSelectedDate("");
};

  const getAllTasks = async () => {
    try {
      setIsLoading(true);
      setAllTasks([]);
      setTabs([]);

      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: filterStatus === "All" ? "" : filterStatus
        }
      });

      const tasks = Array.isArray(response.data?.tasks)
        ? response.data.tasks
        : [];

      const priorityRank = {
        High: 0,
        Medium: 1,
        Low: 2
      };

      const sortedTasks = [...tasks].sort((taskA, taskB) => {
        const taskAPriority =
          priorityRank[taskA.priority] ?? Number.MAX_SAFE_INTEGER;
        const taskBPriority =
          priorityRank[taskB.priority] ?? Number.MAX_SAFE_INTEGER;

        if (taskAPriority !== taskBPriority) {
          return taskAPriority - taskBPriority;
        }

        const taskADueDate = taskA.dueDate
          ? new Date(taskA.dueDate).getTime()
          : Number.MAX_SAFE_INTEGER;
        const taskBDueDate = taskB.dueDate
          ? new Date(taskB.dueDate).getTime()
          : Number.MAX_SAFE_INTEGER;

        return taskADueDate - taskBDueDate;
      });

      setAllTasks(sortedTasks);

      const statusSummary = response.data?.statusSummary || {};

      const statusArray = [
        { label: "All", count: statusSummary.all || 0 },
        { label: "Pending", count: statusSummary.pendingTasks || 0 },
        { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
        { label: "Completed", count: statusSummary.completedTasks || 0 }
      ];

      setTabs(statusArray);
    } catch (error) {
      console.error("Error Fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = (taskData) => {
    navigate(`/admin/create-task`, { state: { taskId: taskData._id } });
  };

  // download tasks report
  const handleDownloadReport = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.REPORTS.EXPORT_TASKS, {
        responseType: "blob",
      });
    
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "task_details.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading expense details:", error);
      toast.error("Failed to download Task Reports. Please try again later.");
    }
  };

  useEffect(() => {
    getAllTasks();
    return () => {};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  useEffect(() => {
    if (
      location.state?.filterStatus &&
      location.state.filterStatus !== filterStatus
    ) {
      setFilterStatus(location.state.filterStatus);
    }
  }, [location.state?.filterStatus]);

  const filteredTasks = allTasks.filter((task) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const normalizedSelectedDate = selectedDate.trim();

    const matchesSearch =
      !normalizedQuery || task.title?.toLowerCase().includes(normalizedQuery);

    const matchesDate =
      !normalizedSelectedDate ||
      (task.dueDate &&
        new Date(task.dueDate).toISOString().split("T")[0] ===
          normalizedSelectedDate);

    return matchesSearch && matchesDate;
  });

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-primary via-indigo-500 to-sky-500 px-4 py-7 text-white shadow-[0_20px_45px_rgba(59,130,246,0.25)] sm:px-6 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.2),_transparent_60%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/70">Tasks Command</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">My Tasks</h2>
            <p className="mt-3 text-sm text-white/70">
              Curate, assign and elevate every deliverable with confidence.
            </p>
          </div>

          <button className="download-btn" onClick={handleDownloadReport}>
            <LuFileSpreadsheet className="text-lg" /> Export Snapshot
          </button>
        </div>
        </section>

        {isLoading ? (
          <LoadingOverlay message="Loading tasks..." className="py-24" />
        ) : (
          <>
            {(tabs.length > 0 || allTasks.length > 0) && (
              <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
                <TaskStatusTabs
                  tabs={tabs}
                  activeTab={filterStatus}
                  setActiveTab={setFilterStatus}
                />

<div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_15px_30px_rgba(15,23,42,0.06)]">
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="group flex flex-col text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Search Task
                      <div className="relative mt-2">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(event) => setSearchQuery(event.target.value)}
                          placeholder="Search by task name..."
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 outline-none transition group-focus-within:border-primary group-focus-within:ring-2 group-focus-within:ring-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                          <LuSearch className="text-base" />
                        </span>
                      </div>
                    </label>
                    <label className="flex flex-col text-xs uppercase tracking-[0.24em] text-slate-400">
                      Due Date
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => setSelectedDate(event.target.value)}
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm capitalize text-slate-600 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </label>
                  </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 self-end rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-gradient-to-r hover:from-primary/90 hover:to-sky-500 hover:text-white"
                      onClick={handleResetFilters}
                    >
                      <LuRotateCcw className="text-base" /> Reset Filters
                    </button>
                  )}
              </div>
        )}

<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTasks?.map((item) => (
                <TaskCard
                  key={item._id}
                  title={item.title}
                  description={item.description}
                  priority={item.priority}
                  status={item.status}
                  progress={item.progress}
                  createdAt={item.createdAt}
                  dueDate={item.dueDate}
                  assignedTo={Array.isArray(item.assignedTo)
                    ? item.assignedTo
                    : item.assignedTo
                    ? [item.assignedTo]
                    : []}
                  attachmentCount={item.attachments?.length || 0}
                  completedTodoCount={item.completedTodoCount || 0}
                  todoChecklist={item.todoChecklist || []}
                  onClick={() => {
                    handleClick(item._id);
                  }}
                />
              ))}

              {!filteredTasks.length && (
                <div className="md:col-span-2 xl:col-span-3">
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    No tasks match the selected filters.
                  </div>
                </div>
              )}
            </section>
          </>
        )}
   </DashboardLayout>
  );
};

export default ManageTasks;
