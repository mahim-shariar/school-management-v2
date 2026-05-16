/**
 * Public website routes — NO AUTHENTICATION REQUIRED.
 * Used by the public-facing school landing page.
 */
const express = require("express");
const SchoolSettings = require("../models/SchoolSettings.model");
const Staff = require("../models/Staff.model");
const Gallery = require("../models/Gallery.model");
const Achievement = require("../models/Achievement.model");
const Notice = require("../models/Notice.model");
const Event = require("../models/Event.model");

const router = express.Router();

function serializeSchool(s) {
  if (!s) return null;
  return {
    school_name: s.schoolName,
    school_code: s.schoolCode,
    tagline: s.tagline,
    motto: s.motto,
    founded_year: s.foundedYear,
    about: s.about,
    mission: s.mission,
    vision: s.vision,
    history: s.history,
    principal_name: s.principalName,
    principal_message: s.principalMessage,
    principal_photo_url: s.principalPhotoUrl,
    hero_image_url: s.heroImageUrl,
    logo_url: s.logoUrl,
    address: s.address,
    phone: s.phone,
    email: s.email,
    website: s.website,
    country: s.country,
    facebook_url: s.facebookUrl,
    twitter_url: s.twitterUrl,
    youtube_url: s.youtubeUrl,
    map_embed_url: s.mapEmbedUrl,
    total_students: s.totalStudents,
    total_teachers: s.totalTeachers,
    awards_count: s.awardsCount,
    facilities: s.facilities || [],
    current_academic_year: s.currentAcademicYear,
    class_start_time: s.classStartTime,
    class_end_time: s.classEndTime,
    working_days: s.workingDays || [],
  };
}

function serializeStaff(s) {
  return {
    id: s._id,
    name: s.name,
    designation: s.designation,
    department: s.department,
    email: s.email,
    phone: s.phone,
    bio: s.bio,
    photo_url: s.photoUrl,
    qualifications: s.qualifications || [],
    years_of_experience: s.yearsOfExperience,
    joined_date: s.joinedDate,
    is_principal: s.isPrincipal,
    is_vice_principal: s.isVicePrincipal,
    is_department_head: s.isDepartmentHead,
    display_order: s.displayOrder,
  };
}

function serializeGallery(g) {
  return {
    id: g._id,
    title: g.title,
    caption: g.caption,
    image_url: g.imageUrl,
    category: g.category,
    display_order: g.displayOrder,
    created_at: g.createdAt,
  };
}

function serializeAchievement(a) {
  return {
    id: a._id,
    title: a.title,
    description: a.description,
    category: a.category,
    achieved_on: a.achievedOn,
    awarded_by: a.awardedBy,
    icon_url: a.iconUrl,
  };
}

// GET /api/public/school — full school profile + everything for the landing page
router.get("/school", async (_req, res, next) => {
  try {
    const school = await SchoolSettings.findOne({});
    const [staff, gallery, achievements] = await Promise.all([
      Staff.find({ isPublic: true }).sort({ displayOrder: 1, name: 1 }),
      Gallery.find({ isPublic: true }).sort({ displayOrder: 1, createdAt: -1 }).limit(24),
      Achievement.find({ isPublic: true }).sort({ achievedOn: -1 }).limit(12),
    ]);

    const principal = staff.find((s) => s.isPrincipal) || null;
    const vicePrincipal = staff.find((s) => s.isVicePrincipal) || null;
    const departmentHeads = staff.filter((s) => s.isDepartmentHead);
    const otherStaff = staff.filter((s) => !s.isPrincipal && !s.isVicePrincipal && !s.isDepartmentHead);

    return res.json({
      school: serializeSchool(school),
      principal: principal ? serializeStaff(principal) : null,
      vice_principal: vicePrincipal ? serializeStaff(vicePrincipal) : null,
      department_heads: departmentHeads.map(serializeStaff),
      staff: otherStaff.map(serializeStaff),
      gallery: gallery.map(serializeGallery),
      achievements: achievements.map(serializeAchievement),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/public/staff
router.get("/staff", async (req, res, next) => {
  try {
    const q = { isPublic: true };
    if (req.query.department) q.department = req.query.department;
    const list = await Staff.find(q).sort({ displayOrder: 1, name: 1 });
    return res.json(list.map(serializeStaff));
  } catch (err) {
    next(err);
  }
});

// GET /api/public/gallery
router.get("/gallery", async (req, res, next) => {
  try {
    const q = { isPublic: true };
    if (req.query.category) q.category = req.query.category;
    const list = await Gallery.find(q).sort({ displayOrder: 1, createdAt: -1 }).limit(60);
    return res.json(list.map(serializeGallery));
  } catch (err) {
    next(err);
  }
});

// GET /api/public/achievements
router.get("/achievements", async (_req, res, next) => {
  try {
    const list = await Achievement.find({ isPublic: true }).sort({ achievedOn: -1 }).limit(40);
    return res.json(list.map(serializeAchievement));
  } catch (err) {
    next(err);
  }
});

// GET /api/public/news — public notices + upcoming events
router.get("/news", async (_req, res, next) => {
  try {
    const now = new Date();
    const [notices, events] = await Promise.all([
      Notice.find({
        targetRoles: { $in: ["student", "parent"] },
        $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }],
      })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(8),
      Event.find({ startDate: { $gte: now } }).sort({ startDate: 1 }).limit(8),
    ]);

    return res.json({
      notices: notices.map((n) => ({
        id: n._id,
        title: n.title,
        content: n.content,
        category: n.category,
        priority: n.priority,
        is_pinned: n.isPinned,
        created_at: n.createdAt,
      })),
      events: events.map((e) => ({
        id: e._id,
        title: e.title,
        description: e.description,
        event_type: e.eventType,
        start_date: e.startDate,
        end_date: e.endDate,
        is_holiday: e.isHoliday,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
