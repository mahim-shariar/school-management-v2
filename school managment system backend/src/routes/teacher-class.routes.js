const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const TeacherClass = require("../models/TeacherClass.model");
const User = require("../models/User.model");
const Subject = require("../models/Subject.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const assignSchema = Joi.object({
  teacher_id: Joi.string().hex().length(24).required(),
  class_level: Joi.number().integer().min(1).max(12).required(),
  section: Joi.string().trim().uppercase().max(2).allow(null, "").default(null),
  subject_id: Joi.string().hex().length(24).allow(null, "").default(null),
  is_class_teacher: Joi.boolean().default(false),
});

function serialize(tc) {
  return {
    id: tc._id,
    teacher_id: tc.teacher?._id || tc.teacher,
    teacher_name: tc.teacher?.firstName
      ? `${tc.teacher.firstName} ${tc.teacher.lastName}`.trim()
      : null,
    teacher_email: tc.teacher?.email || null,
    class_level: tc.classLevel,
    section: tc.section,
    subject_id: tc.subject?._id || tc.subject,
    subject_label: tc.subject?.label || null,
    subject_code: tc.subject?.code || null,
    is_class_teacher: tc.isClassTeacher,
  };
}

// GET /api/teacher-classes/ — admin lists all, teacher lists own
router.get("/", authenticate, async (req, res, next) => {
  try {
    const q = {};
    if (req.user.role === "teacher") q.teacher = req.user._id;
    if (req.user.role === "admin") {
      if (req.query.teacher_id) q.teacher = req.query.teacher_id;
      if (req.query.class_level) q.classLevel = Number(req.query.class_level);
      if (req.query.section) q.section = req.query.section.toUpperCase();
    }
    if (req.user.role !== "admin" && req.user.role !== "teacher") {
      return res.status(403).json({ error: "Forbidden." });
    }
    const list = await TeacherClass.find(q)
      .populate("teacher", "firstName lastName email")
      .populate("subject", "code label classLevel");
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher-classes/ — admin assigns teacher to class+subject
router.post("/", authenticate, authorize("admin"), validate(assignSchema), async (req, res, next) => {
  try {
    const { teacher_id, class_level, section, subject_id, is_class_teacher } = req.body;

    const teacher = await User.findOne({ _id: teacher_id, role: "teacher" });
    if (!teacher) return res.status(404).json({ error: "Teacher not found." });

    if (subject_id) {
      const subject = await Subject.findById(subject_id);
      if (!subject) return res.status(404).json({ error: "Subject not found." });
      if (subject.classLevel !== class_level) {
        return res.status(400).json({ error: "Subject does not belong to this class level." });
      }
    }

    const doc = await TeacherClass.findOneAndUpdate(
      {
        teacher: teacher_id,
        classLevel: class_level,
        section: section || null,
        subject: subject_id || null,
      },
      {
        teacher: teacher_id,
        classLevel: class_level,
        section: section || null,
        subject: subject_id || null,
        isClassTeacher: is_class_teacher,
      },
      { upsert: true, new: true }
    );

    const populated = await TeacherClass.findById(doc._id)
      .populate("teacher", "firstName lastName email")
      .populate("subject", "code label classLevel");

    return res.status(201).json(serialize(populated));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "This assignment already exists." });
    }
    next(err);
  }
});

// DELETE /api/teacher-classes/:id — admin removes assignment
router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const deleted = await TeacherClass.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Assignment not found." });
    return res.json({ message: "Assignment removed." });
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher-classes/teachers/ — admin lists all teachers (helper)
router.get("/teachers/", authenticate, authorize("admin"), async (_req, res, next) => {
  try {
    const teachers = await User.find({ role: "teacher", isActive: true }).select(
      "firstName lastName email teacherProfile"
    );
    return res.json(
      teachers.map((t) => ({
        id: t._id,
        name: `${t.firstName} ${t.lastName}`.trim(),
        email: t.email,
        employee_id: t.teacherProfile?.employeeId || "",
        department: t.teacherProfile?.department || "",
      }))
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
