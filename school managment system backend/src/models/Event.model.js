const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    eventType: {
      type: String,
      required: true,
      enum: ["Holiday", "Exam", "Sports", "Cultural", "Meeting", "Vacation", "Other"],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isHoliday: { type: Boolean, default: false },
    targetRoles: {
      type: [String],
      enum: ["student", "teacher", "parent", "admin"],
      default: ["student", "teacher", "parent", "admin"],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1 });

module.exports = mongoose.model("Event", eventSchema);
