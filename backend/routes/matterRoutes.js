const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
  getMatters,
  getMatterById,
  createMatter,
  updateMatter,
  deleteMatter,
} = require("../controllers/matterController");

const router = express.Router();

router.get("/", protect, getMatters);
router.get("/:id", protect, getMatterById);
router.post("/", protect, adminOnly, createMatter);
router.put("/:id", protect, adminOnly, updateMatter);
router.delete("/:id", protect, adminOnly, deleteMatter);

module.exports = router;