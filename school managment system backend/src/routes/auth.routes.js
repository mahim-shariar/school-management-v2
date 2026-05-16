const express = require("express");
const Joi = require("joi");
const rateLimit = require("express-rate-limit");
const bcrypt = require("bcryptjs");

const User = require("../models/User.model");
const ParentChild = require("../models/ParentChild.model");
const { signAccess, signRefresh, verifyRefresh } = require("../utils/jwt");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");

const router = express.Router();

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts. Please try again later." },
});

// ── Validation schemas (snake_case to match frontend field names) ─────────────
const registerSchema = Joi.object({
  username: Joi.string().trim().min(3).max(50).required(),
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid("admin", "teacher", "student", "parent").required(),
  first_name: Joi.string().trim().max(100).allow("").default(""),
  last_name: Joi.string().trim().max(100).allow("").default(""),
  phone: Joi.string().trim().max(20).allow("").default(""),

  // Student-specific
  roll_number: Joi.when("role", {
    is: "student",
    then: Joi.number().integer().min(1).required(),
    otherwise: Joi.forbidden(),
  }),
  class_level: Joi.when("role", {
    is: "student",
    then: Joi.number().integer().min(1).max(12).required(),
    otherwise: Joi.forbidden(),
  }),
  section: Joi.when("role", {
    is: "student",
    then: Joi.string().trim().uppercase().max(2).required(),
    otherwise: Joi.forbidden(),
  }),
  father_name: Joi.when("role", {
    is: "student",
    then: Joi.string().trim().max(150).allow("").default(""),
    otherwise: Joi.forbidden(),
  }),
  mother_name: Joi.when("role", {
    is: "student",
    then: Joi.string().trim().max(150).allow("").default(""),
    otherwise: Joi.forbidden(),
  }),
  address: Joi.when("role", {
    is: "student",
    then: Joi.string().trim().max(300).allow("").default(""),
    otherwise: Joi.forbidden(),
  }),

  // Teacher-specific
  employee_id: Joi.when("role", {
    is: "teacher",
    then: Joi.string().trim().max(50).required(),
    otherwise: Joi.forbidden(),
  }),
  department: Joi.when("role", {
    is: "teacher",
    then: Joi.string().trim().max(100).allow("").default(""),
    otherwise: Joi.forbidden(),
  }),
  designation: Joi.when("role", {
    is: "teacher",
    then: Joi.string().trim().max(100).allow("").default(""),
    otherwise: Joi.forbidden(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refresh: Joi.string().required(),
});

const linkChildSchema = Joi.object({
  studentId: Joi.string().hex().length(24).optional(),
  email: Joi.string().email().lowercase().optional(),
}).or("studentId", "email");

const adminLinkSchema = Joi.object({
  parent_id: Joi.string().hex().length(24).required(),
  child_id: Joi.string().hex().length(24).required(),
});

// ── POST /api/auth/register/ ──────────────────────────────────────────────────
router.post("/register/", authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const {
      role, username, email, password,
      first_name, last_name, phone,
      roll_number, class_level, section, father_name, mother_name, address,
      employee_id, department, designation,
    } = req.body;

    // Check email / username uniqueness
    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      const field = exists.email === email ? "email" : "username";
      return res.status(409).json({
        error: "Conflict.",
        details: { [field]: `${field} is already taken.` },
      });
    }

    const userData = {
      username,
      email,
      password,
      role,
      firstName: first_name,
      lastName: last_name,
      phone,
    };

    if (role === "student") {
      // Check unique roll number within class + section
      const rollExists = await User.findOne({
        role: "student",
        "studentProfile.classLevel": class_level,
        "studentProfile.section": section,
        "studentProfile.rollNumber": roll_number,
      });
      if (rollExists) {
        return res.status(409).json({
          error: "Conflict.",
          details: { roll_number: "Roll number already taken in this class and section." },
        });
      }
      userData.studentProfile = {
        rollNumber: roll_number,
        classLevel: class_level,
        section,
        fatherName: father_name,
        motherName: mother_name,
        address,
      };
    }

    if (role === "teacher") {
      // Check unique employee_id
      const empExists = await User.findOne({ "teacherProfile.employeeId": employee_id });
      if (empExists) {
        return res.status(409).json({
          error: "Conflict.",
          details: { employee_id: "Employee ID is already registered." },
        });
      }
      userData.teacherProfile = { employeeId: employee_id, department, designation };
    }

    await User.create(userData);
    return res.status(201).json({ message: "Registration successful. You can now sign in." });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login/ ─────────────────────────────────────────────────────
router.post("/login/", authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password +refreshTokens");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const payload = { id: user._id, role: user.role };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh(payload);

    // Store hashed refresh token (keep latest 5 sessions)
    const hashedRefresh = await bcrypt.hash(refreshToken, 8);
    user.refreshTokens = [...(user.refreshTokens || []).slice(-4), hashedRefresh];
    await user.save({ validateBeforeSave: false });

    return res.json({
      access: accessToken,
      refresh: refreshToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/token/refresh/ ─────────────────────────────────────────────
router.post("/token/refresh/", authLimiter, validate(refreshSchema), async (req, res, next) => {
  try {
    const { refresh } = req.body;

    let payload;
    try {
      payload = verifyRefresh(refresh);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token." });
    }

    const user = await User.findById(payload.id).select("+refreshTokens");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found." });
    }

    // Validate against stored hashed tokens
    let tokenValid = false;
    for (const stored of user.refreshTokens || []) {
      if (await bcrypt.compare(refresh, stored)) {
        tokenValid = true;
        break;
      }
    }
    if (!tokenValid) {
      return res.status(401).json({ error: "Refresh token revoked or invalid." });
    }

    const newAccessToken = signAccess({ id: user._id, role: user.role });
    return res.json({ access: newAccessToken });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/logout/ ────────────────────────────────────────────────────
router.post("/logout/", authenticate, async (req, res, next) => {
  try {
    const { refresh } = req.body;
    const user = await User.findById(req.user._id).select("+refreshTokens");
    if (user && refresh) {
      const remaining = [];
      for (const stored of user.refreshTokens || []) {
        const isThis = await bcrypt.compare(refresh, stored);
        if (!isThis) remaining.push(stored);
      }
      user.refreshTokens = remaining;
      await user.save({ validateBeforeSave: false });
    }
    return res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/auth/me/ ─────────────────────────────────────────────────────────
router.get("/me/", authenticate, (req, res) => {
  return res.json(req.user.toPublicJSON());
});

// ── GET /api/auth/student/profile/ ───────────────────────────────────────────
router.get("/student/profile/", authenticate, authorize("student"), (req, res) => {
  const p = req.user.studentProfile;
  if (!p) return res.status(404).json({ error: "Student profile not found." });
  return res.json({
    id: req.user._id,
    first_name: req.user.firstName,
    last_name: req.user.lastName,
    email: req.user.email,
    phone: req.user.phone,
    roll_number: p.rollNumber,
    class_level: p.classLevel,
    section: p.section,
    father_name: p.fatherName,
    mother_name: p.motherName,
    address: p.address,
  });
});

// ── POST /api/auth/link-child/ ────────────────────────────────────────────────
router.post(
  "/link-child/",
  authenticate,
  authorize("parent"),
  validate(linkChildSchema),
  async (req, res, next) => {
    try {
      const { studentId, email } = req.body;

      const query = { role: "student" };
      if (studentId) query._id = studentId;
      else query.email = email.toLowerCase();

      const child = await User.findOne(query);
      if (!child) return res.status(404).json({ error: "Student not found." });

      await ParentChild.findOneAndUpdate(
        { parent: req.user._id, child: child._id },
        { parent: req.user._id, child: child._id },
        { upsert: true, new: true }
      );

      return res.status(201).json({
        message: "Child linked successfully.",
        child: child.toPublicJSON(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/my-children/ ────────────────────────────────────────────────
router.get("/my-children/", authenticate, authorize("parent"), async (req, res, next) => {
  try {
    const links = await ParentChild.find({ parent: req.user._id }).populate("child");
    return res.json(links.map((l) => l.child.toPublicJSON()));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/admin-link-parent/ — admin/teacher links any parent to any child
router.post(
  "/admin-link-parent/",
  authenticate,
  authorize("admin", "teacher"),
  validate(adminLinkSchema),
  async (req, res, next) => {
    try {
      const parent = await User.findOne({ _id: req.body.parent_id, role: "parent" });
      if (!parent) return res.status(404).json({ error: "Parent not found." });
      const child = await User.findOne({ _id: req.body.child_id, role: "student" });
      if (!child) return res.status(404).json({ error: "Student not found." });

      const link = await ParentChild.findOneAndUpdate(
        { parent: parent._id, child: child._id },
        { parent: parent._id, child: child._id },
        { upsert: true, new: true }
      );
      return res.status(201).json({
        message: "Linked successfully.",
        link_id: link._id,
        parent: parent.toPublicJSON(),
        child: child.toPublicJSON(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/auth/admin-link-parent/:id — admin unlinks
router.delete(
  "/admin-link-parent/:id",
  authenticate,
  authorize("admin", "teacher"),
  async (req, res, next) => {
    try {
      const deleted = await ParentChild.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Link not found." });
      return res.json({ message: "Link removed." });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/parent-child-links/ — admin/teacher lists all parent-child links
router.get(
  "/parent-child-links/",
  authenticate,
  authorize("admin", "teacher"),
  async (_req, res, next) => {
    try {
      const links = await ParentChild.find({})
        .populate("parent", "firstName lastName email phone")
        .populate("child", "firstName lastName email studentProfile");
      return res.json(
        links.map((l) => ({
          id: l._id,
          parent_id: l.parent?._id,
          parent_name: l.parent
            ? `${l.parent.firstName} ${l.parent.lastName}`.trim()
            : null,
          parent_email: l.parent?.email,
          parent_phone: l.parent?.phone,
          child_id: l.child?._id,
          child_name: l.child
            ? `${l.child.firstName} ${l.child.lastName}`.trim()
            : null,
          child_email: l.child?.email,
          class_level: l.child?.studentProfile?.classLevel,
          section: l.child?.studentProfile?.section,
          roll_number: l.child?.studentProfile?.rollNumber,
        }))
      );
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/auth/users/?role= — admin/teacher list users by role
router.get("/users/", authenticate, authorize("admin", "teacher"), async (req, res, next) => {
  try {
    const q = { isActive: true };
    if (req.query.role) q.role = req.query.role;
    if (req.query.class_level) q["studentProfile.classLevel"] = Number(req.query.class_level);
    if (req.query.section) q["studentProfile.section"] = req.query.section.toUpperCase();
    const users = await User.find(q).limit(500);
    return res.json(users.map((u) => u.toPublicJSON()));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
