const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Leave = require("../models/Leave.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const applySchema = Joi.object({
  leave_type: Joi.string().valid("Sick", "Personal", "Family", "Medical", "Other").required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  reason: Joi.string().trim().min(3).max(1000).required(),
});

const reviewSchema = Joi.object({
  status: Joi.string().valid("Approved", "Rejected").required(),
  review_note: Joi.string().trim().max(500).allow(""),
});

function serialize(l) {
  return {
    id: l._id,
    applicant_id: l.applicant?._id || l.applicant,
    applicant_name: l.applicant?.firstName
      ? `${l.applicant.firstName} ${l.applicant.lastName}`.trim()
      : null,
    applicant_role: l.applicantRole,
    class_level: l.applicant?.studentProfile?.classLevel || null,
    section: l.applicant?.studentProfile?.section || null,
    leave_type: l.leaveType,
    start_date: l.startDate,
    end_date: l.endDate,
    reason: l.reason,
    status: l.status,
    reviewed_by: l.reviewedBy?._id || l.reviewedBy,
    reviewed_by_name: l.reviewedBy?.firstName
      ? `${l.reviewedBy.firstName} ${l.reviewedBy.lastName}`.trim()
      : null,
    reviewed_at: l.reviewedAt,
    review_note: l.reviewNote,
    created_at: l.createdAt,
  };
}

// POST /api/leaves/ — student or teacher applies
router.post("/", authenticate, authorize("student", "teacher"), validate(applySchema), async (req, res, next) => {
  try {
    const doc = await Leave.create({
      applicant: req.user._id,
      applicantRole: req.user.role,
      leaveType: req.body.leave_type,
      startDate: req.body.start_date,
      endDate: req.body.end_date,
      reason: req.body.reason,
    });
    return res.status(201).json(serialize(doc));
  } catch (err) {
    next(err);
  }
});

// GET /api/leaves/my/ — applicant's own leave history
router.get("/my/", authenticate, authorize("student", "teacher"), async (req, res, next) => {
  try {
    const list = await Leave.find({ applicant: req.user._id }).sort({ createdAt: -1 });
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

// GET /api/leaves/ — admin/teacher views; admin sees all, teacher sees student leaves
router.get("/", authenticate, authorize("admin", "teacher"), async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.role) q.applicantRole = req.query.role;
    if (req.user.role === "teacher") q.applicantRole = "student";

    const list = await Leave.find(q)
      .populate("applicant", "firstName lastName studentProfile teacherProfile")
      .populate("reviewedBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/leaves/:id/review/ — admin or teacher reviews
router.patch("/:id/review/", authenticate, authorize("admin", "teacher"), validate(reviewSchema), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const l = await Leave.findById(req.params.id);
    if (!l) return res.status(404).json({ error: "Leave not found." });

    if (req.user.role === "teacher" && l.applicantRole !== "student") {
      return res.status(403).json({ error: "Teachers can only review student leaves." });
    }

    l.status = req.body.status;
    l.reviewedBy = req.user._id;
    l.reviewedAt = new Date();
    l.reviewNote = req.body.review_note || "";
    await l.save();

    const populated = await Leave.findById(l._id)
      .populate("applicant", "firstName lastName studentProfile teacherProfile")
      .populate("reviewedBy", "firstName lastName");
    return res.json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
