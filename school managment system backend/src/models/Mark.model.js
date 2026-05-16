const mongoose = require("mongoose");

const markSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exam: { type: Number, ref: "Exam", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    marksWritten: { type: Number, default: 0, min: 0, max: 75 },
    marksMcq: { type: Number, default: 0, min: 0, max: 25 },
    marksPractical: { type: Number, default: 0, min: 0, max: 25 },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

markSchema.index({ student: 1, exam: 1, subject: 1 }, { unique: true });
markSchema.index({ exam: 1, subject: 1 });

markSchema.virtual("totalMarks").get(function () {
  return this.marksWritten + this.marksMcq + this.marksPractical;
});

module.exports = mongoose.model("Mark", markSchema);
