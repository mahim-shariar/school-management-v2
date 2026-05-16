const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Achievement = require("../models/Achievement.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const schema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).allow(""),
  category: Joi.string().valid("Academic", "Sports", "Cultural", "Science", "Award", "Other").default("Academic"),
  achieved_on: Joi.date().required(),
  awarded_by: Joi.string().trim().max(200).allow(""),
  icon_url: Joi.string().trim().max(500).allow(""),
  is_public: Joi.boolean().default(true),
});

function serialize(a) {
  return {
    id: a._id,
    title: a.title,
    description: a.description,
    category: a.category,
    achieved_on: a.achievedOn,
    awarded_by: a.awardedBy,
    icon_url: a.iconUrl,
    is_public: a.isPublic,
    created_at: a.createdAt,
  };
}

router.get("/", authenticate, authorize("admin"), async (_req, res, next) => {
  try {
    const list = await Achievement.find({}).sort({ achievedOn: -1 });
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticate, authorize("admin"), validate(schema), async (req, res, next) => {
  try {
    const doc = await Achievement.create({
      title: req.body.title,
      description: req.body.description || "",
      category: req.body.category,
      achievedOn: req.body.achieved_on,
      awardedBy: req.body.awarded_by || "",
      iconUrl: req.body.icon_url || "",
      isPublic: req.body.is_public,
      addedBy: req.user._id,
    });
    return res.status(201).json(serialize(doc));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const deleted = await Achievement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Achievement not found." });
    return res.json({ message: "Achievement deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
