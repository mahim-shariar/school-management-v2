const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    category: {
      type: String,
      enum: ["Academic", "Sports", "Cultural", "Science", "Award", "Other"],
      default: "Academic",
    },
    achievedOn: { type: Date, required: true },
    awardedBy: { type: String, trim: true, default: "" },
    iconUrl: { type: String, trim: true, default: "" },
    isPublic: { type: Boolean, default: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

achievementSchema.index({ achievedOn: -1 });

module.exports = mongoose.model("Achievement", achievementSchema);
