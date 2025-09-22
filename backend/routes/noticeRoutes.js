const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
  publishNotice,
  getActiveNotice,
} = require("../controllers/noticeController");

const router = express.Router();

router.post("/", protect, adminOnly, publishNotice);
router.get("/active", protect, getActiveNotice);

module.exports = router;