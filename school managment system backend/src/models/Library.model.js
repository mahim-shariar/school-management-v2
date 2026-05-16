const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    author: { type: String, required: true, trim: true, maxlength: 150 },
    isbn: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "General" },
    totalCopies: { type: Number, required: true, min: 1, default: 1 },
    availableCopies: { type: Number, required: true, min: 0, default: 1 },
    shelfLocation: { type: String, trim: true, default: "" },
    publishYear: { type: Number, default: null },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

bookSchema.index({ title: "text", author: "text" });

const bookIssueSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    borrowerRole: { type: String, enum: ["student", "teacher"], required: true },
    issuedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnedAt: { type: Date, default: null },
    status: { type: String, enum: ["Issued", "Returned", "Overdue"], default: "Issued" },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fine: { type: Number, default: 0 },
  },
  { timestamps: true }
);

bookIssueSchema.index({ borrower: 1, status: 1 });
bookIssueSchema.index({ book: 1, status: 1 });

const Book = mongoose.model("Book", bookSchema);
const BookIssue = mongoose.model("BookIssue", bookIssueSchema);

module.exports = { Book, BookIssue };
