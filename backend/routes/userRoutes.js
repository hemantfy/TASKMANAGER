const express = require("express");
const { adminOnly, protect } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadmiddleware");
const {
  getUsers,
  getUserById,
  updateProfileImage,
  changePassword,
} = require("../controllers/userController");

const router = express.Router();

// User Management Routes
router.get("/", protect, adminOnly, getUsers); // Get all users (Admin only)
router.get("/:id", protect, getUserById); // Get a specific user

// Profile Settings
router.put(
    "/profile/photo",
    protect,
    upload.single("profileImage"),
    updateProfileImage
  );
  router.put("/profile/password", protect, changePassword);
  
module.exports = router;