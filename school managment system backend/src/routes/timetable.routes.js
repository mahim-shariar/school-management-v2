const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Timetable = require("../models/Timetable.model");
const User = require("../models/User.model");
const Subject = require("../models/Subject.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const slotSchema = Joi.object({
  class_level: Joi.number().integer().min(1).max(12).required(),
  section: Joi.string().trim().uppercase().max(2).required(),
  day_of_week: Joi.number().integer().min(0).max(6).required(),
  period_number: Joi.number().integer().min(1).max(10).required(),
  start_time: Joi.string().trim().pattern(/^\d{2}:\d{2}$/).required(),
  end_time: Joi.string().trim().pattern(/^\d{2}:\d{2}$/).required(),
  subject_id: Joi.string().hex().length(24).allow(null, ""),
  teacher_id: Joi.string().hex().length(24).allow(null, ""),
  room_number: Joi.string().trim().max(20).allow(""),
  is_break: Joi.boolean().default(false),
  break_label: Joi.string().trim().max(50).allow(""),
});

function serialize(t) {
  return {
    id: t._id,
    class_level: t.classLevel,
    section: t.section,
    day_of_week: t.dayOfWeek,
    period_number: t.periodNumber,
    start_time: t.startTime,
    end_time: t.endTime,
    subject_id: t.subject?._id || t.subject,
    subject_label: t.subject?.label || null,
    teacher_id: t.teacher?._id || t.teacher,
    teacher_name: t.teacher?.firstName
      ? `${t.teacher.firstName} ${t.teacher.lastName}`.trim()
      : null,
    room_number: t.roomNumber,
    is_break: t.isBreak,
    break_label: t.breakLabel,
  };
}

// GET /api/timetable/?class_level=&section= — view class timetable (any auth user)
router.get("/", authenticate, async (req, res, next) => {
  try {
    const q = {};
    if (req.query.class_level) q.classLevel = Number(req.query.class_level);
    if (req.query.section) q.section = req.query.section.toUpperCase();

    if (req.user.role === "student") {
      const p = req.user.studentProfile;
      if (!p) return res.status(404).json({ error: "Student profile not found." });
      q.classLevel = p.classLevel;
      q.section = p.section;
    }

    const slots = await Timetable.find(q)
      .populate("subject", "code label")
      .populate("teacher", "firstName lastName")
      .sort({ dayOfWeek: 1, periodNumber: 1 });
    return res.json(slots.map(serialize));
  } catch (err) {
    next(err);
  }
});

// GET /api/timetable/my-schedule/ — teacher's own teaching schedule
router.get("/my-schedule/", authenticate, authorize("teacher"), async (req, res, next) => {
  try {
    const slots = await Timetable.find({ teacher: req.user._id })
      .populate("subject", "code label")
      .sort({ dayOfWeek: 1, periodNumber: 1 });
    return res.json(slots.map(serialize));
  } catch (err) {
    next(err);
  }
});

// POST /api/timetable/ — admin creates or updates a slot
router.post("/", authenticate, authorize("admin"), validate(slotSchema), async (req, res, next) => {
  try {
    const body = req.body;

    if (body.subject_id) {
      const subj = await Subject.findById(body.subject_id);
      if (!subj) return res.status(404).json({ error: "Subject not found." });
    }
    if (body.teacher_id) {
      const t = await User.findOne({ _id: body.teacher_id, role: "teacher" });
      if (!t) return res.status(404).json({ error: "Teacher not found." });
    }

    const doc = await Timetable.findOneAndUpdate(
      {
        classLevel: body.class_level,
        section: body.section,
        dayOfWeek: body.day_of_week,
        periodNumber: body.period_number,
      },
      {
        classLevel: body.class_level,
        section: body.section,
        dayOfWeek: body.day_of_week,
        periodNumber: body.period_number,
        startTime: body.start_time,
        endTime: body.end_time,
        subject: body.subject_id || null,
        teacher: body.teacher_id || null,
        roomNumber: body.room_number || "",
        isBreak: !!body.is_break,
        breakLabel: body.break_label || "",
      },
      { upsert: true, new: true }
    );

    const populated = await Timetable.findById(doc._id)
      .populate("subject", "code label")
      .populate("teacher", "firstName lastName");
    return res.status(201).json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/timetable/:id — admin deletes a slot
router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const deleted = await Timetable.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Slot not found." });
    return res.json({ message: "Slot removed." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
