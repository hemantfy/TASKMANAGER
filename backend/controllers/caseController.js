const CaseFile = require("../models/CaseFile");
const Matter = require("../models/Matter");
const Document = require("../models/Document");
const Task = require("../models/Task");

const buildHttpError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const handleErrorResponse = (res, error) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.statusCode ? error.message : "Server error",
    error: error.statusCode ? undefined : error.message,
  });
};

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeObjectId = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "object") {
    if (value._id) {
      return value._id.toString();
    }

    if (value.id) {
      return value.id.toString();
    }
  }

  return value.toString();
};

const getCases = async (req, res) => {
  try {
    const { matterId, status } = req.query;
    const filter = {};

    if (matterId) {
      filter.matter = matterId;
    }

    if (status) {
      filter.status = status;
    }

    const cases = await CaseFile.find(filter)
      .populate("leadCounsel", "name email")
      .populate("matter", "title clientName matterNumber")
      .sort({ createdAt: -1 });

    res.json({ cases });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

const getCaseById = async (req, res) => {
  try {
    const caseFile = await CaseFile.findById(req.params.id)
      .populate("leadCounsel", "name email")
      .populate("matter", "title clientName matterNumber");

    if (!caseFile) {
      return res.status(404).json({ message: "Case file not found" });
    }

    const [documents, tasks] = await Promise.all([
      Document.find({ caseFile: caseFile._id })
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 }),
      Task.find({ caseFile: caseFile._id })
        .select("title status dueDate matter")
        .populate("matter", "title clientName")
        .lean(),
    ]);

    res.json({ caseFile, documents, tasks });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

const createCase = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.title = normalizeString(payload.title);
    payload.matter = normalizeObjectId(payload.matter);

    if (!payload.matter) {
      throw buildHttpError("Matter reference is required.");
    }

    if (!payload.title) {
      throw buildHttpError("Case title is required.");
    }

    const matter = await Matter.findById(payload.matter).select("_id");
    if (!matter) {
      throw buildHttpError("Referenced matter could not be found.");
    }

    const caseFile = await CaseFile.create(payload);
    const populatedCase = await CaseFile.findById(caseFile._id)
      .populate("leadCounsel", "name email")
      .populate("matter", "title clientName matterNumber");

    res.status(201).json({
      message: "Case file created successfully",
      caseFile: populatedCase,
    });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

const updateCase = async (req, res) => {
  try {
    const caseFile = await CaseFile.findById(req.params.id);

    if (!caseFile) {
      return res.status(404).json({ message: "Case file not found" });
    }

    const updates = { ...req.body };

    if (updates.title !== undefined) {
      updates.title = normalizeString(updates.title);
      if (!updates.title) {
        throw buildHttpError("Case title is required.");
      }
    }

    if (updates.matter !== undefined) {
      updates.matter = normalizeObjectId(updates.matter);
      const currentMatterId = caseFile.matter?.toString();

      if (!updates.matter) {
        throw buildHttpError("Matter reference is required.");
      }

      if (updates.matter !== currentMatterId) {
        const matter = await Matter.findById(updates.matter).select("_id");
        if (!matter) {
          throw buildHttpError("Referenced matter could not be found.");
        }
      }
    }

    Object.assign(caseFile, updates);
    await caseFile.save();

    const populatedCase = await CaseFile.findById(caseFile._id)
      .populate("leadCounsel", "name email")
      .populate("matter", "title clientName matterNumber");

    res.json({
      message: "Case file updated successfully",
      caseFile: populatedCase,
    });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

const deleteCase = async (req, res) => {
  try {
    const caseFile = await CaseFile.findById(req.params.id);

    if (!caseFile) {
      return res.status(404).json({ message: "Case file not found" });
    }

    const documents = await Document.find({ caseFile: caseFile._id }).select("_id");
    const documentIds = documents.map((document) => document._id);

    await Promise.all([
      Task.updateMany(
        { caseFile: caseFile._id },
        { $unset: { caseFile: "" } }
      ),
      Task.updateMany(
        { relatedDocuments: { $in: documentIds } },
        { $pull: { relatedDocuments: { $in: documentIds } } }
      ),
      Document.updateMany(
        { caseFile: caseFile._id },
        { $unset: { caseFile: "" } }
      ),
    ]);

    await caseFile.deleteOne();

    res.json({ message: "Case file deleted successfully" });
  } catch (error) {
    handleErrorResponse(res, error);
  }
};

module.exports = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
};