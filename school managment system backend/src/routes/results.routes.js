const express = require("express");

const Mark = require("../models/Mark.model");
const Exam = require("../models/Exam.model");
const Subject = require("../models/Subject.model");
const User = require("../models/User.model");
const ParentChild = require("../models/ParentChild.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const { calculateGrade, gpaToLetter } = require("../utils/grading");

const router = express.Router();

// ── Shared helper — compute per-student result from marks array ───────────────
const computeStudentResult = (marks, subjects) => {
  const subjectMap = {};
  subjects.forEach((s) => { subjectMap[s._id.toString()] = s.label; });

  let totalMarksAll = 0;
  const subjectResults = [];
  const gpas = [];

  marks.forEach((m) => {
    const total = m.marksWritten + m.marksMcq + m.marksPractical;
    const hasPractical = m.marksPractical > 0;
    const { gpa, letterGrade } = calculateGrade(total, hasPractical);
    totalMarksAll += total;
    gpas.push(gpa);
    subjectResults.push({
      subject_id: m.subject.toString(),
      subject_name: subjectMap[m.subject.toString()] || String(m.subject),
      marks_written: m.marksWritten,
      marks_mcq: m.marksMcq,
      marks_practical: m.marksPractical,
      total_marks: total,
      letter_grade: letterGrade,
      gpa,
    });
  });

  const avgGpa = gpas.length > 0
    ? parseFloat((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2))
    : 0;
  const isPassed = gpas.length > 0 && gpas.every((g) => g > 0);
  const overallLetterGrade = gpaToLetter(avgGpa);

  return {
    subjectResults,
    total_marks: Math.round(totalMarksAll * 100) / 100,
    gpa: avgGpa,
    letter_grade: overallLetterGrade,
    is_passed: isPassed,
  };
};

// ── GET /api/results/:examId/my/ ──────────────────────────────────────────────
router.get("/:examId/my/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!examId) return res.status(400).json({ error: "Invalid exam ID." });

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found." });

    const marks = await Mark.find({ student: req.user._id, exam: examId });
    if (!marks.length) {
      return res.json({ exam_id: examId, exam_label: exam.label, subjects: [], message: "No results yet." });
    }

    const classLevel = req.user.studentProfile?.classLevel;
    const subjects = classLevel
      ? await Subject.find({ classLevel })
      : await Subject.find({});

    const { subjectResults, total_marks, gpa, letter_grade, is_passed } = computeStudentResult(marks, subjects);

    return res.json({
      exam_id: examId,
      exam_label: exam.label,
      subjects: subjectResults,
      total_marks,
      gpa,
      letter_grade,
      is_passed,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/results/:examId/children/:childId/ — parent views child result ──
router.get("/:examId/children/:childId/", authenticate, authorize("parent"), async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!examId) return res.status(400).json({ error: "Invalid exam ID." });

    const link = await ParentChild.findOne({ parent: req.user._id, child: req.params.childId });
    if (!link) return res.status(403).json({ error: "Not authorized for this child." });

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found." });

    const child = await User.findById(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found." });

    const marks = await Mark.find({ student: child._id, exam: examId });
    if (!marks.length) {
      return res.json({ exam_id: examId, exam_label: exam.label, subjects: [], message: "No results yet." });
    }

    const classLevel = child.studentProfile?.classLevel;
    const subjects = classLevel
      ? await Subject.find({ classLevel })
      : await Subject.find({});

    const { subjectResults, total_marks, gpa, letter_grade, is_passed } = computeStudentResult(marks, subjects);

    return res.json({
      exam_id: examId,
      exam_label: exam.label,
      subjects: subjectResults,
      total_marks,
      gpa,
      letter_grade,
      is_passed,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/results/:examId/section/:classLevel/:section/ ────────────────────
router.get(
  "/:examId/section/:classLevel/:section/",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res, next) => {
    try {
      const examId = parseInt(req.params.examId, 10);
      const classLevel = parseInt(req.params.classLevel, 10);
      const section = req.params.section.toUpperCase();

      const exam = await Exam.findById(examId);
      if (!exam) return res.status(404).json({ error: "Exam not found." });

      const students = await User.find({
        role: "student",
        "studentProfile.classLevel": classLevel,
        "studentProfile.section": section,
      }).select("firstName lastName studentProfile");

      if (!students.length) {
        return res.status(404).json({ error: "No students found in this section." });
      }

      const studentIds = students.map((s) => s._id);
      const allMarks = await Mark.find({ exam: examId, student: { $in: studentIds } });
      const subjects = await Subject.find({ classLevel });

      const marksByStudent = {};
      allMarks.forEach((m) => {
        const id = m.student.toString();
        if (!marksByStudent[id]) marksByStudent[id] = [];
        marksByStudent[id].push(m);
      });

      const studentMap = {};
      students.forEach((s) => { studentMap[s._id.toString()] = s; });

      const rows = studentIds
        .filter((id) => marksByStudent[id.toString()]?.length > 0)
        .map((id) => {
          const s = studentMap[id.toString()];
          const { total_marks, gpa, letter_grade, is_passed } = computeStudentResult(
            marksByStudent[id.toString()],
            subjects
          );
          return {
            student_name: `${s.firstName} ${s.lastName}`.trim(),
            roll_number: s.studentProfile?.rollNumber,
            total_marks,
            gpa,
            letter_grade,
            is_passed,
          };
        });

      rows.sort((a, b) => b.total_marks - a.total_marks);
      rows.forEach((r, i) => { r.class_position = i + 1; });

      return res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/results/:examId/merit-list/ ─────────────────────────────────────
router.get("/:examId/merit-list/", authenticate, async (req, res, next) => {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!examId) return res.status(400).json({ error: "Invalid exam ID." });

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ error: "Exam not found." });

    const allMarks = await Mark.find({ exam: examId }).populate(
      "student",
      "firstName lastName studentProfile"
    );

    const subjects = await Subject.find({});

    const grouped = {};
    allMarks.forEach((m) => {
      const id = m.student._id.toString();
      if (!grouped[id]) grouped[id] = { student: m.student, marks: [] };
      grouped[id].marks.push(m);
    });

    const rows = Object.values(grouped).map(({ student, marks }) => {
      const { total_marks, gpa, letter_grade, is_passed } = computeStudentResult(marks, subjects);
      return {
        student_name: `${student.firstName} ${student.lastName}`.trim(),
        class_level: student.studentProfile?.classLevel,
        section: student.studentProfile?.section,
        total_marks,
        gpa,
        letter_grade,
        is_passed,
      };
    });

    rows.sort((a, b) => b.total_marks - a.total_marks);
    rows.forEach((r, i) => { r.class_position = i + 1; });

    return res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
