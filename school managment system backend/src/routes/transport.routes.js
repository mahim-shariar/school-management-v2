const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const { TransportRoute, StudentTransport } = require("../models/Transport.model");
const User = require("../models/User.model");
const ParentChild = require("../models/ParentChild.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const stopSchema = Joi.object({
  stop_name: Joi.string().trim().required(),
  pickup_time: Joi.string().trim().allow(""),
  drop_time: Joi.string().trim().allow(""),
  fare: Joi.number().min(0).default(0),
});

const routeSchema = Joi.object({
  route_name: Joi.string().trim().min(1).max(100).required(),
  vehicle_number: Joi.string().trim().max(50).allow(""),
  driver_name: Joi.string().trim().max(100).allow(""),
  driver_phone: Joi.string().trim().max(20).allow(""),
  capacity: Joi.number().integer().min(0).default(0),
  stops: Joi.array().items(stopSchema).default([]),
  is_active: Joi.boolean().default(true),
});

const assignSchema = Joi.object({
  student_id: Joi.string().hex().length(24).required(),
  route_id: Joi.string().hex().length(24).required(),
  stop_name: Joi.string().trim().allow(""),
});

function serializeRoute(r) {
  return {
    id: r._id,
    route_name: r.routeName,
    vehicle_number: r.vehicleNumber,
    driver_name: r.driverName,
    driver_phone: r.driverPhone,
    capacity: r.capacity,
    stops: r.stops.map((s) => ({
      stop_name: s.stopName,
      pickup_time: s.pickupTime,
      drop_time: s.dropTime,
      fare: s.fare,
    })),
    is_active: r.isActive,
  };
}

function serializeAssignment(a) {
  return {
    id: a._id,
    student_id: a.student?._id || a.student,
    student_name: a.student?.firstName
      ? `${a.student.firstName} ${a.student.lastName}`.trim()
      : null,
    route_id: a.route?._id || a.route,
    route_name: a.route?.routeName || null,
    stop_name: a.stopName,
  };
}

// Routes management
router.get("/routes/", authenticate, async (_req, res, next) => {
  try {
    const list = await TransportRoute.find({}).sort({ routeName: 1 });
    return res.json(list.map(serializeRoute));
  } catch (err) {
    next(err);
  }
});

router.post("/routes/", authenticate, authorize("admin"), validate(routeSchema), async (req, res, next) => {
  try {
    const r = await TransportRoute.create({
      routeName: req.body.route_name,
      vehicleNumber: req.body.vehicle_number || "",
      driverName: req.body.driver_name || "",
      driverPhone: req.body.driver_phone || "",
      capacity: req.body.capacity || 0,
      stops: (req.body.stops || []).map((s) => ({
        stopName: s.stop_name,
        pickupTime: s.pickup_time || "",
        dropTime: s.drop_time || "",
        fare: s.fare || 0,
      })),
      isActive: req.body.is_active,
    });
    return res.status(201).json(serializeRoute(r));
  } catch (err) {
    next(err);
  }
});

router.delete("/routes/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const assigned = await StudentTransport.countDocuments({ route: req.params.id });
    if (assigned > 0) return res.status(400).json({ error: "Cannot delete — students assigned to this route." });
    await TransportRoute.findByIdAndDelete(req.params.id);
    return res.json({ message: "Route deleted." });
  } catch (err) {
    next(err);
  }
});

// Assignments
router.post("/assignments/", authenticate, authorize("admin"), validate(assignSchema), async (req, res, next) => {
  try {
    const student = await User.findOne({ _id: req.body.student_id, role: "student" });
    if (!student) return res.status(404).json({ error: "Student not found." });
    const route = await TransportRoute.findById(req.body.route_id);
    if (!route) return res.status(404).json({ error: "Route not found." });

    const doc = await StudentTransport.findOneAndUpdate(
      { student: student._id },
      {
        student: student._id,
        route: route._id,
        stopName: req.body.stop_name || "",
        assignedBy: req.user._id,
      },
      { upsert: true, new: true }
    );
    const populated = await StudentTransport.findById(doc._id)
      .populate("student", "firstName lastName")
      .populate("route", "routeName");
    return res.status(201).json(serializeAssignment(populated));
  } catch (err) {
    next(err);
  }
});

router.get("/assignments/", authenticate, authorize("admin"), async (_req, res, next) => {
  try {
    const list = await StudentTransport.find({})
      .populate("student", "firstName lastName")
      .populate("route", "routeName");
    return res.json(list.map(serializeAssignment));
  } catch (err) {
    next(err);
  }
});

// My transport (student/parent)
router.get("/my/", authenticate, async (req, res, next) => {
  try {
    let studentId = null;
    if (req.user.role === "student") studentId = req.user._id;
    else if (req.user.role === "parent") {
      if (!req.query.child_id) return res.status(400).json({ error: "child_id required." });
      const link = await ParentChild.findOne({ parent: req.user._id, child: req.query.child_id });
      if (!link) return res.status(403).json({ error: "Not authorized for this child." });
      studentId = req.query.child_id;
    } else {
      return res.json(null);
    }
    const t = await StudentTransport.findOne({ student: studentId })
      .populate("student", "firstName lastName")
      .populate("route", "routeName vehicleNumber driverName driverPhone stops");
    if (!t) return res.json(null);
    return res.json({
      ...serializeAssignment(t),
      route_details: t.route ? serializeRoute(t.route) : null,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/assignments/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    await StudentTransport.findByIdAndDelete(req.params.id);
    return res.json({ message: "Assignment removed." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
