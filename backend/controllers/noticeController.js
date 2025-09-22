const Notice = require("../models/Notice");

// @desc    Publish a new notice (Admin only)
// @route   POST /api/notices
// @access  Private (Admin)
const publishNotice = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ message: "Notice message is required" });
    }

    const trimmedMessage = message.trim();

    await Notice.updateMany(
      { isActive: true },
      { isActive: false, deactivatedAt: new Date() }
    );

    const notice = await Notice.create({
      message: trimmedMessage,
      createdBy: req.user._id,
      isActive: true,
    });

    res.status(201).json({
      message: "Notice published successfully",
      notice,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to publish notice",
      error: error.message,
    });
  }
};

// @desc    Get the currently active notice
// @route   GET /api/notices/active
// @access  Private
const getActiveNotice = async (req, res) => {
  try {
    const notice = await Notice.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    res.json({ notice });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch active notice",
      error: error.message,
    });
  }
};

module.exports = {
  publishNotice,
  getActiveNotice,
};