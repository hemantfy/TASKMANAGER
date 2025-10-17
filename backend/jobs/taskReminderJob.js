const Task = require("../models/Task");
const { sendTaskReminderEmail } = require("../utils/emailService");

const REMINDER_INTERVAL_MS = 60 * 60 * 1000; // Run once every hour

let reminderTimer = null;

const runReminderCheck = async () => {
  const now = new Date();
  dueDate: { $gte: previousDay, $lte: nextDay },
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  try {
    const tasksDueSoon = await Task.find({
      dueDate: { $gte: now, $lte: nextDay },
      status: { $ne: "Completed" },
      $or: [{ reminderSentAt: null }, { reminderSentAt: { $exists: false } }],
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email");

    await Promise.all(
      tasksDueSoon.map(async (task) => {
        const assigneesSource = Array.isArray(task.assignedTo)
          ? task.assignedTo
          : task.assignedTo
          ? [task.assignedTo]
          : [];
        const assignees = assigneesSource.filter(Boolean);

        if (!task.dueDate) {
          return;
        }
        if (!assignees.length) {
          return;
        }

        try {
          await sendTaskReminderEmail({
            task,
            assignees,
            assignedBy: task.createdBy,
          });

          task.reminderSentAt = now;
          await task.save();
        } catch (error) {
          console.error(
            "Failed to send reminder email for task",
            task._id,
            error
          );
        }
      })
    );
  } catch (error) {
    console.error("Task reminder job failed", error);
  }
};

const startTaskReminderJob = () => {
  if (reminderTimer) {
    return;
  }

  runReminderCheck();
  reminderTimer = setInterval(runReminderCheck, REMINDER_INTERVAL_MS);
};

module.exports = { startTaskReminderJob };