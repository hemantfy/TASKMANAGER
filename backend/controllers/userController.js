const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Task = require("../models/Task");
const User = require("../models/User");
const {
  PRIVILEGED_ROLES,
  formatUserRole,
  normalizeRole,
} = require("../utils/roleUtils");

const buildTaskCountsForUser = async (userId) => {
  const [pendingTasks, inProgressTasks, completedTasks] = await Promise.all([
    Task.countDocuments({ assignedTo: userId, status: "Pending" }),
    Task.countDocuments({ assignedTo: userId, status: "In Progress" }),
    Task.countDocuments({ assignedTo: userId, status: "Completed" }),
  ]);

  return { pendingTasks, inProgressTasks, completedTasks };
};

// @desc    Get all users (Admin only)
// @route   GET /api/users/
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const requesterRole = normalizeRole(req.user?.role);
  
    if (!PRIVILEGED_ROLES.includes(requesterRole)) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view the team directory" });
    }

    const users = await User.find({})
      .select("-password")
      .sort({ name: 1, email: 1 });

    // Add task counts to each user
    const usersWithTaskCounts = await Promise.all(
      users.map(async (user) => {
        const formattedUser = formatUserRole(user);
        const taskCounts = await buildTaskCountsForUser(formattedUser._id);

        const normalizedOfficeLocation =
          typeof formattedUser.officeLocation === "string"
            ? formattedUser.officeLocation.trim()
            : formattedUser.officeLocation;

        return {
          ...formattedUser,
          officeLocation: normalizedOfficeLocation,          
          ...taskCounts,
        };
      })
    );

    res.json(usersWithTaskCounts);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get user by ID with assigned tasks 
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const formattedRequesterRole = normalizeRole(req.user?.role);
    const isRequestingSelf = req.user?._id?.toString() === user._id.toString();
    const isPrivilegedUser = PRIVILEGED_ROLES.includes(formattedRequesterRole);

    if (!isPrivilegedUser && !isRequestingSelf) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this user" });
    }

    let tasks = await Task.find({ assignedTo: user._id })
      .populate("assignedTo", "name email profileImageUrl")
      .sort({ dueDate: 1, createdAt: -1 });

    tasks = tasks.map((task) => {
      const taskObject = task.toObject();
      const completedTodoCount = Array.isArray(taskObject.todoChecklist)
        ? taskObject.todoChecklist.filter((item) => item.completed).length
        : 0;

      return {
        ...taskObject,
        completedTodoCount,
      };
    });

    const taskSummary = tasks.reduce(
      (summary, task) => {
        if (task.status === "Pending") {
          summary.pending += 1;
        } else if (task.status === "In Progress") {
          summary.inProgress += 1;
        } else if (task.status === "Completed") {
          summary.completed += 1;
        }

        return summary;
      },
      { pending: 0, inProgress: 0, completed: 0 }
    );

    const formattedUser = formatUserRole(user);
    const userData = {
      ...formattedUser,
      pendingTasks: taskSummary.pending,
      inProgressTasks: taskSummary.inProgress,
      completedTasks: taskSummary.completed,
    };

    res.json({
      user: userData,
      tasks,
      taskSummary: {
        total: tasks.length,
        ...taskSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create a new user (Admin only)
// @route   POST /api/users
// @access  Private (Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, gender, officeLocation } = req.body || {};

    const trimmedOfficeLocation =
      typeof officeLocation === "string" ? officeLocation.trim() : "";

    if (!name || !email || !password || !gender || !trimmedOfficeLocation) {
      return res
        .status(400)
        .json({ message: "Name, email, password, gender and office location are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const requesterRole = normalizeRole(req.user?.role);
    const allowedRoles = ["member"];

    if (requesterRole === "admin") {
      allowedRoles.push("admin");
    }

    if (requesterRole === "owner") {
      allowedRoles.push("admin", "owner");
    }

    const normalizedRequestedRole = normalizeRole(role);
    const normalizedRole = allowedRoles.includes(normalizedRequestedRole)
      ? normalizedRequestedRole
      : "member";

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      gender,
      officeLocation: trimmedOfficeLocation,
      mustChangePassword: true,
    });

   const createdUser = formatUserRole(user);

    res.status(201).json({
      _id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      role: createdUser.role,
      gender: createdUser.gender,
      officeLocation: createdUser.officeLocation,
      mustChangePassword: createdUser.mustChangePassword,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteExistingProfileImage = (imageUrl) => {
  if (!imageUrl) return;

  try {
    const filePathFromUrl = imageUrl.startsWith("http")
      ? new URL(imageUrl).pathname
      : imageUrl;

    const absolutePath = path.join(__dirname, "..", filePathFromUrl);
    if (fs.existsSync(absolutePath)) {
      fs.unlink(absolutePath, (err) => {
        if (err) {
          console.error("Failed to remove old profile image", err);
        }
      });
    }
  } catch (error) {
    console.error("Failed to process old profile image path", error);
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requesterRole = normalizeRole(req.user?.role);
    const targetRole = normalizeRole(user.role);
    const requesterId = req.user?._id
      ? req.user._id.toString()
      : req.user?.id
      ? req.user.id.toString()
      : "";
    const userId = user._id;
    const isSelfDelete =
      requesterId && userId && requesterId === userId.toString();

    if (targetRole === "owner" && requesterRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can modify or remove owner accounts",
      });
    }

    if (targetRole === "owner" && isSelfDelete) {
      const providedToken =
        typeof req.body?.adminInviteToken === "string"
          ? req.body.adminInviteToken.trim()
          : "";

      if (!providedToken) {
        return res.status(400).json({
          message: "Invite token is required to delete this owner account.",
        });
      }

      if (providedToken !== process.env.ADMIN_INVITE_TOKEN) {
        return res.status(403).json({
          message: "Invalid invite token. Unable to delete owner account.",
        });
      }
    }

    const tasksWithUser = await Task.find({ assignedTo: userId }).select("assignedTo");

    const taskIdsToDelete = [];
    const taskIdsToUpdate = [];

    tasksWithUser.forEach((task) => {
      const assigneeIds = Array.isArray(task.assignedTo)
        ? task.assignedTo.filter(Boolean).map((assignee) => assignee.toString())
        : [];

      if (assigneeIds.length <= 1) {
        taskIdsToDelete.push(task._id);
      } else {
        taskIdsToUpdate.push(task._id);
      }
    });

    if (taskIdsToDelete.length > 0) {
      await Task.deleteMany({ _id: { $in: taskIdsToDelete } });
    }

    if (taskIdsToUpdate.length > 0) {
      await Task.updateMany(
        { _id: { $in: taskIdsToUpdate } },
        { $pull: { assignedTo: userId } }
      );
    }

    deleteExistingProfileImage(user.profileImageUrl);

    await user.deleteOne();

    res.json({
      message: "User deleted successfully",
      removedTasks: taskIdsToDelete.length,
      updatedTasks: taskIdsToUpdate.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update profile image
// @route   PUT /api/users/profile/photo
// @access  Private
const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    deleteExistingProfileImage(user.profileImageUrl);

    const profileImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    user.profileImageUrl = profileImageUrl;
    const updatedUser = await user.save();
    const formattedUpdatedUser = formatUserRole(updatedUser);

    res.json({
      message: "Profile photo updated successfully",
      profileImageUrl,
      user: {
        _id: formattedUpdatedUser._id,
        name: formattedUpdatedUser.name,
        email: formattedUpdatedUser.email,
        role: formattedUpdatedUser.role,
        profileImageUrl: formattedUpdatedUser.profileImageUrl,
        birthdate: formattedUpdatedUser.birthdate,
        mustChangePassword: formattedUpdatedUser.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Change account password
// @route   PUT /api/users/profile/password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Reset a user's password (Admin only)
// @route   PUT /api/users/:id/password
// @access  Private (Admin)
const resetUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body || {};

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const requesterRole = normalizeRole(req.user?.role);
    const targetRole = normalizeRole(user.role);

    if (targetRole === "owner" && requesterRole !== "owner") {
      return res.status(403).json({
        message: "Only owners can reset passwords for owner accounts",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = true;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  deleteUser,
  updateProfileImage,
  changePassword,
  resetUserPassword,
};