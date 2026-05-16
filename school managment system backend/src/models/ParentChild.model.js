const mongoose = require("mongoose");

const parentChildSchema = new mongoose.Schema(
  {
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    child: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

parentChildSchema.index({ parent: 1, child: 1 }, { unique: true });
parentChildSchema.index({ parent: 1 });
parentChildSchema.index({ child: 1 });

module.exports = mongoose.model("ParentChild", parentChildSchema);
