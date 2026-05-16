const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Gallery = require("../models/Gallery.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const schema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  caption: Joi.string().trim().max(500).allow(""),
  image_url: Joi.string().trim().min(1).max(800).required(),
  category: Joi.string().valid("Campus", "Events", "Sports", "Cultural", "Academic", "Other").default("Campus"),
  display_order: Joi.number().integer().default(100),
  is_public: Joi.boolean().default(true),
});

function serialize(g) {
  return {
    id: g._id,
    title: g.title,
    caption: g.caption,
    image_url: g.imageUrl,
    category: g.category,
    display_order: g.displayOrder,
    is_public: g.isPublic,
    created_at: g.createdAt,
  };
}

router.get("/", authenticate, authorize("admin"), async (_req, res, next) => {
  try {
    const list = await Gallery.find({}).sort({ displayOrder: 1, createdAt: -1 });
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticate, authorize("admin"), validate(schema), async (req, res, next) => {
  try {
    const doc = await Gallery.create({
      title: req.body.title,
      caption: req.body.caption || "",
      imageUrl: req.body.image_url,
      category: req.body.category,
      displayOrder: req.body.display_order,
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
    const deleted = await Gallery.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Item not found." });
    return res.json({ message: "Gallery item deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
