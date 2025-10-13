const nodemailer = require("nodemailer");

let transporter = null;

const isEmailConfigured = () => {
  return (
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    (process.env.EMAIL_USER || process.env.EMAIL_FROM)
  );
};

const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: String(process.env.EMAIL_PORT) === "465",
      auth:
        process.env.EMAIL_USER && process.env.EMAIL_PASS
          ? {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            }
          : undefined,
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const mailer = getTransporter();

  if (!mailer) {
    console.warn(
      "Email transport is not configured. Skipping email delivery for:",
      subject
    );
    return;
  }

  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  await mailer.sendMail({ from, to, subject, text, html });
};

const formatDueDate = (dueDate) => {
  if (!dueDate) return "an upcoming deadline";
  try {
    return new Date(dueDate).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return String(dueDate);
  }
};

const buildAssignmentEmail = ({ task, assignees, assignedBy }) => {
  const dueDate = formatDueDate(task.dueDate);
  const assignedByName = assignedBy?.name || "A team member";

  const text = `Hello,

You have been assigned a new task: ${task.title}.

Details:
- Description: ${task.description || "No description provided"}
- Priority: ${task.priority}
- Due date: ${dueDate}

Assigned by: ${assignedByName}

Please log in to the Task Manager to review the task.

Thank you.`;

  const html = `<p>Hello,</p>
<p>You have been assigned a new task: <strong>${task.title}</strong>.</p>
<ul>
  <li><strong>Description:</strong> ${
    task.description || "No description provided"
  }</li>
  <li><strong>Priority:</strong> ${task.priority}</li>
  <li><strong>Due date:</strong> ${dueDate}</li>
</ul>
<p>Assigned by: ${assignedByName}</p>
<p>Please log in to the Task Manager to review the task.</p>
<p>Thank you.</p>`;

  return { subject: `New task assigned: ${task.title}`, text, html };
};

const buildReminderEmail = ({ task, assignedBy, message }) => {
  const dueDate = formatDueDate(task.dueDate);
  const sender = assignedBy?.name || "A team member";
  const reminderMessage = message ||
    `This is a friendly reminder that the task "${task.title}" is due on ${dueDate}.`;

  const text = `Hello,

${reminderMessage}

Task details:
- Priority: ${task.priority}
- Due date: ${dueDate}

Reminder sent by: ${sender}

Please log in to the Task Manager for more information.

Thank you.`;

  const html = `<p>Hello,</p>
<p>${reminderMessage}</p>
<ul>
  <li><strong>Priority:</strong> ${task.priority}</li>
  <li><strong>Due date:</strong> ${dueDate}</li>
</ul>
<p>Reminder sent by: ${sender}</p>
<p>Please log in to the Task Manager for more information.</p>
<p>Thank you.</p>`;

  return { subject: `Reminder: ${task.title}`, text, html };
};

const sendTaskAssignmentEmail = async ({ task, assignees, assignedBy }) => {
  const recipients = assignees.filter((user) => user?.email).map((user) => user.email);

  if (!recipients.length) {
    return;
  }

  const { subject, text, html } = buildAssignmentEmail({ task, assignees, assignedBy });
  await sendEmail({ to: recipients, subject, text, html });
};

const sendTaskReminderEmail = async ({ task, assignees, assignedBy, message }) => {
  const recipients = assignees.filter((user) => user?.email).map((user) => user.email);

  if (!recipients.length) {
    return;
  }

  const { subject, text, html } = buildReminderEmail({ task, assignedBy, message });
  await sendEmail({ to: recipients, subject, text, html });
};

module.exports = {
  sendTaskAssignmentEmail,
  sendTaskReminderEmail,
};