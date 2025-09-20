import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuFileSpreadsheet, LuSparkles } from "react-icons/lu";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";
import toast from "react-hot-toast";

const ManageTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");

  const navigate = useNavigate();

  const getAllTasks = async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: filterStatus === "All" ? "" : filterStatus
        }
      });

      setAllTasks(response.data?.tasks?.length > 0 ? response.data.tasks : []);

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
    }
  };

  const handleClick = (taskData) => {
    navigate(`/admin/create-task`, { state: { taskId: taskData._id } });
  };

  // download taks report
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
    getAllTasks(filterStatus);
    return () => {};
  }, [filterStatus]);

  return (
    <DashboardLayout activeMenu="Manage Tasks">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-primary via-indigo-500 to-sky-500 px-6 py-8 text-white shadow-[0_20px_45px_rgba(59,130,246,0.25)]">
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

        {tabs?.[0]?.count > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)] lg:flex-row">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/80 via-indigo-500 to-sky-500 text-white shadow-[0_12px_28px_rgba(59,130,246,0.35)]">
                <LuSparkles className="text-base" />
              </span>
              Filter tasks by status to focus on what matters most.
            </div>

            <TaskStatusTabs tabs={tabs} activeTab={filterStatus} setActiveTab={setFilterStatus} />
        </div>
     )}

     <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
       {allTasks?.map((item) => (
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
             handleClick(item);
           }}
         />
       ))}
     </section>
   </DashboardLayout>
  );
};

export default ManageTasks;
