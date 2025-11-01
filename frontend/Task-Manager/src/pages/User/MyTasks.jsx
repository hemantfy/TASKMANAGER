import React, { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { LuSparkles } from "react-icons/lu";
import TaskStatusTabs from "../../components/TaskStatusTabs";
import TaskCard from "../../components/Cards/TaskCard";
import LoadingOverlay from "../../components/LoadingOverlay";

const MyTasks = () => {
  const [allTasks, setAllTasks] = useState([]);
  const [tabs, setTabs] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const getAllTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setAllTasks([]);
      setTabs([]);

      const response = await axiosInstance.get(API_PATHS.TASKS.GET_ALL_TASKS, {
        params: {
          status: filterStatus === "All" ? "" : filterStatus,
        },
      });

      const fetchedTasks =
        response.data?.tasks?.length > 0 ? response.data.tasks : [];

      const statusRank = { Completed: 1 };

      const sortedTasks = [...fetchedTasks].sort((taskA, taskB) => {
        const taskAStatusRank = statusRank[taskA.status] ?? 0;
        const taskBStatusRank = statusRank[taskB.status] ?? 0;

        if (taskAStatusRank !== taskBStatusRank) {
          return taskAStatusRank - taskBStatusRank;
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

    //Map status Summary data with fixed labels and orders
    const statusSummary = response.data?.statusSummary || {};

    const statusArray = [
      { label: "All", count: statusSummary.all || 0 },
      { label: "Pending", count: statusSummary.pendingTasks || 0 },
      { label: "In Progress", count: statusSummary.inProgressTasks || 0 },
      { label: "Completed", count: statusSummary.completedTasks || 0 }
    ];

    setTabs(statusArray);
  } catch (error) {
      console.error("Error Fetching user tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus]);

  const handleClick = (taskId) => {
    navigate(`/user/task-details/${taskId}`);
  };

  useEffect(() => {
    getAllTasks();
  }, [getAllTasks]);

  return (
    <DashboardLayout activeMenu="My Tasks">
      <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-indigo-700 to-sky-600 px-4 py-7 text-white shadow-[0_20px_45px_rgba(30,64,175,0.35)] sm:px-6 sm:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.2),_transparent_60%)]" />
        <div className="relative flex flex-col gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/60">Personal Board</p>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">My Tasks</h2>
          <p className="text-sm text-white/70">
            Stay on top of every deliverable with smart filters and rich task cards.
          </p>
        </div>
      </section>

      {isLoading ? (
        <LoadingOverlay message="Loading your tasks..." className="py-24" />
      ) : (
        <>
          {tabs?.[0]?.count > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.08)] lg:flex-row">
              <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-500 text-white shadow-[0_12px_28px_rgba(79,70,229,0.35)]">
                  <LuSparkles className="text-base" />
                </span>
                Filter tasks by status to keep momentum.
              </div>

              <TaskStatusTabs
                tabs={tabs}
                activeTab={filterStatus}
                setActiveTab={setFilterStatus}
              />
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
                assignedTo={
                  Array.isArray(item.assignedTo)
                    ? item.assignedTo
                    : item.assignedTo
                    ? [item.assignedTo]
                    : []
                }
                attachmentCount={(item.attachments?.length || 0) + (item.relatedDocuments?.length || 0)}
                completedTodoCount={item.completedTodoCount || 0}
                todoChecklist={item.todoChecklist || []}
                matter={item.matter}
                caseFile={item.caseFile}                
                onClick={() => {
                  handleClick(item._id);
                }}
              />
            ))}

            {!allTasks.length && (
              <div className="md:col-span-2 xl:col-span-3">
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  No tasks found for the selected status.
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </DashboardLayout>
  );
};

export default MyTasks;