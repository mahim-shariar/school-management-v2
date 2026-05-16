const express = require("express");
const Joi = require("joi");

const Subject = require("../models/Subject.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const createSchema = Joi.object({
  code: Joi.string().trim().uppercase().alphanum().min(2).max(20).required(),
  label: Joi.string().trim().min(2).max(100).required(),
  classLevel: Joi.number().integer().min(6).max(10).required(),
});

// GET /api/subjects/?class_level=9
router.get("/", authenticate, async (req, res, next) => {
  try {
    const classLevel = parseInt(req.query.class_level, 10);
    if (!classLevel || classLevel < 6 || classLevel > 10) {
      return res.status(400).json({ error: "class_level (6–10) is required." });
    }
    const subjects = await Subject.find({ classLevel }).sort({ label: 1 });
    return res.json(
      subjects.map((s) => ({ id: s._id, code: s.code, label: s.label, class_level: s.classLevel }))
    );
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects/ — admin only
router.post("/", authenticate, authorize("admin"), validate(createSchema), async (req, res, next) => {
  try {
    const { code, label, classLevel } = req.body;
    const existing = await Subject.findOne({ code, classLevel });
    if (existing) {
      return res.status(409).json({ error: "A subject with this code already exists for this class level." });
    }
    const subject = await Subject.create({ code, label, classLevel });
    return res.status(201).json({
      id: subject._id,
      code: subject.code,
      label: subject.label,
      class_level: subject.classLevel,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subjects/:id — admin only
router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ error: "Subject not found." });
    return res.json({ message: "Subject deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
