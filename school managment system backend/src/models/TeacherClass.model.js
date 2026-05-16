const mongoose = require("mongoose");

const teacherClassSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    classLevel: { type: Number, required: true, min: 1, max: 12 },
    section: { type: String, uppercase: true, trim: true, default: null },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    isClassTeacher: { type: Boolean, default: false },
  },
  { timestamps: true }
);

teacherClassSchema.index({ teacher: 1, classLevel: 1, section: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model("TeacherClass", teacherClassSchema);
