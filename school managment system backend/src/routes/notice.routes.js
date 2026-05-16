const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Notice = require("../models/Notice.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const noticeSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  content: Joi.string().trim().min(1).max(5000).required(),
  category: Joi.string()
    .valid("General", "Academic", "Exam", "Fee", "Holiday", "Event", "Emergency")
    .default("General"),
  priority: Joi.string().valid("normal", "important", "urgent").default("normal"),
  is_pinned: Joi.boolean().default(false),
  target_roles: Joi.array()
    .items(Joi.string().valid("student", "teacher", "parent", "admin"))
    .default(["student", "teacher", "parent", "admin"]),
  expires_at: Joi.date().allow(null),
});

function serialize(n) {
  return {
    id: n._id,
    title: n.title,
    content: n.content,
    category: n.category,
    priority: n.priority,
    is_pinned: n.isPinned,
    target_roles: n.targetRoles,
    published_at: n.publishedAt,
    expires_at: n.expiresAt,
    created_by: n.createdBy?._id || n.createdBy,
    created_by_name: n.createdBy?.firstName
      ? `${n.createdBy.firstName} ${n.createdBy.lastName}`.trim()
      : null,
    created_at: n.createdAt,
  };
}

// GET /api/notices/ — any auth user sees notices targeted at their role
router.get("/", authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    const list = await Notice.find({
      targetRoles: req.user.role,
      $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
    })
      .populate("createdBy", "firstName lastName")
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(200);
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

// POST /api/notices/ — admin or teacher creates
router.post("/", authenticate, authorize("admin", "teacher"), validate(noticeSchema), async (req, res, next) => {
  try {
    const doc = await Notice.create({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      priority: req.body.priority,
      isPinned: req.body.is_pinned,
      targetRoles: req.body.target_roles,
      expiresAt: req.body.expires_at || null,
      createdBy: req.user._id,
    });
    const populated = await Notice.findById(doc._id).populate("createdBy", "firstName lastName");
    return res.status(201).json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notices/:id/pin/ — admin toggles pin
router.patch("/:id/pin/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const n = await Notice.findById(req.params.id);
    if (!n) return res.status(404).json({ error: "Notice not found." });
    n.isPinned = !n.isPinned;
    await n.save();
    const populated = await Notice.findById(n._id).populate("createdBy", "firstName lastName");
    return res.json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/notices/:id — admin or original poster
router.delete("/:id", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const n = await Notice.findById(req.params.id);
    if (!n) return res.status(404).json({ error: "Notice not found." });
    if (req.user.role !== "admin" && n.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden." });
    }
    await n.deleteOne();
    return res.json({ message: "Notice deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
