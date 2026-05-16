const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Assignment = require("../models/Assignment.model");
const AssignmentSubmission = require("../models/AssignmentSubmission.model");
const User = require("../models/User.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const createSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().max(2000).allow("").default(""),
  classLevel: Joi.number().integer().min(6).max(10).required(),
  section: Joi.string().trim().uppercase().length(1).allow(null, "").default(null),
  subjectId: Joi.string().hex().length(24).allow(null, "").default(null),
  dueDate: Joi.date().iso().required(),
  weekNumber: Joi.number().integer().min(1).max(52).required(),
  year: Joi.number().integer().min(2020).max(2100).required(),
});

// ── Static routes first (before /:id) ────────────────────────────────────────

// GET /api/assignments/my/ — student views their class assignments with submission status
router.get("/my/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const { classLevel, section } = req.user.studentProfile || {};
    if (!classLevel) return res.json([]);

    const assignments = await Assignment.find({
      classLevel,
      $or: [{ section: null }, { section }],
    })
      .sort({ dueDate: 1 })
      .populate("subject", "code label")
      .populate("assignedBy", "firstName lastName");

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds },
      student: req.user._id,
    });

    const subMap = {};
    submissions.forEach((s) => { subMap[s.assignment.toString()] = s; });

    const result = assignments.map((a) => {
      const sub = subMap[a._id.toString()];
      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        class_level: a.classLevel,
        section: a.section,
        subject: a.subject
          ? { id: a.subject._id, code: a.subject.code, label: a.subject.label }
          : null,
        due_date: a.dueDate,
        week_number: a.weekNumber,
        year: a.year,
        assigned_by: a.assignedBy
          ? `${a.assignedBy.firstName} ${a.assignedBy.lastName}`.trim()
          : "Unknown",
        status: sub?.status || "Pending",
        submitted_at: sub?.submittedAt || null,
        marks: sub?.marks ?? null,
        feedback: sub?.feedback || "",
      };
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/assignments/stats/my/ — student assignment completion stats for progress page
router.get("/stats/my/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const { classLevel, section } = req.user.studentProfile || {};
    if (!classLevel) {
      return res.json({ total: 0, submitted: 0, pending: 0, graded: 0, completion_rate: 0 });
    }

    const assignments = await Assignment.find({
      classLevel,
      $or: [{ section: null }, { section }],
    });
    const total = assignments.length;

    if (total === 0) {
      return res.json({ total: 0, submitted: 0, pending: 0, graded: 0, completion_rate: 0 });
    }

    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      student: req.user._id,
    });

    const submitted = submissions.filter((s) => s.status === "Submitted" || s.status === "Graded").length;
    const graded = submissions.filter((s) => s.status === "Graded").length;
    const pending = total - submitted;
    const completion_rate = parseFloat(((submitted / total) * 100).toFixed(1));

    return res.json({ total, submitted, pending, graded, completion_rate });
  } catch (err) {
    next(err);
  }
});

// GET /api/assignments/stats/children/:childId/ — parent views child's assignment stats
router.get("/stats/children/:childId/", authenticate, authorize("parent"), async (req, res, next) => {
  try {
    const ParentChild = require("../models/ParentChild.model");
    const User = require("../models/User.model");

    const link = await ParentChild.findOne({ parent: req.user._id, child: req.params.childId });
    if (!link) return res.status(403).json({ error: "Not authorized for this child." });

    const child = await User.findById(req.params.childId);
    if (!child?.studentProfile) {
      return res.json({ total: 0, submitted: 0, pending: 0, graded: 0, completion_rate: 0 });
    }
    const { classLevel, section } = child.studentProfile;

    const assignments = await Assignment.find({
      classLevel,
      $or: [{ section: null }, { section }],
    });
    const total = assignments.length;
    if (total === 0) {
      return res.json({ total: 0, submitted: 0, pending: 0, graded: 0, completion_rate: 0 });
    }

    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignments.map((a) => a._id) },
      student: child._id,
    });

    const submitted = submissions.filter((s) => s.status === "Submitted" || s.status === "Graded").length;
    const graded = submissions.filter((s) => s.status === "Graded").length;
    const pending = total - submitted;
    const completion_rate = parseFloat(((submitted / total) * 100).toFixed(1));

    return res.json({ total, submitted, pending, graded, completion_rate });
  } catch (err) {
    next(err);
  }
});

// ── Dynamic routes (/:id) ─────────────────────────────────────────────────────

// GET /api/assignments/ — teacher/admin views assignments with filters
router.get("/", authenticate, authorize("teacher", "admin"), async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.class_level) filter.classLevel = parseInt(req.query.class_level, 10);
    if (req.query.section) filter.section = req.query.section.toUpperCase();
    if (req.query.year) filter.year = parseInt(req.query.year, 10);
    if (req.query.week) filter.weekNumber = parseInt(req.query.week, 10);

    const assignments = await Assignment.find(filter)
      .sort({ createdAt: -1 })
      .populate("subject", "code label")
      .populate("assignedBy", "firstName lastName");

    return res.json(
      assignments.map((a) => ({
        _id: a._id,
        title: a.title,
        description: a.description,
        class_level: a.classLevel,
        section: a.section,
        subject: a.subject
          ? { id: a.subject._id, code: a.subject.code, label: a.subject.label }
          : null,
        due_date: a.dueDate,
        week_number: a.weekNumber,
        year: a.year,
        assigned_by: a.assignedBy
          ? `${a.assignedBy.firstName} ${a.assignedBy.lastName}`.trim()
          : "Unknown",
        created_at: a.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/assignments/ — teacher/admin creates assignment
router.post("/", authenticate, authorize("teacher", "admin"), validate(createSchema), async (req, res, next) => {
  try {
    const { title, description, classLevel, section, subjectId, dueDate, weekNumber, year } = req.body;
    const assignment = await Assignment.create({
      title,
      description,
      classLevel,
      section: section || null,
      subject: subjectId || null,
      dueDate,
      weekNumber,
      year,
      assignedBy: req.user._id,
    });
    await assignment.populate("subject", "code label");
    return res.status(201).json({
      _id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      class_level: assignment.classLevel,
      section: assignment.section,
      subject: assignment.subject
        ? { id: assignment.subject._id, code: assignment.subject.code, label: assignment.subject.label }
        : null,
      due_date: assignment.dueDate,
      week_number: assignment.weekNumber,
      year: assignment.year,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/assignments/:id/submit/ — student submits
router.post("/:id/submit/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid assignment ID." });
    }
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found." });

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: req.params.id, student: req.user._id },
      { status: "Submitted", submittedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.json({ message: "Submitted successfully.", status: submission.status });
  } catch (err) {
    next(err);
  }
});

// GET /api/assignments/:id/submissions/ — teacher/admin views all student submissions
router.get("/:id/submissions/", authenticate, authorize("teacher", "admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid assignment ID." });
    }
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found." });

    const studentFilter = {
      role: "student",
      "studentProfile.classLevel": assignment.classLevel,
    };
    if (assignment.section) studentFilter["studentProfile.section"] = assignment.section;

    const students = await User.find(studentFilter)
      .select("firstName lastName studentProfile")
      .sort({ "studentProfile.rollNumber": 1 });

    const submissions = await AssignmentSubmission.find({ assignment: req.params.id });
    const subMap = {};
    submissions.forEach((s) => { subMap[s.student.toString()] = s; });

    const result = students.map((s) => {
      const sub = subMap[s._id.toString()];
      return {
        student_id: s._id,
        student_name: `${s.firstName} ${s.lastName}`.trim(),
        roll_number: s.studentProfile?.rollNumber,
        section: s.studentProfile?.section,
        status: sub?.status || "Pending",
        submitted_at: sub?.submittedAt || null,
        marks: sub?.marks ?? null,
        feedback: sub?.feedback || "",
        submission_id: sub?._id || null,
      };
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/assignments/:id/submissions/:subId/ — teacher grades a submission
router.patch("/:id/submissions/:subId/", authenticate, authorize("teacher", "admin"), async (req, res, next) => {
  try {
    const { marks, feedback } = req.body;
    const submission = await AssignmentSubmission.findById(req.params.subId);
    if (!submission) return res.status(404).json({ error: "Submission not found." });

    if (marks !== undefined && marks !== null) submission.marks = marks;
    if (feedback !== undefined) submission.feedback = feedback;
    submission.status = "Graded";
    await submission.save();

    return res.json({ message: "Graded successfully.", submission });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
