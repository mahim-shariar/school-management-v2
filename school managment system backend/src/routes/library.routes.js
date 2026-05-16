const express = require("express");
const Joi = require("joi");
const mongoose = require("mongoose");

const { Book, BookIssue } = require("../models/Library.model");
const User = require("../models/User.model");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

const bookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  author: Joi.string().trim().min(1).max(150).required(),
  isbn: Joi.string().trim().max(30).allow(""),
  category: Joi.string().trim().max(50).default("General"),
  total_copies: Joi.number().integer().min(1).required(),
  shelf_location: Joi.string().trim().max(50).allow(""),
  publish_year: Joi.number().integer().min(1500).max(2100).allow(null),
});

const issueSchema = Joi.object({
  book_id: Joi.string().hex().length(24).required(),
  borrower_id: Joi.string().hex().length(24).required(),
  due_date: Joi.date().required(),
});

function serializeBook(b) {
  return {
    id: b._id,
    title: b.title,
    author: b.author,
    isbn: b.isbn,
    category: b.category,
    total_copies: b.totalCopies,
    available_copies: b.availableCopies,
    shelf_location: b.shelfLocation,
    publish_year: b.publishYear,
  };
}

function serializeIssue(i) {
  return {
    id: i._id,
    book_id: i.book?._id || i.book,
    book_title: i.book?.title || null,
    book_author: i.book?.author || null,
    borrower_id: i.borrower?._id || i.borrower,
    borrower_name: i.borrower?.firstName
      ? `${i.borrower.firstName} ${i.borrower.lastName}`.trim()
      : null,
    borrower_role: i.borrowerRole,
    issued_at: i.issuedAt,
    due_date: i.dueDate,
    returned_at: i.returnedAt,
    status: i.status,
    fine: i.fine,
  };
}

// GET /api/library/books/
router.get("/books/", authenticate, async (req, res, next) => {
  try {
    const q = {};
    if (req.query.q) {
      const rx = new RegExp(req.query.q, "i");
      q.$or = [{ title: rx }, { author: rx }];
    }
    if (req.query.category) q.category = req.query.category;
    const list = await Book.find(q).sort({ title: 1 }).limit(500);
    return res.json(list.map(serializeBook));
  } catch (err) {
    next(err);
  }
});

// POST /api/library/books/
router.post("/books/", authenticate, authorize("admin"), validate(bookSchema), async (req, res, next) => {
  try {
    const b = await Book.create({
      title: req.body.title,
      author: req.body.author,
      isbn: req.body.isbn || "",
      category: req.body.category || "General",
      totalCopies: req.body.total_copies,
      availableCopies: req.body.total_copies,
      shelfLocation: req.body.shelf_location || "",
      publishYear: req.body.publish_year || null,
      addedBy: req.user._id,
    });
    return res.status(201).json(serializeBook(b));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/library/books/:id
router.delete("/books/:id", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const issued = await BookIssue.countDocuments({ book: req.params.id, status: "Issued" });
    if (issued > 0) {
      return res.status(400).json({ error: "Cannot delete — book has active issues." });
    }
    await Book.findByIdAndDelete(req.params.id);
    return res.json({ message: "Book deleted." });
  } catch (err) {
    next(err);
  }
});

// POST /api/library/issues/ — admin issues book to user
router.post("/issues/", authenticate, authorize("admin"), validate(issueSchema), async (req, res, next) => {
  try {
    const book = await Book.findById(req.body.book_id);
    if (!book) return res.status(404).json({ error: "Book not found." });
    if (book.availableCopies < 1) return res.status(400).json({ error: "No copies available." });

    const borrower = await User.findById(req.body.borrower_id);
    if (!borrower || !["student", "teacher"].includes(borrower.role)) {
      return res.status(400).json({ error: "Borrower must be a student or teacher." });
    }

    const issue = await BookIssue.create({
      book: book._id,
      borrower: borrower._id,
      borrowerRole: borrower.role,
      dueDate: req.body.due_date,
      issuedBy: req.user._id,
    });
    book.availableCopies -= 1;
    await book.save();

    const populated = await BookIssue.findById(issue._id)
      .populate("book", "title author")
      .populate("borrower", "firstName lastName");
    return res.status(201).json(serializeIssue(populated));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/library/issues/:id/return/ — admin marks returned
router.patch("/issues/:id/return/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id." });
    }
    const i = await BookIssue.findById(req.params.id);
    if (!i) return res.status(404).json({ error: "Issue not found." });
    if (i.status === "Returned") return res.status(400).json({ error: "Already returned." });

    i.returnedAt = new Date();
    i.status = "Returned";
    const overdueDays = Math.max(0, Math.floor((i.returnedAt - i.dueDate) / (1000 * 60 * 60 * 24)));
    i.fine = overdueDays * 5; // ৳5 per overdue day
    await i.save();

    const book = await Book.findById(i.book);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();
    }

    const populated = await BookIssue.findById(i._id)
      .populate("book", "title author")
      .populate("borrower", "firstName lastName");
    return res.json(serializeIssue(populated));
  } catch (err) {
    next(err);
  }
});

// GET /api/library/issues/my/ — borrower's own
router.get("/issues/my/", authenticate, async (req, res, next) => {
  try {
    if (!["student", "teacher"].includes(req.user.role)) return res.json([]);
    const list = await BookIssue.find({ borrower: req.user._id })
      .populate("book", "title author")
      .sort({ createdAt: -1 });
    return res.json(list.map(serializeIssue));
  } catch (err) {
    next(err);
  }
});

// GET /api/library/issues/ — admin
router.get("/issues/", authenticate, authorize("admin"), async (req, res, next) => {
  try {
    const q = {};
    if (req.query.status) q.status = req.query.status;
    if (req.query.borrower_id) q.borrower = req.query.borrower_id;

    const list = await BookIssue.find(q)
      .populate("book", "title author")
      .populate("borrower", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(500);

    const now = new Date();
    list.forEach((i) => {
      if (i.status === "Issued" && i.dueDate < now) i.status = "Overdue";
    });
    return res.json(list.map(serializeIssue));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
