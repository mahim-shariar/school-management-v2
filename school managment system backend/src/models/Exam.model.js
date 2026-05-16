const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    _id: { type: Number },
    label: { type: String, required: true, trim: true },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
  // NOTE: do NOT pass { _id: false } — defining _id explicitly in the schema
  // body is sufficient for Mongoose to use the numeric _id as primary key.
);

module.exports = mongoose.model("Exam", examSchema);
