const mongoose = require("mongoose");

// One document per class+section+day+period slot
const timetableSchema = new mongoose.Schema(
  {
    classLevel: { type: Number, required: true, min: 1, max: 12 },
    section: { type: String, required: true, uppercase: true, trim: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=Sun, 1=Mon … 6=Sat
    periodNumber: { type: Number, required: true, min: 1, max: 10 },
    startTime: { type: String, required: true, trim: true }, // "08:00"
    endTime: { type: String, required: true, trim: true },   // "08:45"
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    roomNumber: { type: String, trim: true, default: "" },
    isBreak: { type: Boolean, default: false },
    breakLabel: { type: String, trim: true, default: "" }, // "Tiffin Break", "Lunch"
  },
  { timestamps: true }
);

timetableSchema.index(
  { classLevel: 1, section: 1, dayOfWeek: 1, periodNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
