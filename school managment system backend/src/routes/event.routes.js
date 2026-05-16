const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Event = require("../models/Event.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const eventSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow(""),
  event_type: Joi.string()
    .valid("Holiday", "Exam", "Sports", "Cultural", "Meeting", "Vacation", "Other")
    .required(),
  start_date: Joi.date().required(),
  end_date: Joi.date().required(),
  is_holiday: Joi.boolean().default(false),
  target_roles: Joi.array()
    .items(Joi.string().valid("student", "teacher", "parent", "admin"))
    .default(["student", "teacher", "parent", "admin"]),
});

function serialize(e) {
  return {
    id: e._id,
    title: e.title,
    description: e.description,
    event_type: e.eventType,
    start_date: e.startDate,
    end_date: e.endDate,
    is_holiday: e.isHoliday,
    target_roles: e.targetRoles,
    created_at: e.createdAt,
  };
}

// GET /api/events/ — any auth user; optional month/year filter
router.get("/", authenticate, async (req, res, next) => {
  try {
    const q = { targetRoles: req.user.role };
    if (req.query.year) {
      const year = Number(req.query.year);
      const month = req.query.month ? Number(req.query.month) - 1 : null;
      if (month !== null) {
        q.startDate = {
          $gte: new Date(year, month, 1),
          $lt: new Date(year, month + 1, 1),
        };
      } else {
        q.startDate = {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        };
      }
    }
    const list = await Event.find(q).sort({ startDate: 1 }).limit(500);
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

// POST /api/events/ — admin creates
router.post("/", authenticate, authorize("admin"), validate(eventSchema), async (req, res, next) => {
  try {
    const doc = await Event.create({
      title: req.body.title,
      description: req.body.description || "",
      eventType: req.body.event_type,
      startDate: req.body.start_date,
      endDate: req.body.end_date,
      isHoliday: req.body.is_holiday,
      targetRoles: req.body.target_roles,
      createdBy: req.user._id,
    });
    return res.status(201).json(serialize(doc));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id
router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const deleted = await Event.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Event not found." });
    return res.json({ message: "Event deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
