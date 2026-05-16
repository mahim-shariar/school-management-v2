const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Syllabus = require("../models/Syllabus.model");
const Subject = require("../models/Subject.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const chapterJoi = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(1000).allow(""),
  weeks: Joi.number().integer().min(0).default(0),
});

const createSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  class_level: Joi.number().integer().min(1).max(12).required(),
  subject_id: Joi.string().hex().length(24).allow(null, ""),
  academic_year: Joi.string().trim().min(1).max(20).required(),
  description: Joi.string().trim().max(5000).allow(""),
  chapters: Joi.array().items(chapterJoi).default([]),
  file_url: Joi.string().trim().max(500).allow(""),
});

const updateSchema = createSchema.fork(
  ["title", "class_level", "academic_year"],
  (s) => s.optional()
);

function serialize(s) {
  return {
    id: s._id,
    title: s.title,
    class_level: s.classLevel,
    subject_id: s.subject?._id || s.subject,
    subject_label: s.subject?.label || null,
    subject_code: s.subject?.code || null,
    academic_year: s.academicYear,
    description: s.description,
    chapters: s.chapters || [],
    file_url: s.fileUrl,
    created_by_name: s.createdBy?.firstName
      ? `${s.createdBy.firstName} ${s.createdBy.lastName}`.trim()
      : null,
    created_at: s.createdAt,
    updated_at: s.updatedAt,
  };
}

// GET /api/syllabus/?class_level=&subject_id=&academic_year=
router.get("/", authenticate, async (req, res, next) => {
  try {
    const q = {};
    if (req.query.class_level) q.classLevel = Number(req.query.class_level);
    if (req.query.academic_year) q.academicYear = req.query.academic_year;
    if (req.query.subject_id && mongoose.Types.ObjectId.isValid(req.query.subject_id)) {
      q.subject = req.query.subject_id;
    }

    const list = await Syllabus.find(q)
      .populate("subject", "code label classLevel")
      .populate("createdBy", "firstName lastName")
      .sort({ academicYear: -1, classLevel: 1 });
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

// GET /api/syllabus/years/ — list all distinct academic years
router.get("/years/", authenticate, async (_req, res, next) => {
  try {
    const years = await Syllabus.distinct("academicYear");
    return res.json(years.sort().reverse());
  } catch (err) {
    next(err);
  }
});

// GET /api/syllabus/:id
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const s = await Syllabus.findById(req.params.id)
      .populate("subject", "code label classLevel")
      .populate("createdBy", "firstName lastName");
    if (!s) return res.status(404).json({ error: "Syllabus not found." });
    return res.json(serialize(s));
  } catch (err) {
    next(err);
  }
});

// POST /api/syllabus/ — admin creates
router.post("/", authenticate, authorize("admin"), validate(createSchema), async (req, res, next) => {
  try {
    if (req.body.subject_id) {
      const subj = await Subject.findById(req.body.subject_id);
      if (!subj) return res.status(404).json({ error: "Subject not found." });
      if (subj.classLevel !== req.body.class_level) {
        return res.status(400).json({ error: "Subject does not belong to this class level." });
      }
    }
    const doc = await Syllabus.create({
      title: req.body.title,
      classLevel: req.body.class_level,
      subject: req.body.subject_id || null,
      academicYear: req.body.academic_year,
      description: req.body.description || "",
      chapters: req.body.chapters || [],
      fileUrl: req.body.file_url || "",
      createdBy: req.user._id,
    });
    const populated = await Syllabus.findById(doc._id)
      .populate("subject", "code label classLevel")
      .populate("createdBy", "firstName lastName");
    return res.status(201).json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/syllabus/:id — admin updates
router.patch("/:id", authenticate, authorize("admin"), validate(updateSchema), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const s = await Syllabus.findById(req.params.id);
    if (!s) return res.status(404).json({ error: "Syllabus not found." });

    const map = {
      title: "title",
      class_level: "classLevel",
      subject_id: "subject",
      academic_year: "academicYear",
      description: "description",
      chapters: "chapters",
      file_url: "fileUrl",
    };
    for (const [k, v] of Object.entries(req.body)) {
      if (map[k] !== undefined) {
        s[map[k]] = k === "subject_id" ? v || null : v;
      }
    }
    await s.save();
    const populated = await Syllabus.findById(s._id)
      .populate("subject", "code label classLevel")
      .populate("createdBy", "firstName lastName");
    return res.json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/syllabus/:id
router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const deleted = await Syllabus.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Syllabus not found." });
    return res.json({ message: "Syllabus deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
