const Task = require("../models/Task");
const User = require("../models/User");
const Matter = require("../models/Matter");
const CaseFile = require("../models/CaseFile");
const Document = require("../models/Document");
const { sendTaskAssignmentEmail } = require("../utils/emailService");
const { hasPrivilegedAccess, matchesRole } = require("../utils/roleUtils");

const isPrivileged = (role) => hasPrivilegedAccess(role);

const normalizeObjectId = (value) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  if (typeof value === "object") {
    if (value === null) {
      return null;
    }

    if (value._id) {
      return value._id.toString();
    }

    if (value.id) {
      return value.id.toString();
    }
  }

  if (typeof value === "string" || typeof value === "number") {
    return value.toString();
  }

  return undefined;
};

const buildHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const resolveMatterAndCase = async ({ matterId, caseFileId }) => {
  const matterProvided = matterId !== undefined;
  const caseProvided = caseFileId !== undefined;

  if (!matterProvided && !caseProvided) {
    return { matterId: undefined, caseFileId: undefined };
  }

  let normalizedMatterId = normalizeObjectId(matterId);
  let normalizedCaseId = normalizeObjectId(caseFileId);
  let caseFileDocument = null;

  if (caseProvided) {
    if (normalizedCaseId) {
      caseFileDocument = await CaseFile.findById(normalizedCaseId).select("matter");

      if (!caseFileDocument) {
        throw buildHttpError("Selected case file could not be found.");
      }
    } else {
      normalizedCaseId = null; // explicit clear
    }
  }

  if (caseFileDocument) {
    const caseMatterId = caseFileDocument.matter
      ? caseFileDocument.matter.toString()
      : null;

    if (!caseMatterId) {
      throw buildHttpError("Selected case file is not linked to a matter.");
    }

    if (matterProvided && normalizedMatterId && normalizedMatterId !== caseMatterId) {
      throw buildHttpError(
        "Selected case file does not belong to the specified matter."
      );
    }

    normalizedMatterId = caseMatterId;
  }

  if (matterProvided) {
    if (normalizedMatterId) {
      const matterExists = await Matter.exists({ _id: normalizedMatterId });
      if (!matterExists) {
        throw buildHttpError("Selected matter could not be found.");
      }
    } else {
      normalizedMatterId = null; // explicit clear
    }
  }

  return {
    matterId: matterProvided ? normalizedMatterId : normalizedMatterId ?? undefined,
    caseFileId: caseProvided ? normalizedCaseId : normalizedCaseId ?? undefined,
  };
};

const validateRelatedDocuments = async (documentIds, matterId, caseFileId) => {
  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    return [];
  }

  const normalizedIds = [
    ...new Set(
      documentIds
        .map((documentId) => normalizeObjectId(documentId))
        .filter((documentId) => documentId)
    ),
  ];

  if (!normalizedIds.length) {
    return [];
  }

  const documents = await Document.find({
    _id: { $in: normalizedIds },
  }).select("_id matter caseFile");

  if (!documents.length) {
    throw buildHttpError("Linked documents could not be found.");
  }

  const filteredDocuments = documents.filter((document) => {
    const documentMatterId = document.matter?.toString();
    const documentCaseId = document.caseFile?.toString();

    if (matterId && documentMatterId && matterId !== documentMatterId) {
      return false;
    }

    if (caseFileId && documentCaseId && caseFileId !== documentCaseId) {
      return false;
    }

    return true;
  });

  if (filteredDocuments.length !== documents.length) {
    throw buildHttpError(
      "Some linked documents do not belong to the selected matter or case file."
    );
  }

  return filteredDocuments.map((document) => document._id);
};

const sanitizeTodoChecklist = ({
  checklistInput,
  validAssigneeIds = [],
  previousChecklist = [],
}) => {
  if (!Array.isArray(checklistInput) || checklistInput.length === 0) {
    return [];
  }

  const validAssigneeSet = new Set(
    validAssigneeIds.map((assigneeId) => assigneeId.toString())
  );

  return checklistInput
    .map((item) => {
      const text =
        typeof item === "string"
          ? item.trim()
          : typeof item?.text === "string"
          ? item.text.trim()
          : "";

      if (!text) {
        return null;
      }

      const assignedValue =
        item && typeof item === "object"
          ? item.assignedTo?._id || item.assignedTo || ""
          : "";

      const assignedTo = assignedValue ? assignedValue.toString() : "";

      if (!assignedTo || !validAssigneeSet.has(assignedTo)) {
        throw buildHttpError(
          "Each checklist item must be assigned to a selected member."
        );
      }

      const previousMatch = previousChecklist.find((previousItem) => {
        if (!previousItem) return false;
        if (item?._id && previousItem?._id) {
          return previousItem._id.toString() === item._id.toString();
        }
        return previousItem.text === text;
      });

      const completed = Boolean(
        item?.completed ?? previousMatch?.completed ?? false
      );

      const sanitizedItem = {
        text,
        assignedTo,
        completed,
      };

      if (item?._id) {
        sanitizedItem._id = item._id;
      }

      return sanitizedItem;
    })
    .filter(Boolean);
};

// @desc    Get all tasks (Admin: all, User: only assigned tasks)
// @route   GET /api/tasks/
// @access  Private
const getTasks = async (req, res) => {
  try {
    const { status, scope, matter: matterId, caseFile: caseFileId } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (matterId) {
      filter.matter = matterId;
    }

    if (caseFileId) {
      filter.caseFile = caseFileId;
    }

    const normalizedScope = typeof scope === "string" ? scope.toLowerCase() : "";
    const shouldLimitToCurrentUser =
      !isPrivileged(req.user.role) || normalizedScope === "my";

    const assignedFilter = shouldLimitToCurrentUser
      ? { assignedTo: req.user._id }
      : {};

    const tasks = await Task.find({ ...filter, ...assignedFilter })
      .populate("assignedTo", "name email profileImageUrl")
      .populate({
        path: "matter",
        select: "title clientName matterNumber status client",
        populate: { path: "client", select: "name email" },
      })
      .populate("caseFile", "title caseNumber status")
      .populate("relatedDocuments", "title documentType version");

    // Add completed todoChecklist count to each task
    const tasksWithChecklistCounts = await Promise.all(
      tasks.map(async (task) => {
        const completedCount = task.todoChecklist.filter(
          (item) => item.completed
        ).length;

        return { ...task._doc, completedTodoCount: completedCount };
      })
    );

    // Status summary counts
    const summaryBaseFilter = shouldLimitToCurrentUser
      ? { assignedTo: req.user._id }
      : {};

    const allTasks = await Task.countDocuments(summaryBaseFilter);

    const pendingTasks = await Task.countDocuments({
      ...summaryBaseFilter,
      status: "Pending",
    });

    const inProgressTasks = await Task.countDocuments({
      ...summaryBaseFilter,
      status: "In Progress",
    });

    const completedTasks = await Task.countDocuments({
      ...summaryBaseFilter,
      status: "Completed",
    });

    res.json({
      tasks: tasksWithChecklistCounts,
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
        const task = await Task.findById(req.params.id)
          .populate("assignedTo", "name email profileImageUrl")
          .populate("todoChecklist.assignedTo", "name email profileImageUrl")
          .populate({                      
            path: "matter",
            select: "title clientName matterNumber status client",
            populate: { path: "client", select: "name email" },
          })
          .populate("caseFile", "title caseNumber status")
          .populate("relatedDocuments", "title documentType version");
          
          if (!task) return res.status(404).json({ message: "Task not found" });
          
          res.json(task);          
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.statusCode ? error.message : "Server error",
        error: error.statusCode ? undefined : error.message,
      });
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
            matter: matterId,
            caseFile: caseFileId,
            relatedDocuments,            
          } = req.body;
          
          if (!Array.isArray(assignedTo)) {
            return res
              .status(400)
              .json({ message: "assignedTo must be an array of user IDs" });
          }

          const normalizedAssignees = assignedTo
            .map((assignee) => {
              if (assignee && typeof assignee === "object" && assignee._id) {
                return assignee._id.toString();
              }

              return assignee?.toString();
            })
            .filter(Boolean);

          const uniqueAssigneeIds = [
            ...new Set(normalizedAssignees.map((id) => id.toString())),
          ];

          const { matterId: resolvedMatterId, caseFileId: resolvedCaseId } =
            await resolveMatterAndCase({ matterId, caseFileId });

          const validatedDocumentIds = await validateRelatedDocuments(
            relatedDocuments,
            resolvedMatterId ?? undefined,
            resolvedCaseId ?? undefined
          );

          const sanitizedTodoChecklist = sanitizeTodoChecklist({
            checklistInput: todoChecklist,
            validAssigneeIds: uniqueAssigneeIds,
          });

          const taskPayload = {
            title,
            description,
            priority,
            dueDate,
            assignedTo: uniqueAssigneeIds,
            createdBy: req.user._id,
            todoChecklist: sanitizedTodoChecklist,
            attachments,
          };

          if (resolvedMatterId !== undefined) {
            taskPayload.matter = resolvedMatterId;
          }

          if (resolvedCaseId !== undefined) {
            taskPayload.caseFile = resolvedCaseId;
          }

          if (validatedDocumentIds.length) {
            taskPayload.relatedDocuments = validatedDocumentIds;
          }

          const task = await Task.create(taskPayload);
          try {
            const assignees = await User.find({
              _id: { $in: uniqueAssigneeIds },
            }).select("name email");

            if (assignees.length) {
              await sendTaskAssignmentEmail({
                task,
                assignees,
                assignedBy: req.user,
              });
            }
          } catch (notificationError) {
            console.error(
              "Failed to send task assignment notification:",
              notificationError
            );
          }

          res.status(201).json({ message: "Task created successfully", task }); 
    } catch (error) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        message: error.statusCode ? error.message : "Server error",
        error: error.statusCode ? undefined : error.message,
      });
    }
};

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

if (!task) return res.status(404).json({ message: "Task not found" });

const existingAssigneeIds = Array.isArray(task.assignedTo)
  ? task.assignedTo.map((id) => id.toString())
  : [];

const originalDueDate = task.dueDate ? task.dueDate.getTime() : null;
let dueDateChanged = false;
let newlyAssignedIds = [];
let resolvedMatterId = task.matter ? task.matter.toString() : null;
let resolvedCaseId = task.caseFile ? task.caseFile.toString() : null;

if (req.body.title !== undefined) {
  task.title = req.body.title;
}
if (req.body.description !== undefined) {
  task.description = req.body.description;
}
if (req.body.priority !== undefined) {
  task.priority = req.body.priority;
}
if (req.body.dueDate) {
  const incomingDueDate = new Date(req.body.dueDate);
  if (!Number.isNaN(incomingDueDate.getTime())) {
    dueDateChanged = originalDueDate !== incomingDueDate.getTime();
    task.dueDate = incomingDueDate;
  }
}
if (req.body.attachments !== undefined) {
  task.attachments = req.body.attachments;
}

const hasMatterUpdate = Object.prototype.hasOwnProperty.call(req.body, "matter");
const hasCaseUpdate = Object.prototype.hasOwnProperty.call(req.body, "caseFile");

if (hasMatterUpdate || hasCaseUpdate) {
  let nextMatterInput = hasMatterUpdate ? req.body.matter : resolvedMatterId;
  let nextCaseInput = hasCaseUpdate ? req.body.caseFile : resolvedCaseId;

  if (hasMatterUpdate && normalizeObjectId(req.body.matter) === null && !hasCaseUpdate) {
    nextCaseInput = null;
  }

  const { matterId: nextMatterId, caseFileId: nextCaseId } = await resolveMatterAndCase({
    matterId: nextMatterInput,
    caseFileId: nextCaseInput,
  });

  if (nextMatterId !== undefined) {
    resolvedMatterId = nextMatterId;
    task.matter = nextMatterId;
  }

  if (nextCaseId !== undefined) {
    resolvedCaseId = nextCaseId;
    task.caseFile = nextCaseId;
  }
}

if (Object.prototype.hasOwnProperty.call(req.body, "relatedDocuments")) {
  const validatedDocumentIds = await validateRelatedDocuments(
    req.body.relatedDocuments,
    resolvedMatterId ?? undefined,
    resolvedCaseId ?? undefined
  );
  task.relatedDocuments = validatedDocumentIds;
}

if (req.body.assignedTo) {
  if (!Array.isArray(req.body.assignedTo)) {
    return res
      .status(400)
      .json({ message: "assignedTo must be an array of user IDs" });
  }

  const normalizedAssignees = req.body.assignedTo
    .map((assignee) => {
      if (assignee && typeof assignee === "object" && assignee._id) {
        return assignee._id.toString();
      }
      return assignee?.toString();
    })
    .filter(Boolean);

  newlyAssignedIds = normalizedAssignees.filter(
    (assigneeId) =>
      assigneeId && !existingAssigneeIds.includes(assigneeId.toString())
  );

  task.assignedTo = normalizedAssignees;
}

const hasTodoChecklistUpdate = Object.prototype.hasOwnProperty.call(
  req.body,
  "todoChecklist"
);

if (hasTodoChecklistUpdate) {
  const currentAssigneeIds = Array.isArray(task.assignedTo)
    ? task.assignedTo
        .map((assignee) => normalizeObjectId(assignee))
        .filter(Boolean)
    : [];

  const sanitizedTodoChecklist = sanitizeTodoChecklist({
    checklistInput: req.body.todoChecklist,
    validAssigneeIds: currentAssigneeIds,
    previousChecklist: task.todoChecklist,
  });

  task.todoChecklist = sanitizedTodoChecklist;
}

if (dueDateChanged) {
  task.reminderSentAt = null;
}

const updatedTask = await task.save();

if (newlyAssignedIds.length) {
  try {
    const assignees = await User.find({
      _id: { $in: newlyAssignedIds },
    }).select("name email");

    if (assignees.length) {
      await sendTaskAssignmentEmail({
        task: updatedTask,
        assignees,
        assignedBy: req.user,
      });
    }
  } catch (notificationError) {
    console.error(
      "Failed to send task reassignment notification:",
      notificationError
    );
  }
}

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

      if (!Array.isArray(todoChecklist)) {
        return res
          .status(400)
          .json({ message: "Invalid checklist payload" });
      }

      const task = await Task.findById(req.params.id);

      if (!task) return res.status(404).json({ message: "Task not found" });

      const assignedUsers = Array.isArray(task.assignedTo)
        ? task.assignedTo
        : task.assignedTo
        ? [task.assignedTo]
        : [];

      const requesterId = req.user._id.toString();
      const canManageAll = isPrivileged(req.user.role);

      const isAssigned = assignedUsers.some((user) => {
        if (!user) return false;
        const userId = normalizeObjectId(user);
        return userId === requesterId;
      });

      if (!isAssigned && !canManageAll) {
        return res
          .status(403)
          .json({ message: "Not authorized to update checklist" });
      }

      const checklistUpdates = new Map(
        todoChecklist
          .filter((item) => item && item._id)
          .map((item) => [item._id.toString(), Boolean(item.completed)])
      );

      task.todoChecklist.forEach((item, index) => {
        const itemId = item?._id ? item._id.toString() : null;

        if (!itemId || !checklistUpdates.has(itemId)) {
          return;
        }

        const assigneeId = normalizeObjectId(item.assignedTo);
        const isAuthorized = canManageAll || assigneeId === requesterId;

        if (!isAuthorized) {
          return;
        }

        const nextCompleted = checklistUpdates.get(itemId);
        task.todoChecklist[index].completed = nextCompleted;
      });

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
const updatedTask = await Task.findById(req.params.id)
  .populate("assignedTo", "name email profileImageUrl")
  .populate("todoChecklist.assignedTo", "name email profileImageUrl");

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

      const normalizeStartDate = (value) => {
        if (!value) {
          return null;
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          return null;
        }

        parsed.setHours(0, 0, 0, 0);
        return parsed;
      };

      const normalizeEndDate = (value) => {
        if (!value) {
          return null;
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) {
          return null;
        }

        parsed.setHours(23, 59, 59, 999);
        return parsed;
      };

      const startDate = normalizeStartDate(req.query.startDate);
      const endDate = normalizeEndDate(req.query.endDate);

      const createdAtFilter = {};

      if (startDate) {
        createdAtFilter.$gte = startDate;
      }

      if (endDate) {
        createdAtFilter.$lte = endDate;
      }

      const baseTaskFilter = Object.keys(createdAtFilter).length
        ? { createdAt: createdAtFilter }
        : {};

      const baseMatchStages = Object.keys(createdAtFilter).length
        ? [{ $match: { createdAt: createdAtFilter } }]
        : [];
      
      // Fetch statistics
      const totalTasks = await Task.countDocuments(baseTaskFilter);
      const pendingTasks = await Task.countDocuments({
        ...baseTaskFilter,
        status: "Pending",
      });
      const completedTasks = await Task.countDocuments({
        ...baseTaskFilter,
        status: "Completed",
      });
      const overdueTasks = await Task.countDocuments({
        ...baseTaskFilter,        
        status: { $ne: "Completed" },
        dueDate: { $lt: new Date() },
      });

      // Ensure all possible statuses are included
      const taskStatuses = ["Pending", "In Progress", "Completed"];
      const taskDistributionRaw = await Task.aggregate([
        ...baseMatchStages,        
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
        ...baseMatchStages,        
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

      // Compute leaderboard statistics for admins, members, and clients
      const potentialTeamMembers = await User.find()
        .select("name role profileImageUrl officeLocation");

      const teamMembers = potentialTeamMembers.filter((user) =>
        matchesRole(user.role, "admin") ||
        matchesRole(user.role, "member") ||
        matchesRole(user.role, "client")
      );

      const relevantUserIds = teamMembers.map((user) => user._id);
      const now = new Date();

      const leaderboardAggregation = relevantUserIds.length
        ? await Task.aggregate([
            ...baseMatchStages,          
            { $unwind: "$assignedTo" },
            { $match: { assignedTo: { $in: relevantUserIds } } },
            {
              $group: {
                _id: "$assignedTo",
                totalAssigned: { $sum: 1 },
                completedTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
                  },
                },
                pendingTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
                  },
                },
                inProgressTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "In Progress"] }, 1, 0],
                  },
                },
                onTimeCompletions: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$status", "Completed"] },
                          { $ne: ["$completedAt", null] },
                          { $lte: ["$completedAt", "$dueDate"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                lateCompletions: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$status", "Completed"] },
                          { $ne: ["$completedAt", null] },
                          { $gt: ["$completedAt", "$dueDate"] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                overdueTasks: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$status", "Completed"] },
                          { $lt: ["$dueDate", now] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ])
        : [];

      const leaderboardStatsMap = leaderboardAggregation.reduce(
        (acc, item) => {
          acc[item._id.toString()] = {
            totalAssigned: item.totalAssigned || 0,
            completedTasks: item.completedTasks || 0,
            pendingTasks: item.pendingTasks || 0,
            inProgressTasks: item.inProgressTasks || 0,
            onTimeCompletions: item.onTimeCompletions || 0,
            lateCompletions: item.lateCompletions || 0,
            overdueTasks: item.overdueTasks || 0,
          };
          return acc;
        },
        {}
      );

      const leaderboard = teamMembers
        .map((user) => {
          const stats =
            leaderboardStatsMap[user._id.toString()] || {
              totalAssigned: 0,
              completedTasks: 0,
              pendingTasks: 0,
              inProgressTasks: 0,
              onTimeCompletions: 0,
              lateCompletions: 0,
              overdueTasks: 0,
            };

          const normalizedOfficeLocation =
            typeof user.officeLocation === "string"
              ? user.officeLocation.trim()
              : user.officeLocation;

          const {
            totalAssigned,
            completedTasks: completed,
            pendingTasks: pending,
            inProgressTasks: inProgress,
            onTimeCompletions: onTime,
            lateCompletions: late,
            overdueTasks: overdue,
          } = stats;

          const completionRate = totalAssigned
            ? Math.round((completed / totalAssigned) * 100)
            : 0;
          const onTimeRate = completed
            ? Math.round((onTime / completed) * 100)
            : 0;

          const score =
            completed * 10 +
            onTime * 5 +
            inProgress * 2 -
            late * 3 -
            overdue * 3 -
            pending;

          return {
            userId: user._id,
            name: user.name,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            officeLocation: normalizedOfficeLocation,
            totalAssigned,
            completedTasks: completed,
            pendingTasks: pending,
            inProgressTasks: inProgress,
            onTimeCompletions: onTime,
            lateCompletions: late,
            overdueTasks: overdue,
            completionRate,
            onTimeRate,
            score,
          };
        })
        .sort((a, b) => {
          if (b.score !== a.score) {
            return b.score - a.score;
          }

          if (b.onTimeCompletions !== a.onTimeCompletions) {
            return b.onTimeCompletions - a.onTimeCompletions;
          }

          if (b.completedTasks !== a.completedTasks) {
            return b.completedTasks - a.completedTasks;
          }

          return (a.name || "").localeCompare(b.name || "");
        })
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

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
        leaderboard,
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