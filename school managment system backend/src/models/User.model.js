const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "teacher", "student", "parent"];

const studentProfileSchema = new mongoose.Schema(
  {
    rollNumber: { type: Number, required: true },
    classLevel: { type: Number, required: true, min: 1, max: 12 },
    section: { type: String, required: true, uppercase: true, trim: true },
    fatherName: { type: String, trim: true, default: "" },
    motherName: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const teacherProfileSchema = new mongoose.Schema(
  {
    employeeId: { type: String, trim: true },
    department: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [50, "Username must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: { values: ROLES, message: "Role must be admin, teacher, student, or parent" },
      required: true,
      default: "student",
    },
    firstName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },

    // Embedded role-specific profiles
    studentProfile: { type: studentProfileSchema, default: null },
    teacherProfile: { type: teacherProfileSchema, default: null },

    // Refresh token storage (hashed)
    refreshTokens: { type: [String], select: false, default: [] },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plain password with hash
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Safe public projection — uses snake_case to match frontend field names
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    first_name: this.firstName,
    last_name: this.lastName,
    phone: this.phone,
    ...(this.role === "student" && this.studentProfile
      ? {
          roll_number: this.studentProfile.rollNumber,
          class_level: this.studentProfile.classLevel,
          section: this.studentProfile.section,
          father_name: this.studentProfile.fatherName,
          mother_name: this.studentProfile.motherName,
          address: this.studentProfile.address,
        }
      : {}),
    ...(this.role === "teacher" && this.teacherProfile
      ? {
          employee_id: this.teacherProfile.employeeId,
          department: this.teacherProfile.department,
          designation: this.teacherProfile.designation,
        }
      : {}),
  };
};

// Compound index to enforce unique roll per class+section
userSchema.index(
  { "studentProfile.classLevel": 1, "studentProfile.section": 1, "studentProfile.rollNumber": 1 },
  {
    unique: true,
    partialFilterExpression: { role: "student" },
    name: "unique_student_roll",
  }
);

module.exports = mongoose.model("User", userSchema);
