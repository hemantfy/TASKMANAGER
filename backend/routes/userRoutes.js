const express = require("express");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadmiddleware");
const {
  getUsers,
  getUserById,
  createUser,
  updateProfileImage,
  changePassword,
  resetUserPassword,
} = require("../controllers/userController");

const router = express.Router();

// User Management Routes
router.get("/", protect, adminOnly, getUsers); // Get all users (Admin only)
router.post("/", protect, adminOnly, createUser); // Create a new user (Admin only)
router.get("/:id", protect, getUserById); // Get a specific user
router.put("/:id/password", protect, adminOnly, resetUserPassword); // Reset a user's password

// Profile Settings
router.put(
  "/profile/photo",
  protect,
  upload.single("profileImage"),
  updateProfileImage
);
router.put("/profile/password", protect, changePassword);

module.exports = router;