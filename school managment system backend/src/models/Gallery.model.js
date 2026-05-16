const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    caption: { type: String, trim: true, default: "", maxlength: 500 },
    imageUrl: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["Campus", "Events", "Sports", "Cultural", "Academic", "Other"],
      default: "Campus",
    },
    displayOrder: { type: Number, default: 100 },
    isPublic: { type: Boolean, default: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

gallerySchema.index({ category: 1, displayOrder: 1 });

module.exports = mongoose.model("Gallery", gallerySchema);
