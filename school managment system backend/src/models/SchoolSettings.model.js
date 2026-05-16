const mongoose = require("mongoose");

// Singleton — only one document per collection
const schoolSettingsSchema = new mongoose.Schema(
  {
    schoolName: { type: String, trim: true, default: "My School" },
    schoolCode: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    logoUrl: { type: String, trim: true, default: "" },
    currentAcademicYear: { type: String, default: "2025-2026" },
    academicYearStart: { type: Date, default: null },
    academicYearEnd: { type: Date, default: null },
    currency: { type: String, trim: true, default: "৳" },
    workingDays: { type: [Number], default: [0, 1, 2, 3, 4] }, // 0=Sun…4=Thu
    periodsPerDay: { type: Number, default: 7 },
    classStartTime: { type: String, default: "08:00" },
    classEndTime: { type: String, default: "14:30" },
    country: { type: String, trim: true, default: "Bangladesh" },

    // Public website fields
    tagline: { type: String, trim: true, default: "" },
    motto: { type: String, trim: true, default: "" },
    foundedYear: { type: Number, default: null },
    about: { type: String, trim: true, default: "" },
    mission: { type: String, trim: true, default: "" },
    vision: { type: String, trim: true, default: "" },
    history: { type: String, trim: true, default: "" },
    principalName: { type: String, trim: true, default: "" },
    principalMessage: { type: String, trim: true, default: "" },
    principalPhotoUrl: { type: String, trim: true, default: "" },
    heroImageUrl: { type: String, trim: true, default: "" },
    facebookUrl: { type: String, trim: true, default: "" },
    twitterUrl: { type: String, trim: true, default: "" },
    youtubeUrl: { type: String, trim: true, default: "" },
    mapEmbedUrl: { type: String, trim: true, default: "" },
    totalStudents: { type: Number, default: null },
    totalTeachers: { type: Number, default: null },
    awardsCount: { type: Number, default: null },
    facilities: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SchoolSettings", schoolSettingsSchema);
