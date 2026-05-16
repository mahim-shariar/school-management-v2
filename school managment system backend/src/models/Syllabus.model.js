const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    weeks: { type: Number, default: 0 },
  },
  { _id: false }
);

const syllabusSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    classLevel: { type: Number, required: true, min: 1, max: 12 },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    academicYear: { type: String, required: true, trim: true, maxlength: 20 },
    description: { type: String, trim: true, default: "", maxlength: 5000 },
    chapters: { type: [chapterSchema], default: [] },
    fileUrl: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

syllabusSchema.index({ academicYear: 1, classLevel: 1, subject: 1 });

module.exports = mongoose.model("Syllabus", syllabusSchema);
