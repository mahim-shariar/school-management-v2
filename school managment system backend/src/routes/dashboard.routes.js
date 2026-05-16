const express = require("express");

const User = require("../models/User.model");
const Attendance = require("../models/Attendance.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

// ── GET /api/dashboard/stats/ ─────────────────────────────────────────────────
router.get("/stats/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const [totalStudents, totalTeachers, totalParents, totalAdmins] = await Promise.all([
      User.countDocuments({ role: "student", isActive: true }),
      User.countDocuments({ role: "teacher", isActive: true }),
      User.countDocuments({ role: "parent", isActive: true }),
      User.countDocuments({ role: "admin", isActive: true }),
    ]);

    // Attendance rate for the current month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [presentCount, totalCount] = await Promise.all([
      Attendance.countDocuments({
        date: { $gte: monthStart, $lt: monthEnd },
        status: { $in: ["Present", "Late"] },
      }),
      Attendance.countDocuments({ date: { $gte: monthStart, $lt: monthEnd } }),
    ]);

    const attendanceRate = totalCount > 0
      ? ((presentCount / totalCount) * 100).toFixed(1)
      : "0.0";

    return res.json({
      totalStudents,
      totalTeachers,
      totalParents,
      totalAdmins,
      attendanceRate,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
