import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import AvatarGroup from "../../components/AvatarGroup";
import moment from "moment";
import { LuSquareArrowOutUpRight } from "react-icons/lu";
import LoadingOverlay from "../../components/LoadingOverlay";

const ViewTaskDetails = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const getStatusTagColor = (status) => {
    switch (status) {
      case "In Progress":
        return "bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 text-white";
      case "Completed":
        return "bg-gradient-to-r from-emerald-500 via-lime-400 to-green-500 text-white";
      default:
        return "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white";
    }
  };

  // get Task info by ID
  const getTaskDetailsByID = async () => {
    try {
      setIsLoading(true);
      setTask(null);

      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_TASK_BY_ID(id)
      );
    
      if (response.data) {
        const taskInfo = response.data;
        setTask(taskInfo);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }  
  };

  // handle todo check
  const updateTodoCheckList = async (index) => {
    const todoChecklist = Array.isArray(task?.todoChecklist)
      ? [...task.todoChecklist]
      : null;
    const taskId = id;
  
    if (todoChecklist && todoChecklist[index]) {
      todoChecklist[index].completed = !todoChecklist[index].completed;
  
      try {
        const response = await axiosInstance.put(
          API_PATHS.TASKS.UPDATE_TODO_CHECKLIST(taskId),
          {
            todoChecklist: todoChecklist.map((item) => ({
              _id: item?._id,
              text: item?.text,
              completed: !!item?.completed
            }))
          }
        );
        if (response.status === 200) {
          setTask(response.data?.task || task);
        } else {
          // Optionally revert the toggle if the API call fails.
          todoChecklist[index].completed = !todoChecklist[index].completed;
        }
      } catch (error) {
        todoChecklist[index].completed = !todoChecklist[index].completed;
      }
    }
  };
  

  // Handle attachment link lick
  const handleLinkClick = (link) => {
    if (!/^https?:\/\//i.test(link)) {
      link = "https://" + link; // Default to HTTPS
    }
    window.open(link, "_blank");
  };

  useEffect(() => {
    if (id) {
      getTaskDetailsByID();
    }
    return () => {};
  }, [id]);

  const assignedMembers = Array.isArray(task?.assignedTo)
    ? task.assignedTo
    : task?.assignedTo
    ? [task.assignedTo]
    : [];

  const todoChecklistItems = Array.isArray(task?.todoChecklist)
    ? task.todoChecklist
    : [];

  return (
    <DashboardLayout activeMenu="My Tasks">
           {isLoading ? (
        <LoadingOverlay message="Loading task details..." className="py-24" />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-slate-900 via-indigo-700 to-sky-600 px-6 py-8 text-white shadow-[0_20px_45px_rgba(30,64,175,0.35)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.18),_transparent_65%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.2),_transparent_60%)]" />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.42em] text-white/60">Task Detail</p>
                <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{task?.title || "Task"}</h2>
              </div>

              {task?.status && (
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] ${getStatusTagColor(task.status)}`}>
                  {task.status}
                </div>
              )}
            </div>
            </section>

{task ? (
  <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
    <div className="form-card">
      <div className="grid grid-cols-1 gap-6">
        <InfoBox label="Description" value={task?.description} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoBox label="Priority" value={task?.priority} />
          <InfoBox
            label="Due Date"
            value={task?.dueDate ? moment(task?.dueDate).format("Do MMM YYYY") : "N/A"}
                    />
                                        <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Assigned To</p>
                      <div className="mt-2 rounded-2xl border border-white/60 bg-white/80 p-3">
                        <AvatarGroup
                          avatars={assignedMembers?.map?.((item) => item?.profileImageUrl)}
                          maxVisible={5}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Todo Checklist</p>
                    <div className="mt-3 space-y-3">
                      {todoChecklistItems?.map?.((item, index) => (
                        <TodoCheckList
                          key={`todo_${index}`}
                          text={item.text}
                          isChecked={item?.completed}
                          onChange={() => updateTodoCheckList(index)}
                        />
                      ))}
                    </div>
                  </div>

                  {task?.attachments?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Attachments</p>
                      <div className="mt-3 space-y-3">
                        {task?.attachments?.map?.((link, index) => (
                          <Attachment
                            key={`link_${index}`}
                            link={link}
                            index={index}
                            onClick={() => handleLinkClick(link)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <aside className="form-card space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Project Pulse</h3>
                <p className="text-sm text-slate-500">
                  Track status, due dates and collaboration at a glance.
                </p>
                <Link
                  to="/user/tasks"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:-translate-y-0.5 hover:bg-gradient-to-r hover:from-slate-900 hover:to-indigo-600 hover:text-white"
                >
                  Back to Tasks
                </Link>
              </aside>
            </section>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Unable to load this task. Please return to your task list.
            </div>
 
)}
        </>
      )}
    </DashboardLayout>
  );
};

export default ViewTaskDetails;

const InfoBox = ({ label, value }) => {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
};

const TodoCheckList = ({ text, isChecked, onChange }) => {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={onChange}
        className="h-5 w-5 cursor-pointer rounded-full border border-slate-300 text-primary focus:ring-0"
      />
      <p className="text-sm text-slate-700">{text}</p>
    </div>
  );
};

const Attachment = ({ link, index, onClick }) => {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-left text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary"
      onClick={onClick}
    >
      <div className="flex flex-1 items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          {index < 9 ? `0${index + 1}` : index + 1}
        </span>

        <p className="line-clamp-1 text-sm">{link}</p>
      </div>

      <LuSquareArrowOutUpRight className="text-base" />
    </button>
  );
};