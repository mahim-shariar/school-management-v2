const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    designation: { type: String, required: true, trim: true, maxlength: 100 },
    department: { type: String, trim: true, default: "General", maxlength: 100 },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    bio: { type: String, trim: true, default: "", maxlength: 2000 },
    photoUrl: { type: String, trim: true, default: "" },
    qualifications: { type: [String], default: [] },
    yearsOfExperience: { type: Number, default: 0 },
    joinedDate: { type: Date, default: null },
    isPrincipal: { type: Boolean, default: false },
    isVicePrincipal: { type: Boolean, default: false },
    isDepartmentHead: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 100 },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

staffSchema.index({ displayOrder: 1, name: 1 });

module.exports = mongoose.model("Staff", staffSchema);
