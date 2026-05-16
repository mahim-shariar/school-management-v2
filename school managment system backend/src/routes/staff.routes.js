const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Staff = require("../models/Staff.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const schema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required(),
  designation: Joi.string().trim().min(1).max(100).required(),
  department: Joi.string().trim().max(100).allow(""),
  email: Joi.string().trim().lowercase().email().allow(""),
  phone: Joi.string().trim().max(30).allow(""),
  bio: Joi.string().trim().max(2000).allow(""),
  photo_url: Joi.string().trim().max(500).allow(""),
  qualifications: Joi.array().items(Joi.string().trim().max(100)).default([]),
  years_of_experience: Joi.number().integer().min(0).default(0),
  joined_date: Joi.date().allow(null),
  is_principal: Joi.boolean().default(false),
  is_vice_principal: Joi.boolean().default(false),
  is_department_head: Joi.boolean().default(false),
  display_order: Joi.number().integer().default(100),
  is_public: Joi.boolean().default(true),
});

const updateSchema = schema.fork(["name", "designation"], (s) => s.optional()).min(1);

function serialize(s) {
  return {
    id: s._id,
    name: s.name,
    designation: s.designation,
    department: s.department,
    email: s.email,
    phone: s.phone,
    bio: s.bio,
    photo_url: s.photoUrl,
    qualifications: s.qualifications || [],
    years_of_experience: s.yearsOfExperience,
    joined_date: s.joinedDate,
    is_principal: s.isPrincipal,
    is_vice_principal: s.isVicePrincipal,
    is_department_head: s.isDepartmentHead,
    display_order: s.displayOrder,
    is_public: s.isPublic,
    created_at: s.createdAt,
  };
}

function mapPayload(body) {
  const map = {
    photo_url: "photoUrl",
    years_of_experience: "yearsOfExperience",
    joined_date: "joinedDate",
    is_principal: "isPrincipal",
    is_vice_principal: "isVicePrincipal",
    is_department_head: "isDepartmentHead",
    display_order: "displayOrder",
    is_public: "isPublic",
  };
  const out = {};
  for (const [k, v] of Object.entries(body)) {
    out[map[k] || k] = v;
  }
  return out;
}

router.get("/", authenticate, authorize("admin"), async (_req, res, next) => {
  try {
    const list = await Staff.find({}).sort({ displayOrder: 1, name: 1 });
    return res.json(list.map(serialize));
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticate, authorize("admin"), validate(schema), async (req, res, next) => {
  try {
    // Enforce only one principal at a time
    if (req.body.is_principal) await Staff.updateMany({ isPrincipal: true }, { isPrincipal: false });
    if (req.body.is_vice_principal) await Staff.updateMany({ isVicePrincipal: true }, { isVicePrincipal: false });

    const doc = await Staff.create(mapPayload(req.body));
    return res.status(201).json(serialize(doc));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", authenticate, authorize("admin"), validate(updateSchema), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    if (req.body.is_principal) await Staff.updateMany({ _id: { $ne: req.params.id }, isPrincipal: true }, { isPrincipal: false });
    if (req.body.is_vice_principal) await Staff.updateMany({ _id: { $ne: req.params.id }, isVicePrincipal: true }, { isVicePrincipal: false });

    const doc = await Staff.findByIdAndUpdate(req.params.id, mapPayload(req.body), { new: true });
    if (!doc) return res.status(404).json({ error: "Staff not found." });
    return res.json(serialize(doc));
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const deleted = await Staff.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Staff not found." });
    return res.json({ message: "Staff deleted." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
