const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    category: {
      type: String,
      required: true,
      enum: ["General", "Academic", "Exam", "Fee", "Holiday", "Event", "Emergency"],
      default: "General",
    },
    priority: { type: String, enum: ["normal", "important", "urgent"], default: "normal" },
    isPinned: { type: Boolean, default: false },
    targetRoles: {
      type: [String],
      enum: ["student", "teacher", "parent", "admin"],
      default: ["student", "teacher", "parent", "admin"],
    },
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

noticeSchema.index({ createdAt: -1 });
noticeSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model("Notice", noticeSchema);
