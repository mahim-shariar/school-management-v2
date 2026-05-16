const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const ExamSchedule = require("../models/ExamSchedule.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const scheduleSchema = Joi.object({
  exam_id: Joi.number().integer().required(),
  subject_id: Joi.string().hex().length(24).required(),
  class_level: Joi.number().integer().min(1).max(12).required(),
  section: Joi.string().trim().uppercase().max(2).allow(null, ""),
  exam_date: Joi.date().required(),
  start_time: Joi.string().trim().pattern(/^\d{2}:\d{2}$/).required(),
  end_time: Joi.string().trim().pattern(/^\d{2}:\d{2}$/).required(),
  room_number: Joi.string().trim().max(20).allow(""),
  total_marks: Joi.number().min(0).default(100),
  invigilator_id: Joi.string().hex().length(24).allow(null, ""),
});

function serialize(e) {
  return {
    id: e._id,
    exam_id: e.exam,
    subject_id: e.subject?._id || e.subject,
    subject_label: e.subject?.label || null,
    subject_code: e.subject?.code || null,
    class_level: e.classLevel,
    section: e.section,
    exam_date: e.examDate,
    start_time: e.startTime,
    end_time: e.endTime,
    room_number: e.roomNumber,
    total_marks: e.totalMarks,
    invigilator_id: e.invigilator?._id || e.invigilator,
    invigilator_name: e.invigilator?.firstName
      ? `${e.invigilator.firstName} ${e.invigilator.lastName}`.trim()
      : null,
  };
}

// GET /api/exam-schedules/?exam_id=&class_level=
router.get("/", authenticate, async (req, res, next) => {
  try {
    const q = {};
    if (req.query.exam_id) q.exam = Number(req.query.exam_id);
    if (req.query.class_level) q.classLevel = Number(req.query.class_level);
    if (req.query.section) q.section = req.query.section.toUpperCase();

    if (req.user.role === "student") {
      const p = req.user.studentProfile;
      if (p) q.classLevel = p.classLevel;
    }

    const list = await ExamSchedule.find(q)
      .populate("subject", "code label")
      .populate("invigilator", "firstName lastName")
      .sort({ examDate: 1, startTime: 1 });
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

// POST /api/exam-schedules/
router.post("/", authenticate, authorize("admin"), validate(scheduleSchema), async (req, res, next) => {
  try {
    const doc = await ExamSchedule.findOneAndUpdate(
      {
        exam: req.body.exam_id,
        subject: req.body.subject_id,
        classLevel: req.body.class_level,
      },
      {
        exam: req.body.exam_id,
        subject: req.body.subject_id,
        classLevel: req.body.class_level,
        section: req.body.section || null,
        examDate: req.body.exam_date,
        startTime: req.body.start_time,
        endTime: req.body.end_time,
        roomNumber: req.body.room_number || "",
        totalMarks: req.body.total_marks || 100,
        invigilator: req.body.invigilator_id || null,
      },
      { upsert: true, new: true }
    );
    const populated = await ExamSchedule.findById(doc._id)
      .populate("subject", "code label")
      .populate("invigilator", "firstName lastName");
    return res.status(201).json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const deleted = await ExamSchedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Schedule not found." });
    return res.json({ message: "Schedule deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
