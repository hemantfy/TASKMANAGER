import React, { useContext, useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { PRIORITY_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";
import { LuCalendarDays, LuTrash2 } from "react-icons/lu";
import SelectDropdown from '../../components/inputs/SelectDropdown';
import SelectUsers from '../../components/inputs/SelectUsers';
import TodoListInput from '../../components/inputs/TodoListInput';
import AddAttachmentsInput from '../../components/inputs/AddAttachmentsInput';
import DeleteAlert from '../../components/DeleteAlert';
import Modal from '../../components/Modal';
import { UserContext } from '../../context/userContext';
import { getPrivilegedBasePath } from "../../utils/roleUtils";
import { formatDateInputValue } from "../../utils/dateUtils";

const CreateTask = () => {

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const privilegedBasePath = useMemo(
    () => getPrivilegedBasePath(user?.role),
    [user?.role]
  );  
  const { taskId } = location.state || {};
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "Low",
    dueDate: null,
    assignedTo: [],
    todoChecklist: [],
    attachments: [],
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);

  const [openDeleteAlert, setOpenDeleteAlert] = useState(false);

  const handleValueChange = (key, value) => {
    setTaskData((prevData) => ({ ...prevData, [key]: value }));
  };

  const clearData = () => {
    // Reset form
    setTaskData({
      title: "",
      description: "",
      priority: "Low",
      dueDate: null,
      assignedTo: [],
      todoChecklist: [],
      attachments: [],
    });
  };

  // Create Task
  const createTask = async () => {
    setLoading(true);

    try {
      const dueDateValue = taskData.dueDate ? new Date(taskData.dueDate) : null;
      if (!dueDateValue || Number.isNaN(dueDateValue.getTime())) {
        throw new Error("Invalid due date value");
      }

      const todolist = taskData.todoChecklist?.map((item) => ({
        text: item,
        completed: false,
      }));
    
      await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, {
        ...taskData,
        dueDate: dueDateValue.toISOString(),
        todoChecklist: todolist,
      });
    
      toast.success("Task Created Successfully");
    
      clearData();
    } catch (error) {
      console.error("Error creating task:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  // Update Task
  const updateTask = async () => {
    try {
      const todolist = taskData.todoChecklist?.map((item) => {
        const prevTodoChecklist = currentTask?.todoChecklist || [];
        const matchedTask = prevTodoChecklist.find((task) => task.text == item);
    
        return {
          text: item,
          completed: matchedTask ? matchedTask.completed : false,
        };
      });
      
      const dueDateValue = taskData.dueDate ? new Date(taskData.dueDate) : null;
      if (!dueDateValue || Number.isNaN(dueDateValue.getTime())) {
        throw new Error("Invalid due date value");
      }
    
      const response = await axiosInstance.put(
        API_PATHS.TASKS.UPDATE_TASK(taskId),
        {
          ...taskData,
          dueDate: dueDateValue.toISOString(),
          todoChecklist: todolist,
        }
      );
    
      toast.success("Task Updated Successfully");
    } catch (error) {
      console.error("Error creating task:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }  
  };

  // Handle Submit
  const handleSubmit = async () => {
    setError("");

    // Input Validation
    if (!taskData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (!taskData.description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!taskData.dueDate) {
      setError("Due Date is required.");
      return;
    }

    if (!taskData.assignedTo?.length) {
      setError("Task not assigned to any member.");
      return;
    };

    if (!taskData.todoChecklist?.length) {
      setError("Add atleast one todo task.");
      return;
    };

    if (taskId) {
      updateTask();
      return;
    }

    createTask();
  };

  // get Task info by ID
  const getTaskDetailsByID = async () => {
    try {
      const response = await axiosInstance.get(
        API_PATHS.TASKS.GET_TASK_BY_ID(taskId)
      );
    
      if (response.data) {
        const taskInfo = response.data;
        setCurrentTask(taskInfo);

        const assignedTo = Array.isArray(taskInfo?.assignedTo)
          ? taskInfo.assignedTo
          : taskInfo?.assignedTo
          ? [taskInfo.assignedTo]
          : [];

        const todoChecklist = Array.isArray(taskInfo?.todoChecklist)
          ? taskInfo.todoChecklist
          : [];
    
        setTaskData((prevState) => ({
          title: taskInfo.title,
          description: taskInfo.description,
          priority: taskInfo.priority,
          dueDate: taskInfo.dueDate
            ? formatDateInputValue(taskInfo.dueDate)
            : null,
            assignedTo: assignedTo.map((item) => item?._id).filter(Boolean),
            todoChecklist: todoChecklist.map((item) => item?.text || item).filter(Boolean),
          attachments: taskInfo?.attachments || [],
        }));
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  };

  // Delete Task
  const deleteTask = async () => {
    try {
      await axiosInstance.delete(API_PATHS.TASKS.DELETE_TASK(taskId));
    
      setOpenDeleteAlert(false);
      toast.success("Task deleted successfully");
      navigate(`${privilegedBasePath}/tasks`)
    } catch (error) {
      console.error(
        "Error deleting Task:",
        error.response?.data?.message || error.message
      );
    }    
  };

  useEffect(() => {
    if(taskId){
      getTaskDetailsByID(taskId)
    }
  
    return () => {}
  }, [taskId])
  

  return (
    <DashboardLayout activeMenu="Create TasK">
      <div className="mt-6 max-w-5xl mx-auto">
      <div className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_26px_60px_rgba(15,23,42,0.08)] transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-[0_32px_70px_rgba(2,6,23,0.6)]">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-5 md:flex-row md:items-center md:justify-between sm:px-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 transition-colors duration-300 dark:text-slate-100">
                {taskId ? "Update Task" : "Create Task"}
              </h2>
              <p className="text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400">
                Keep everything organised by sharing the right details with your team.
              </p>
            </div>

            {taskId && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-500 transition hover:border-rose-200 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:border-rose-400 dark:hover:bg-rose-500/20"
                onClick={() => setOpenDeleteAlert(true)}
              >
                <LuTrash2 className="text-base" /> Delete Task
              </button>
            )}
          </div>
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                  Task Title
                </label>
                <input
                  placeholder="Create App UI"
                  className="form-input  mt-0 h-12 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  value={taskData.title}
                  onChange={({ target }) => handleValueChange("title", target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                  Priority
                </label>
                <div className="form-input mt-0 h-12 bg-slate-50 p-0 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                  <SelectDropdown
                    options={PRIORITY_DATA}
                    value={taskData.priority}
                    onChange={(value) => handleValueChange("priority", value)}
                    placeholder="Select Priority"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  placeholder="Describe task"
                  className="form-input mt-0 min-h-[140px] bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/10"
                  rows={4}
                  value={taskData.description}
                  onChange={({ target }) => handleValueChange("description", target.value)}
                />
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                  Due Date
                </label>

                <div className="relative">
                  <input
                    className="form-input mt-0 h-12 bg-slate-50 pr-11 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    value={taskData.dueDate}
                    onChange={({ target }) => handleValueChange("dueDate", target.value)}
                    type="date"
                  />
                  <LuCalendarDays className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                  Assign To
                </label>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-900/60">
                  <SelectUsers
                    selectedUsers={taskData.assignedTo}
                    setSelectedUsers={(value) => {
                      handleValueChange("assignedTo", value);
                    }}
                  />
                </div>
              </div>
              </div>

                <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-900/60">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700 transition-colors duration-300 dark:text-slate-100">Todo Checklist</p>
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 transition-colors duration-300 dark:text-slate-500">Tasks</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400">
                      Break the work into smaller action items for better progress tracking.
                    </p>
                <TodoListInput
                  todoList={taskData.todoChecklist}
                  setTodoList={(value) => handleValueChange("todoChecklist", value)}
                />
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4 transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-900/60">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700 transition-colors duration-300 dark:text-slate-100">Add Attachments</p>
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400 transition-colors duration-300 dark:text-slate-500">Link</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 transition-colors duration-300 dark:text-slate-400">
                  Share helpful references, documents or design assets with the team.
                </p>
                <AddAttachmentsInput
                  attachments={taskData?.attachments}
                  setAttachments={(value) => handleValueChange("attachments", value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-6 text-sm font-medium text-rose-500">{error}</p>
            )}

              <div className="mt-8 border-t border-slate-100 pt-6">
              <button
                className="add-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {taskId ? "Update Task" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={openDeleteAlert}
        onClose={() => setOpenDeleteAlert(false)}
        title="Delete Task"
      >
        <DeleteAlert
          content="Are you sure you want to delete this task?"
          onDelete={() => deleteTask()}
        />
      </Modal>

    </DashboardLayout>
  );
};

export default CreateTask;