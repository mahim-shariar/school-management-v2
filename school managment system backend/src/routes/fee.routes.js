const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const Fee = require("../models/Fee.model");
const User = require("../models/User.model");
const ParentChild = require("../models/ParentChild.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const createSchema = Joi.object({
  student_id: Joi.string().hex().length(24).required(),
  fee_type: Joi.string().valid("Tuition", "Exam", "Library", "Transport", "Sports", "Lab", "Other").required(),
  amount: Joi.number().min(0).required(),
  month: Joi.number().integer().min(1).max(12).allow(null),
  year: Joi.number().integer().min(2000).max(2100).required(),
  due_date: Joi.date().required(),
  remarks: Joi.string().trim().max(500).allow(""),
});

const bulkSchema = Joi.object({
  class_level: Joi.number().integer().min(1).max(12).required(),
  section: Joi.string().trim().uppercase().max(2).allow(null, ""),
  fee_type: Joi.string().valid("Tuition", "Exam", "Library", "Transport", "Sports", "Lab", "Other").required(),
  amount: Joi.number().min(0).required(),
  month: Joi.number().integer().min(1).max(12).allow(null),
  year: Joi.number().integer().min(2000).max(2100).required(),
  due_date: Joi.date().required(),
});

const paySchema = Joi.object({
  paid_amount: Joi.number().min(0).required(),
  payment_method: Joi.string().trim().max(50).required(),
  transaction_id: Joi.string().trim().max(100).allow(""),
  remarks: Joi.string().trim().max(500).allow(""),
});

function serialize(f) {
  return {
    id: f._id,
    student_id: f.student?._id || f.student,
    student_name: f.student?.firstName
      ? `${f.student.firstName} ${f.student.lastName}`.trim()
      : null,
    roll_number: f.student?.studentProfile?.rollNumber || null,
    class_level: f.student?.studentProfile?.classLevel || null,
    section: f.student?.studentProfile?.section || null,
    fee_type: f.feeType,
    amount: f.amount,
    month: f.month,
    year: f.year,
    due_date: f.dueDate,
    status: f.status,
    paid_at: f.paidAt,
    paid_amount: f.paidAmount,
    payment_method: f.paymentMethod,
    transaction_id: f.transactionId,
    remarks: f.remarks,
    created_at: f.createdAt,
  };
}

function applyOverdue(fee) {
  if (fee.status === "Unpaid" && new Date(fee.dueDate) < new Date()) {
    fee.status = "Overdue";
  }
  return fee;
}

// GET /api/fees/my/ — student views own fees
router.get("/my/", authenticate, authorize("student"), async (req, res, next) => {
  try {
    const fees = await Fee.find({ student: req.user._id }).sort({ dueDate: -1 });
    fees.forEach(applyOverdue);
    return res.json(fees.map(serialize));
  } catch (err) {
    next(err);
  }
});

// GET /api/fees/children/:childId/ — parent views child fees
router.get("/children/:childId/", authenticate, authorize("parent"), async (req, res, next) => {
  try {
    const link = await ParentChild.findOne({ parent: req.user._id, child: req.params.childId });
    if (!link) return res.status(403).json({ error: "Not authorized for this child." });
    const fees = await Fee.find({ student: req.params.childId }).sort({ dueDate: -1 });
    fees.forEach(applyOverdue);
    return res.json(fees.map(serialize));
  } catch (err) {
    next(err);
  }
});

// GET /api/fees/ — admin lists all fees with filters
router.get("/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const q = {};
    if (req.query.student_id) q.student = req.query.student_id;
    if (req.query.status) q.status = req.query.status;
    if (req.query.fee_type) q.feeType = req.query.fee_type;
    if (req.query.year) q.year = Number(req.query.year);
    if (req.query.month) q.month = Number(req.query.month);

    let fees = await Fee.find(q)
      .populate("student", "firstName lastName studentProfile")
      .sort({ dueDate: -1 })
      .limit(500);

    if (req.query.class_level || req.query.section) {
      const cl = req.query.class_level ? Number(req.query.class_level) : null;
      const sec = req.query.section ? req.query.section.toUpperCase() : null;
      fees = fees.filter((f) => {
        const p = f.student?.studentProfile;
        if (!p) return false;
        if (cl !== null && p.classLevel !== cl) return false;
        if (sec !== null && p.section !== sec) return false;
        return true;
      });
    }

    fees.forEach(applyOverdue);
    return res.json(fees.map(serialize));
  } catch (err) {
    next(err);
  }
});

// POST /api/fees/ — admin creates fee record for one student
router.post("/", authenticate, authorize("admin"), validate(createSchema), async (req, res, next) => {
  try {
    const fee = await Fee.create({
      student: req.body.student_id,
      feeType: req.body.fee_type,
      amount: req.body.amount,
      month: req.body.month || null,
      year: req.body.year,
      dueDate: req.body.due_date,
      remarks: req.body.remarks || "",
      createdBy: req.user._id,
    });
    const populated = await Fee.findById(fee._id).populate(
      "student",
      "firstName lastName studentProfile"
    );
    return res.status(201).json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

// POST /api/fees/bulk/ — admin assigns a fee to entire class+section
router.post("/bulk/", authenticate, authorize("admin"), validate(bulkSchema), async (req, res, next) => {
  try {
    const q = { role: "student", "studentProfile.classLevel": req.body.class_level };
    if (req.body.section) q["studentProfile.section"] = req.body.section;
    const students = await User.find(q);
    if (!students.length) return res.status(404).json({ error: "No students found." });

    const docs = students.map((s) => ({
      student: s._id,
      feeType: req.body.fee_type,
      amount: req.body.amount,
      month: req.body.month || null,
      year: req.body.year,
      dueDate: req.body.due_date,
      createdBy: req.user._id,
    }));
    const inserted = await Fee.insertMany(docs);
    return res.status(201).json({ created: inserted.length });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/fees/:id/pay/ — admin marks fee as paid
router.patch("/:id/pay/", authenticate, authorize("admin"), validate(paySchema), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ error: "Fee not found." });

    fee.paidAmount = req.body.paid_amount;
    fee.paymentMethod = req.body.payment_method;
    fee.transactionId = req.body.transaction_id || "";
    fee.remarks = req.body.remarks || fee.remarks;
    fee.paidAt = new Date();
    fee.status = "Paid";
    await fee.save();

    const populated = await Fee.findById(fee._id).populate(
      "student",
      "firstName lastName studentProfile"
    );
    return res.json(serialize(populated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/fees/:id — admin deletes
router.delete("/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const deleted = await Fee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Fee not found." });
    return res.json({ message: "Fee deleted." });
  } catch (err) {
    next(err);
  }
});

// GET /api/fees/stats/ — admin fee dashboard
router.get("/stats/", authenticate, authorize("admin"), async (_req, res, next) => {
  try {
    const all = await Fee.find({});
    let totalDue = 0,
      totalPaid = 0,
      paidCount = 0,
      unpaidCount = 0,
      overdueCount = 0;
    const now = new Date();
    all.forEach((f) => {
      totalDue += f.amount;
      if (f.status === "Paid") {
        totalPaid += f.paidAmount;
        paidCount++;
      } else if (f.dueDate < now) {
        overdueCount++;
      } else {
        unpaidCount++;
      }
    });
    return res.json({
      total_records: all.length,
      total_due: totalDue,
      total_paid: totalPaid,
      total_outstanding: totalDue - totalPaid,
      paid_count: paidCount,
      unpaid_count: unpaidCount,
      overdue_count: overdueCount,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
