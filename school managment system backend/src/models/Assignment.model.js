const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    classLevel: { type: Number, required: true, min: 6, max: 10 },
    section: { type: String, uppercase: true, trim: true, default: null },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    dueDate: { type: Date, required: true },
    weekNumber: { type: Number, required: true, min: 1, max: 52 },
    year: { type: Number, required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

assignmentSchema.index({ classLevel: 1, section: 1, year: 1, weekNumber: 1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
