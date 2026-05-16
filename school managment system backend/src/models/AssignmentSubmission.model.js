const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submittedAt: { type: Date, default: null },
    status: { type: String, enum: ["Pending", "Submitted", "Graded"], default: "Pending" },
    marks: { type: Number, default: null, min: 0, max: 100 },
    feedback: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
submissionSchema.index({ student: 1 });

module.exports = mongoose.model("AssignmentSubmission", submissionSchema);
