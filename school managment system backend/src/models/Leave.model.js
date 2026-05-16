const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    applicantRole: { type: String, enum: ["student", "teacher"], required: true },
    leaveType: {
      type: String,
      required: true,
      enum: ["Sick", "Personal", "Family", "Medical", "Other"],
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

leaveSchema.index({ applicant: 1, status: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Leave", leaveSchema);
