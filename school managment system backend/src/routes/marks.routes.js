const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Mark = require("../models/Mark.model");
const User = require("../models/User.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const singleMarkSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
  examId: Joi.number().integer().min(1).required(),
  subjectId: Joi.string().hex().length(24).required(),
  marksWritten: Joi.number().min(0).max(75).default(0),
  marksMcq: Joi.number().min(0).max(25).default(0),
  marksPractical: Joi.number().min(0).max(25).default(0),
});

const bulkMarkItemSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
  marksWritten: Joi.number().min(0).max(75).default(0),
  marksMcq: Joi.number().min(0).max(25).default(0),
  marksPractical: Joi.number().min(0).max(25).default(0),
});

const bulkMarksBodySchema = Joi.array().items(bulkMarkItemSchema).min(1).max(200);

// ── GET /api/marks/bulk/?class_level=9&section=A ──────────────────────────────
// Returns list of students for marks entry
router.get(
  "/bulk/",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res, next) => {
    try {
      const classLevel = parseInt(req.query.class_level, 10);
      const section = (req.query.section || "").trim().toUpperCase();

      if (!classLevel || !section) {
        return res.status(400).json({ error: "class_level and section are required." });
      }

      const students = await User.find({
        role: "student",
        "studentProfile.classLevel": classLevel,
        "studentProfile.section": section,
      })
        .select("firstName lastName studentProfile")
        .sort({ "studentProfile.rollNumber": 1 });

      const result = students.map((s) => ({
        id: s._id,
        roll_number: s.studentProfile?.rollNumber,
        full_name: `${s.firstName} ${s.lastName}`.trim(),
      }));

      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/marks/ — single mark entry ──────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorize("admin", "teacher"),
  validate(singleMarkSchema),
  async (req, res, next) => {
    try {
      const { studentId, examId, subjectId, marksWritten, marksMcq, marksPractical } = req.body;

      const student = await User.findOne({ _id: studentId, role: "student" });
      if (!student) return res.status(404).json({ error: "Student not found." });

      const mark = await Mark.findOneAndUpdate(
        { student: studentId, exam: examId, subject: subjectId },
        { marksWritten, marksMcq, marksPractical, submittedBy: req.user._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(201).json({
        message: "Mark saved.",
        mark: {
          id: mark._id,
          studentId: mark.student,
          examId: mark.exam,
          subjectId: mark.subject,
          marksWritten: mark.marksWritten,
          marksMcq: mark.marksMcq,
          marksPractical: mark.marksPractical,
          totalMarks: mark.marksWritten + mark.marksMcq + mark.marksPractical,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/marks/bulk/?exam_id=1&subject_id=<objectId> ─────────────────────
router.post(
  "/bulk/",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res, next) => {
    try {
      const examId = parseInt(req.query.exam_id, 10);
      const subjectId = req.query.subject_id;

      if (!examId || !subjectId || !mongoose.Types.ObjectId.isValid(subjectId)) {
        return res.status(400).json({ error: "exam_id and valid subject_id (ObjectId) are required." });
      }

      const { error, value: records } = bulkMarksBodySchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });
      if (error) {
        return res.status(400).json({ error: "Validation failed.", details: error.message });
      }

      const ops = records.map(({ studentId, marksWritten, marksMcq, marksPractical }) => ({
        updateOne: {
          filter: { student: studentId, exam: examId, subject: subjectId },
          update: {
            $set: { marksWritten, marksMcq, marksPractical, submittedBy: req.user._id },
          },
          upsert: true,
        },
      }));

      const result = await Mark.bulkWrite(ops, { ordered: false });

      return res.json({
        message: `Marks saved for ${records.length} student(s).`,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
