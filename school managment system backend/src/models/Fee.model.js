const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    feeType: {
      type: String,
      required: true,
      enum: ["Tuition", "Exam", "Library", "Transport", "Sports", "Lab", "Other"],
    },
    amount: { type: Number, required: true, min: 0 },
    month: { type: Number, min: 1, max: 12, default: null }, // null = one-time
    year: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["Unpaid", "Paid", "Overdue", "Waived"], default: "Unpaid" },
    paidAt: { type: Date, default: null },
    paidAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, trim: true, default: "" },
    transactionId: { type: String, trim: true, default: "" },
    remarks: { type: String, trim: true, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

feeSchema.index({ student: 1, year: 1, month: 1, feeType: 1 });

module.exports = mongoose.model("Fee", feeSchema);
