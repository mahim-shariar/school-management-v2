const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const marksRoutes = require("./routes/marks.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const resultsRoutes = require("./routes/results.routes");
const examRoutes = require("./routes/exam.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const subjectRoutes = require("./routes/subject.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const teacherClassRoutes = require("./routes/teacher-class.routes");
const timetableRoutes = require("./routes/timetable.routes");
const feeRoutes = require("./routes/fee.routes");
const noticeRoutes = require("./routes/notice.routes");
const eventRoutes = require("./routes/event.routes");
const leaveRoutes = require("./routes/leave.routes");
const libraryRoutes = require("./routes/library.routes");
const transportRoutes = require("./routes/transport.routes");
const examScheduleRoutes = require("./routes/exam-schedule.routes");
const schoolSettingsRoutes = require("./routes/school-settings.routes");
const syllabusRoutes = require("./routes/syllabus.routes");
const publicRoutes = require("./routes/public.routes");
const staffRoutes = require("./routes/staff.routes");
const galleryRoutes = require("./routes/gallery.routes");
const achievementRoutes = require("./routes/achievement.routes");

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000")
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/results", resultsRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/teacher-classes", teacherClassRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/transport", transportRoutes);
app.use("/api/exam-schedules", examScheduleRoutes);
app.use("/api/school/settings", schoolSettingsRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/achievements", achievementRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found." }));

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error." : err.message;
  res.status(status).json({ error: message });
});

module.exports = app;
