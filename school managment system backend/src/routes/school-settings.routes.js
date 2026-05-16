const express = require("express");
const Joi = require("joi");

const SchoolSettings = require("../models/SchoolSettings.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const updateSchema = Joi.object({
  school_name: Joi.string().trim().max(200),
  school_code: Joi.string().trim().max(50).allow(""),
  address: Joi.string().trim().max(500).allow(""),
  phone: Joi.string().trim().max(30).allow(""),
  email: Joi.string().trim().max(150).allow(""),
  website: Joi.string().trim().max(200).allow(""),
  logo_url: Joi.string().trim().max(500).allow(""),
  current_academic_year: Joi.string().trim().max(20),
  academic_year_start: Joi.date().allow(null),
  academic_year_end: Joi.date().allow(null),
  currency: Joi.string().trim().max(10),
  working_days: Joi.array().items(Joi.number().integer().min(0).max(6)),
  periods_per_day: Joi.number().integer().min(1).max(12),
  class_start_time: Joi.string().trim().pattern(/^\d{2}:\d{2}$/),
  class_end_time: Joi.string().trim().pattern(/^\d{2}:\d{2}$/),
  country: Joi.string().trim().max(100).allow(""),
}).min(1);

function serialize(s) {
  return {
    id: s._id,
    school_name: s.schoolName,
    school_code: s.schoolCode,
    address: s.address,
    phone: s.phone,
    email: s.email,
    website: s.website,
    logo_url: s.logoUrl,
    current_academic_year: s.currentAcademicYear,
    academic_year_start: s.academicYearStart,
    academic_year_end: s.academicYearEnd,
    currency: s.currency,
    working_days: s.workingDays,
    periods_per_day: s.periodsPerDay,
    class_start_time: s.classStartTime,
    class_end_time: s.classEndTime,
    country: s.country,
  };
}

async function getOrCreate() {
  let s = await SchoolSettings.findOne({});
  if (!s) s = await SchoolSettings.create({});
  return s;
}

// GET /api/school/settings/ — any auth user
router.get("/", authenticate, async (_req, res, next) => {
  try {
    const s = await getOrCreate();
    return res.json(serialize(s));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/school/settings/ — admin updates
router.patch("/", authenticate, authorize("admin"), validate(updateSchema), async (req, res, next) => {
  try {
    const s = await getOrCreate();
    const map = {
      school_name: "schoolName",
      school_code: "schoolCode",
      address: "address",
      phone: "phone",
      email: "email",
      website: "website",
      logo_url: "logoUrl",
      current_academic_year: "currentAcademicYear",
      academic_year_start: "academicYearStart",
      academic_year_end: "academicYearEnd",
      currency: "currency",
      working_days: "workingDays",
      periods_per_day: "periodsPerDay",
      class_start_time: "classStartTime",
      class_end_time: "classEndTime",
      country: "country",
    };
    for (const [k, v] of Object.entries(req.body)) {
      if (map[k]) s[map[k]] = v;
    }
    await s.save();
    return res.json(serialize(s));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
