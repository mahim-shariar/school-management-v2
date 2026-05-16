const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true, maxlength: 20 },
    label: { type: String, required: true, trim: true, maxlength: 100 },
    classLevel: { type: Number, required: true, min: 6, max: 10 },
  },
  { timestamps: false }
);

subjectSchema.index({ code: 1, classLevel: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
