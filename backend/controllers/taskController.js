const Task = require("../models/Task");
const { hasPrivilegedAccess } = require("../utils/roleUtils");

const isPrivileged = (role) => hasPrivilegedAccess(role);

// @desc    Get all tasks (Admin: all, User: only assigned tasks)
// @route   GET /api/tasks/
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
let filter = {};

if (status) {
  filter.status = status;
}

let tasks;

if (isPrivileged(req.user.role)) {
  tasks = await Task.find(filter).populate(
    "assignedTo",
    "name email profileImageUrl"
  );
}   else {
    tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate(
      "assignedTo",
      "name email profileImageUrl"
    );
  }
  
  // Add completed todoChecklist count to each task
  tasks = await Promise.all(
    tasks.map(async (task) => {
      const completedCount = task.todoChecklist.filter(
        (item) => item.completed
      ).length;
  
      return { ...task._doc, completedTodoCount: completedCount };
    })
  );

  // Status summary counts
const allTasks = await Task.countDocuments(
    isPrivileged(req.user.role) ? {} : { assignedTo: req.user._id }
  );
  
  const pendingTasks = await Task.countDocuments({
    ...filter,
    status: "Pending",
    ...(!isPrivileged(req.user.role) && { assignedTo: req.user._id }),
  });
  
  const inProgressTasks = await Task.countDocuments({
    ...filter,
    status: "In Progress",
    ...(!isPrivileged(req.user.role) && { assignedTo: req.user._id }),
  });
  
  const completedTasks = await Task.countDocuments({
    ...filter,
    status: "Completed",
    ...(!isPrivileged(req.user.role) && { assignedTo: req.user._id }),
  });
 
  res.json({
    tasks,
    statusSummary: {
      all: allTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
    },
  });
    
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate(
            "assignedTo",
            "name email profileImageUrl"
          );
          
          if (!task) return res.status(404).json({ message: "Task not found" });
          
          res.json(task);          
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Create a new task (Admin only)
// @route   POST /api/tasks/
// @access  Private (Admin)
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            attachments,
            todoChecklist,
          } = req.body;
          
          if (!Array.isArray(assignedTo)) {
            return res
              .status(400)
              .json({ message: "assignedTo must be an array of user IDs" });
          }

          const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user._id,
            todoChecklist,
            attachments,
          });
          
          res.status(201).json({ message: "Task created successfully", task });   
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

if (!task) return res.status(404).json({ message: "Task not found" });

task.title = req.body.title || task.title;
task.description = req.body.description || task.description;
task.priority = req.body.priority || task.priority;
task.dueDate = req.body.dueDate || task.dueDate;
task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
task.attachments = req.body.attachments || task.attachments;

if (req.body.assignedTo) {
  if (!Array.isArray(req.body.assignedTo)) {
    return res
      .status(400)
      .json({ message: "assignedTo must be an array of user IDs" });
    }
        task.assignedTo = req.body.assignedTo;
    }

const updatedTask = await task.save();
res.json({ message: "Task updated successfully", updatedTask });

    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete a task (Admin only)
// @route   DELETE /api/tasks/:id
// @access  Private (Admin)
const deleteTask = async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) return res.status(404).json({ message: "Task not found" });

      await task.deleteOne();
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
    try {
      const task = await Task.findById(req.params.id);
if (!task) return res.status(404).json({ message: "Task not found" });

const assignedUsers = Array.isArray(task.assignedTo)
  ? task.assignedTo
  : task.assignedTo
  ? [task.assignedTo]
  : [];

const isAssigned = assignedUsers.some((user) => {
  if (!user) return false;
  const userId =
    typeof user === "object" && user !== null && user._id
      ? user._id.toString()
      : user.toString();
  return userId === req.user._id.toString();
});

if (!isAssigned && !isPrivileged(req.user.role)) {
  return res.status(403).json({ message: "Not authorized" });
}

const previousStatus = task.status;
if (req.body.status) {
  task.status = req.body.status;
}

if (task.status === "Completed") {
  task.todoChecklist.forEach((item) => (item.completed = true));
  task.progress = 100;
  if (previousStatus !== "Completed" || !task.completedAt) {
    task.completedAt = new Date();
  }
} else if (previousStatus === "Completed" && task.status !== "Completed") {
  task.completedAt = null;
}

await task.save();
res.json({ message: "Task status updated", task });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update task checklist
// @route   PUT /api/tasks/:id/todo
// @access  Private
const updateTaskChecklist = async (req, res) => {
    try {
      const { todoChecklist } = req.body;
const task = await Task.findById(req.params.id);

if (!task) return res.status(404).json({ message: "Task not found" });

const assignedUsers = Array.isArray(task.assignedTo)
  ? task.assignedTo
  : task.assignedTo
  ? [task.assignedTo]
  : [];

const isAssigned = assignedUsers.some((user) => {
  if (!user) return false;
  const userId = user._id ? user._id.toString() : user.toString();
  return userId === req.user._id.toString();
});

if (!isAssigned && !isPrivileged(req.user.role)) {
  return res
    .status(403)
    .json({ message: "Not authorized to update checklist" });
}

task.todoChecklist = todoChecklist; // Replace with updated checklist

const previousStatus = task.status;

// Auto-update progress based on checklist completion
const completedCount = task.todoChecklist.filter(
  (item) => item.completed
).length;
const totalItems = task.todoChecklist.length;
task.progress =
  totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  // Auto-mark task as completed if all items are checked
if (task.progress === 100) {
  task.status = "Completed";
  if (previousStatus !== "Completed" || !task.completedAt) {
    task.completedAt = new Date();
  }
} else {
  task.status = task.progress > 0 ? "In Progress" : "Pending";
  if (previousStatus === "Completed") {
    task.completedAt = null;
  }
}

await task.save();
const updatedTask = await Task.findById(req.params.id).populate(
  "assignedTo",
  "name email profileImageUrl"
);

res.json({ message: "Task checklist updated", task: updatedTask });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Fetch dashboard notifications
// @route   GET /api/tasks/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = [];
const now = new Date();

if (isPrivileged(req.user.role)) {
const completedTasks = await Task.find({
  status: "Completed",
  completedAt: { $ne: null },
})
  .sort({ completedAt: -1 })
  .limit(30)
  .select("title completedAt dueDate assignedTo")
  .populate("assignedTo", "name");

completedTasks.forEach((task) => {
  const assigneesArray = Array.isArray(task.assignedTo)
    ? task.assignedTo
    : task.assignedTo
    ? [task.assignedTo]
    : [];
  const assigneeNames = assigneesArray
    .map((assignee) => assignee?.name)
    .filter(Boolean)
    .join(", ");

  const completedOnTime =
    task.completedAt && task.dueDate
      ? task.completedAt.getTime() <= task.dueDate.getTime()
      : false;

  let message = `Task "${task.title}" was completed ${
    completedOnTime ? "on time" : "late"
  }`;
  if (assigneeNames) {
    message += ` by ${assigneeNames}`;
  }
  message += ".";

  notifications.push({
    id: `task-completed-${task._id}`,
    type: "task_completed",
    taskId: task._id,
    title: task.title,
    message,
    date: task.completedAt,
    status: completedOnTime ? "success" : "danger",
    meta: {
      completedOnTime,
      dueDate: task.dueDate,
      completedAt: task.completedAt,
      assignedTo: assigneeNames,
    },
  });
});
} else {
const lastSevenDays = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

const newTasks = await Task.find({
  assignedTo: req.user._id,
  createdAt: { $gte: lastSevenDays },
})
  .sort({ createdAt: -1 })
  .limit(30)
  .select("title createdAt priority dueDate");

newTasks.forEach((task) => {
  notifications.push({
    id: `task-assigned-${task._id}`,
    type: "task_assigned",
    taskId: task._id,
    title: task.title,
    message: `New task "${task.title}" assigned to you.`,
    date: task.createdAt,
    status: "info",
    meta: {
      dueDate: task.dueDate,
      priority: task.priority,
    },
  });
});

const upcomingDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const dueSoonTasks = await Task.find({
  assignedTo: req.user._id,
  status: { $ne: "Completed" },
  dueDate: { $gte: now, $lte: upcomingDeadline },
})
  .sort({ dueDate: 1 })
  .select("title dueDate priority");

dueSoonTasks.forEach((task) => {
  const hoursLeft = Math.max(
    1,
    Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  );

  notifications.push({
    id: `task-due-soon-${task._id}`,
    type: "task_due_soon",
    taskId: task._id,
    title: task.title,
    message: `"${task.title}" is due in ${hoursLeft} hour${
      hoursLeft > 1 ? "s" : ""
    }.`,
    date: task.dueDate,
    status: "warning",
    meta: {
      dueDate: task.dueDate,
      hoursLeft,
      priority: task.priority,
    },
  });
});
}

notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

const recentNotifications = notifications.slice(0, 5);

res.json({
  notifications: recentNotifications,
  count: recentNotifications.length,
});
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Dashboard Data (Admin only)
// @route   GET /api/tasks/dashboard-data
// @access  Private
const getDashboardData = async (req, res) => {
    try {
            if (!isPrivileged(req.user.role)) {
        return res
          .status(403)
          .json({ message: "Access denied, admin only" });
      }
      
      // Fetch statistics
const totalTasks = await Task.countDocuments();
const pendingTasks = await Task.countDocuments({ status: "Pending" });
const completedTasks = await Task.countDocuments({ status: "Completed" });
const overdueTasks = await Task.countDocuments({
  status: { $ne: "Completed" },
  dueDate: { $lt: new Date() },
});

// Ensure all possible statuses are included
const taskStatuses = ["Pending", "In Progress", "Completed"];
const taskDistributionRaw = await Task.aggregate([
  {
    $group: {
      _id: "$status",
      count: { $sum: 1 },
    },
  },
]);
const taskDistribution = taskStatuses.reduce((acc, status) => {
  const formattedKey = status.replace(/\s+/g, ""); // Remove spaces for response keys
  acc[formattedKey] =
    taskDistributionRaw.find((item) => item._id === status)?.count || 0;
  return acc;
}, {});
taskDistribution["All"] = totalTasks; // Add total count to taskDistribution

// Ensure all priority levels are included
const taskPriorities = ["Low", "Medium", "High"];
const taskPriorityLevelsRaw = await Task.aggregate([
  {
    $group: {
      _id: "$priority",
      count: { $sum: 1 },
    },
  },
]);
const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
  acc[priority] =
    taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
  return acc;
}, {});
// Fetch recent 10 tasks
const recentTasks = await Task.find()
  .sort({ createdAt: -1 })
  .limit(10)
  .select("title status priority dueDate createdAt assignedTo")
  .populate("assignedTo", "name email");

res.status(200).json({
  statistics: {
    totalTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
  },
  charts: {
    taskDistribution,
    taskPriorityLevels,
  },
  recentTasks,
});

    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Dashboard Data (User-specific)
// @route   GET /api/tasks/user-dashboard-data
// @access  Private
const getUserDashboardData = async (req, res) => {
    try {
      const userId = req.user._id; // Only fetch data for the logged-in user

// Fetch statistics for user-specific tasks
const totalTasks = await Task.countDocuments({ assignedTo: userId });
const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: "Pending" });
const completedTasks = await Task.countDocuments({ assignedTo: userId, status: "Completed" });
const overdueTasks = await Task.countDocuments({
  assignedTo: userId,
  status: { $ne: "Completed" },
  dueDate: { $lt: new Date() },
});

// Task distribution by status
const taskStatuses = ["Pending", "In Progress", "Completed"];
const taskDistributionRaw = await Task.aggregate([
  { $match: { assignedTo: userId } },
  { $group: { _id: "$status", count: { $sum: 1 } } },
]);

const taskDistribution = taskStatuses.reduce((acc, status) => {
  const formattedKey = status.replace(/\s+/g, ""); // Remove spaces for response keys
  acc[formattedKey] =
    taskDistributionRaw.find((item) => item._id === status)?.count || 0;
  return acc;
}, {});
taskDistribution["All"] = totalTasks;

// Task distribution by priority
const taskPriorities = ["Low", "Medium", "High"];
const taskPriorityLevelsRaw = await Task.aggregate([
  { $match: { assignedTo: userId } },
  { $group: { _id: "$priority", count: { $sum: 1 } } },
]);

const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
  acc[priority] =
    taskPriorityLevelsRaw.find((item) => item._id === priority)?.count || 0;
  return acc;
}, {});

// Fetch recent 10 tasks for the logged-in user
const recentTasks = await Task.find({ assignedTo: userId })
  .sort({ createdAt: -1 })
  .limit(10)
  .select("title status priority dueDate createdAt");

res.status(200).json({
  statistics: {
    totalTasks,
    pendingTasks,
    completedTasks,
    overdueTasks,
  },
  charts: {
    taskDistribution,
    taskPriorityLevels,
  },
  recentTasks,
});

    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getNotifications,
    getDashboardData,
    getUserDashboardData,
  };