import React, { useState } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { PRIORITY_DATA } from "../../utils/data";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { LuCalendarDays, LuTrash2 } from "react-icons/lu";
import SelectDropdown from '../../components/inputs/SelectDropdown';
import SelectUsers from '../../components/inputs/SelectUsers';
import TodoListInput from '../../components/inputs/TodoListInput';
import AddAttachmentsInput from '../../components/inputs/AddAttachmentsInput';

const CreateTask = () => {

  const location = useLocation();
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

  const [, setOpenDeleteAlert] = useState(false);

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
      const todolist = taskData.todoChecklist?.map((item) => ({
        text: item,
        completed: false,
      }));
    
      await axiosInstance.post(API_PATHS.TASKS.CREATE_TASK, {
        ...taskData,
        dueDate: dueDateMoment.toISOString(),
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
  const updateTask = async () => {};

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

    createTask();
  };  

  // get Task info by ID
  const getTaskDetailsByID = async () => {};

  // Delete Task
  const deleteTask = async () => {};

  return (
    <DashboardLayout activeMenu="CreateTasK">
      <div className="mt-6 max-w-5xl mx-auto">
        <div className="rounded-3xl border border-slate-200/70 bg-white shadow-md shadow-slate-200/60">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {taskId ? "Update Task" : "Create Task"}
              </h2>
              <p className="text-sm text-slate-500">
                Keep everything organised by sharing the right details with your team.
              </p>
            </div>

            {taskId && (
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-500 transition hover:border-rose-200 hover:bg-rose-100"
                onClick={() => setOpenDeleteAlert(true)}
              >
                <LuTrash2 className="text-base" /> Delete Task
              </button>
            )}
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
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
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
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
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
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
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Due Date
                </label>

                <div className="relative">
                  <input
                    className="form-input mt-0 h-12 bg-slate-50 pr-11 focus:border-primary focus:ring-2 focus:ring-primary/10"
                    value={taskData.dueDate}
                    onChange={({ target }) => handleValueChange("dueDate", target.value)}
                    type="date"
                  />
                  <LuCalendarDays className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Assign To
                </label>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3">
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
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Todo Checklist</p>
                      <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Tasks</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      Break the work into smaller action items for better progress tracking.
                    </p>
                <TodoListInput
                  todoList={taskData.todoChecklist}
                  setTodoList={(value) => handleValueChange("todoChecklist", value)}
                />
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Add Attachments</p>
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">Link</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
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
    </DashboardLayout>
  );
};

export default CreateTask;