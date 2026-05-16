const express = require("express");
const Joi = require("joi");

const Attendance = require("../models/Attendance.model");
const ParentChild = require("../models/ParentChild.model");
const User = require("../models/User.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────
const toDateOnly = (d) => {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

const buildSummary = (records) => {
  const present = records.filter((r) => r.status === "Present").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const late = records.filter((r) => r.status === "Late").length;
  const total = records.length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  return { present, absent, late, total, percentage };
};

// ── Validation ────────────────────────────────────────────────────────────────
const markAttendanceSchema = Joi.object({
  date: Joi.date().iso().max("now").required(),
  classLevel: Joi.number().integer().min(1).max(12).required(),
  section: Joi.string().uppercase().trim().max(2).required(),
  records: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.string().hex().length(24).required(),
        status: Joi.string().valid("Present", "Absent", "Late").required(),
      })
    )
    .min(1)
    .required(),
});

// ── POST /api/attendance/mark/ ────────────────────────────────────────────────
router.post(
  "/mark/",
  authenticate,
  authorize("admin", "teacher"),
  validate(markAttendanceSchema),
  async (req, res, next) => {
    try {
      const { date, records } = req.body;
      const attendanceDate = toDateOnly(date);

      const ops = records.map(({ studentId, status }) => ({
        updateOne: {
          filter: { student: studentId, date: attendanceDate },
          update: { $set: { status, markedBy: req.user._id } },
          upsert: true,
        },
      }));

      const result = await Attendance.bulkWrite(ops, { ordered: false });

      return res.json({
        message: `Attendance saved for ${records.length} student(s).`,
        upserted: result.upsertedCount,
        modified: result.modifiedCount,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/attendance/my/?month=5&year=2026 ─────────────────────────────────
router.get("/my/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    const filter = { student: req.user._id };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(filter).sort({ date: 1 });
    const summary = buildSummary(records);

    return res.json({
      records: records.map((r) => ({ date: r.date.toISOString().slice(0, 10), status: r.status })),
      summary,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/attendance/children/:childId/ ────────────────────────────────────
router.get("/children/:childId/", authenticate, authorize("parent"), async (req, res, next) => {
  try {
    const { childId } = req.params;

    // Verify parent-child link
    const link = await ParentChild.findOne({ parent: req.user._id, child: childId });
    if (!link) {
      return res.status(403).json({ error: "You are not linked to this student." });
    }

    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

    const filter = { student: childId };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const records = await Attendance.find(filter).sort({ date: 1 });
    const summary = buildSummary(records);

    return res.json({
      records: records.map((r) => ({ date: r.date.toISOString().slice(0, 10), status: r.status })),
      summary,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/attendance/section/:classLevel/:section/?date=2026-05-16 ─────────
router.get(
  "/section/:classLevel/:section/",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res, next) => {
    try {
      const classLevel = parseInt(req.params.classLevel, 10);
      const section = req.params.section.toUpperCase();
      const dateStr = req.query.date;

      if (!dateStr) return res.status(400).json({ error: "date query param is required (YYYY-MM-DD)." });

      const attendanceDate = toDateOnly(dateStr);

      // Get all students in the section
      const students = await User.find({
        role: "student",
        "studentProfile.classLevel": classLevel,
        "studentProfile.section": section,
      })
        .select("firstName lastName studentProfile")
        .sort({ "studentProfile.rollNumber": 1 });

      if (!students.length) {
        return res.status(404).json({ error: "No students found in this section." });
      }

      const studentIds = students.map((s) => s._id);
      const attendanceRecords = await Attendance.find({
        student: { $in: studentIds },
        date: attendanceDate,
      });

      const attendanceMap = {};
      attendanceRecords.forEach((r) => { attendanceMap[r.student.toString()] = r.status; });

      const result = students.map((s) => ({
        student_id: s._id,
        roll_number: s.studentProfile?.rollNumber,
        student_name: `${s.firstName} ${s.lastName}`.trim(),
        status: attendanceMap[s._id.toString()] || null,
      }));

      return res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/attendance/report/?class_level=9&section=A&month=5&year=2026 ─────
router.get("/report/", authenticate, authorize("admin", "teacher"), async (req, res, next) => {
  try {
    const classLevel = parseInt(req.query.class_level, 10);
    const section = (req.query.section || "").trim().toUpperCase();
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);

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

    if (!students.length) {
      return res.status(404).json({ error: "No students found in this section." });
    }

    const studentIds = students.map((s) => s._id);

    const filter = { student: { $in: studentIds } };
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }

    const allAttendance = await Attendance.find(filter);

    // Group by student
    const grouped = {};
    allAttendance.forEach((r) => {
      const id = r.student.toString();
      if (!grouped[id]) grouped[id] = [];
      grouped[id].push(r.status);
    });

    const report = students.map((s) => {
      const statuses = grouped[s._id.toString()] || [];
      const present = statuses.filter((st) => st === "Present").length;
      const absent = statuses.filter((st) => st === "Absent").length;
      const late = statuses.filter((st) => st === "Late").length;
      const total = statuses.length;
      const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
      return {
        student_id: s._id,
        roll_number: s.studentProfile?.rollNumber,
        student_name: `${s.firstName} ${s.lastName}`.trim(),
        present,
        absent,
        late,
        total_days: total,
        percentage,
      };
    });

    return res.json(report);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
