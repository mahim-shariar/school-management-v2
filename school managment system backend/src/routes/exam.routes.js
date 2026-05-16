const express = require("express");

const Exam = require("../models/Exam.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

const router = express.Router();

// ── POST /api/exams/:examId/publish/ ─────────────────────────────────────────
router.post("/:examId/publish/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    const exam = await Exam.findByIdAndUpdate(
      examId,
      { isPublished: true },
      { new: true }
    );
    if (!exam) return res.status(404).json({ error: "Exam not found." });
    return res.json({ message: `${exam.label} results published.`, exam });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/exams/ — list all exams ─────────────────────────────────────────
router.get("/", authenticate, async (req, res, next) => {
  try {
    const exams = await Exam.find({}).sort({ _id: 1 });
    return res.json(exams);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
