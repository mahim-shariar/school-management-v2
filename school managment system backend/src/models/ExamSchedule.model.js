const mongoose = require("mongoose");

const examScheduleSchema = new mongoose.Schema(
  {
    exam: { type: Number, ref: "Exam", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    classLevel: { type: Number, required: true, min: 1, max: 12 },
    section: { type: String, uppercase: true, trim: true, default: null },
    examDate: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    roomNumber: { type: String, trim: true, default: "" },
    totalMarks: { type: Number, default: 100 },
    invigilator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

examScheduleSchema.index({ exam: 1, classLevel: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("ExamSchedule", examScheduleSchema);
