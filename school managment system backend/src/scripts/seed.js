/**
 * Comprehensive seed script — clears and repopulates the database with
 * realistic dummy data for the school management system.
 * Run: node src/scripts/seed.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const Exam = require("../models/Exam.model");
const Subject = require("../models/Subject.model");
const User = require("../models/User.model");
const Attendance = require("../models/Attendance.model");
const Mark = require("../models/Mark.model");
const ParentChild = require("../models/ParentChild.model");
const Assignment = require("../models/Assignment.model");
const AssignmentSubmission = require("../models/AssignmentSubmission.model");
const TeacherClass = require("../models/TeacherClass.model");
const Timetable = require("../models/Timetable.model");
const Fee = require("../models/Fee.model");
const Notice = require("../models/Notice.model");
const Event = require("../models/Event.model");
const Leave = require("../models/Leave.model");
const { Book, BookIssue } = require("../models/Library.model");
const { TransportRoute, StudentTransport } = require("../models/Transport.model");
const ExamSchedule = require("../models/ExamSchedule.model");
const SchoolSettings = require("../models/SchoolSettings.model");
const Syllabus = require("../models/Syllabus.model");
const Staff = require("../models/Staff.model");
const Gallery = require("../models/Gallery.model");
const Achievement = require("../models/Achievement.model");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/school_management";

// ── Exams (Class Test first as requested) ────────────────────────────────────
const EXAMS = [
  { _id: 1, label: "Class Test", isPublished: true },
  { _id: 2, label: "Half Yearly", isPublished: true },
  { _id: 3, label: "Annual", isPublished: false },
];

// ── Subjects per class level ──────────────────────────────────────────────────
const SUBJECTS_BY_CLASS = {
  6: [
    { code: "BAN601", label: "Bangla" },
    { code: "ENG601", label: "English" },
    { code: "MAT601", label: "Mathematics" },
    { code: "SCI601", label: "Science" },
    { code: "SSC601", label: "Social Science" },
    { code: "REL601", label: "Religion" },
    { code: "ICT601", label: "ICT" },
  ],
  7: [
    { code: "BAN701", label: "Bangla" },
    { code: "ENG701", label: "English" },
    { code: "MAT701", label: "Mathematics" },
    { code: "SCI701", label: "Science" },
    { code: "SSC701", label: "Social Science" },
    { code: "REL701", label: "Religion" },
    { code: "ICT701", label: "ICT" },
  ],
  8: [
    { code: "BAN801", label: "Bangla" },
    { code: "ENG801", label: "English" },
    { code: "MAT801", label: "Mathematics" },
    { code: "SCI801", label: "Science" },
    { code: "SSC801", label: "Social Science" },
    { code: "REL801", label: "Religion" },
    { code: "ICT801", label: "ICT" },
  ],
  9: [
    { code: "BAN901", label: "Bangla" },
    { code: "ENG901", label: "English" },
    { code: "MAT901", label: "Mathematics" },
    { code: "PHY901", label: "Physics" },
    { code: "CHE901", label: "Chemistry" },
    { code: "BIO901", label: "Biology" },
    { code: "ICT901", label: "ICT" },
  ],
  10: [
    { code: "BAN1001", label: "Bangla" },
    { code: "ENG1001", label: "English" },
    { code: "MAT1001", label: "Mathematics" },
    { code: "PHY1001", label: "Physics" },
    { code: "CHE1001", label: "Chemistry" },
    { code: "BIO1001", label: "Biology" },
    { code: "ICT1001", label: "ICT" },
  ],
};

// ── User data ─────────────────────────────────────────────────────────────────
const ADMIN = {
  username: "admin",
  email: "admin@school.com",
  password: "admin123",
  role: "admin",
  firstName: "Md. Karim",
  lastName: "Uddin",
  phone: "01811111111",
};

const TEACHERS = [
  {
    username: "teacher1",
    email: "teacher@school.com",
    password: "teacher123",
    role: "teacher",
    firstName: "Nasrin",
    lastName: "Begum",
    phone: "01722222222",
    teacherProfile: { employeeId: "EMP001", department: "Science", designation: "Senior Teacher" },
  },
  {
    username: "teacher2",
    email: "teacher2@school.com",
    password: "teacher123",
    role: "teacher",
    firstName: "Kamal",
    lastName: "Hossain",
    phone: "01733333333",
    teacherProfile: { employeeId: "EMP002", department: "Mathematics", designation: "Assistant Teacher" },
  },
  {
    username: "teacher3",
    email: "teacher3@school.com",
    password: "teacher123",
    role: "teacher",
    firstName: "Fatema",
    lastName: "Khatun",
    phone: "01744444444",
    teacherProfile: { employeeId: "EMP003", department: "Language", designation: "Senior Teacher" },
  },
  {
    username: "teacher4",
    email: "teacher4@school.com",
    password: "teacher123",
    role: "teacher",
    firstName: "Rashed",
    lastName: "Iqbal",
    phone: "01755555555",
    teacherProfile: { employeeId: "EMP004", department: "ICT", designation: "Teacher" },
  },
];

const PARENTS = [
  {
    username: "parent1",
    email: "parent@school.com",
    password: "parent123",
    role: "parent",
    firstName: "Rahim",
    lastName: "Ali",
    phone: "01544444444",
  },
  {
    username: "parent2",
    email: "parent2@school.com",
    password: "parent123",
    role: "parent",
    firstName: "Selina",
    lastName: "Begum",
    phone: "01555555555",
  },
];

// Students: 6 per section across class 9 and 10 (4 sections each)
const STUDENTS = [
  // ── Class 9 Section A ──────────────────────────────────────────────────────
  {
    username: "ahmed01",
    email: "student@school.com",
    password: "student123",
    role: "student",
    firstName: "Ahmed",
    lastName: "Rahman",
    phone: "01933333333",
    studentProfile: { rollNumber: 1, classLevel: 9, section: "A", fatherName: "Rahim Ahmed", motherName: "Fatema Begum", address: "Dhaka" },
  },
  {
    username: "sadia9a2",
    email: "sadia9a2@school.com",
    password: "student123",
    role: "student",
    firstName: "Sadia",
    lastName: "Islam",
    phone: "01934444444",
    studentProfile: { rollNumber: 2, classLevel: 9, section: "A", fatherName: "Karim Islam", motherName: "Rohima Islam", address: "Dhaka" },
  },
  {
    username: "farhan9a3",
    email: "farhan9a3@school.com",
    password: "student123",
    role: "student",
    firstName: "Farhan",
    lastName: "Hossain",
    phone: "01935555555",
    studentProfile: { rollNumber: 3, classLevel: 9, section: "A", fatherName: "Jalal Hossain", motherName: "Minara Begum", address: "Chittagong" },
  },
  {
    username: "nusrat9a4",
    email: "nusrat9a4@school.com",
    password: "student123",
    role: "student",
    firstName: "Nusrat",
    lastName: "Jahan",
    phone: "01936666666",
    studentProfile: { rollNumber: 4, classLevel: 9, section: "A", fatherName: "Abul Jahan", motherName: "Jasmin Jahan", address: "Sylhet" },
  },
  {
    username: "rifat9a5",
    email: "rifat9a5@school.com",
    password: "student123",
    role: "student",
    firstName: "Rifat",
    lastName: "Mahmud",
    phone: "01937777777",
    studentProfile: { rollNumber: 5, classLevel: 9, section: "A", fatherName: "Mamun Mahmud", motherName: "Shirin Mahmud", address: "Rajshahi" },
  },
  {
    username: "tania9a6",
    email: "tania9a6@school.com",
    password: "student123",
    role: "student",
    firstName: "Tania",
    lastName: "Akter",
    phone: "01938888888",
    studentProfile: { rollNumber: 6, classLevel: 9, section: "A", fatherName: "Nazmul Akter", motherName: "Roksana Begum", address: "Khulna" },
  },
  // ── Class 9 Section B ──────────────────────────────────────────────────────
  {
    username: "sakib9b1",
    email: "sakib9b1@school.com",
    password: "student123",
    role: "student",
    firstName: "Sakib",
    lastName: "Khan",
    phone: "01921111111",
    studentProfile: { rollNumber: 1, classLevel: 9, section: "B", fatherName: "Mizanur Khan", motherName: "Hasina Begum", address: "Dhaka" },
  },
  {
    username: "mim9b2",
    email: "mim9b2@school.com",
    password: "student123",
    role: "student",
    firstName: "Mim",
    lastName: "Chowdhury",
    phone: "01922222222",
    studentProfile: { rollNumber: 2, classLevel: 9, section: "B", fatherName: "Alam Chowdhury", motherName: "Parveen Begum", address: "Comilla" },
  },
  {
    username: "jahid9b3",
    email: "jahid9b3@school.com",
    password: "student123",
    role: "student",
    firstName: "Jahid",
    lastName: "Hasan",
    phone: "01923333333",
    studentProfile: { rollNumber: 3, classLevel: 9, section: "B", fatherName: "Badrul Hasan", motherName: "Nargis Begum", address: "Mymensingh" },
  },
  {
    username: "riya9b4",
    email: "riya9b4@school.com",
    password: "student123",
    role: "student",
    firstName: "Riya",
    lastName: "Dey",
    phone: "01924444444",
    studentProfile: { rollNumber: 4, classLevel: 9, section: "B", fatherName: "Sunil Dey", motherName: "Puja Dey", address: "Barisal" },
  },
  {
    username: "imran9b5",
    email: "imran9b5@school.com",
    password: "student123",
    role: "student",
    firstName: "Imran",
    lastName: "Sheikh",
    phone: "01925555555",
    studentProfile: { rollNumber: 5, classLevel: 9, section: "B", fatherName: "Anwar Sheikh", motherName: "Rahima Begum", address: "Rangpur" },
  },
  // ── Class 10 Section A ─────────────────────────────────────────────────────
  {
    username: "lima10a1",
    email: "lima10a1@school.com",
    password: "student123",
    role: "student",
    firstName: "Lima",
    lastName: "Akter",
    phone: "01911111111",
    studentProfile: { rollNumber: 1, classLevel: 10, section: "A", fatherName: "Harun Akter", motherName: "Shapna Akter", address: "Dhaka" },
  },
  {
    username: "omar10a2",
    email: "omar10a2@school.com",
    password: "student123",
    role: "student",
    firstName: "Omar",
    lastName: "Faruk",
    phone: "01912222222",
    studentProfile: { rollNumber: 2, classLevel: 10, section: "A", fatherName: "Khalil Faruk", motherName: "Laila Begum", address: "Gazipur" },
  },
  {
    username: "priya10a3",
    email: "priya10a3@school.com",
    password: "student123",
    role: "student",
    firstName: "Priya",
    lastName: "Roy",
    phone: "01913333333",
    studentProfile: { rollNumber: 3, classLevel: 10, section: "A", fatherName: "Bipul Roy", motherName: "Rekha Roy", address: "Narayanganj" },
  },
  {
    username: "arif10a4",
    email: "arif10a4@school.com",
    password: "student123",
    role: "student",
    firstName: "Arif",
    lastName: "Billah",
    phone: "01914444444",
    studentProfile: { rollNumber: 4, classLevel: 10, section: "A", fatherName: "Azad Billah", motherName: "Monira Begum", address: "Tangail" },
  },
  {
    username: "sumaiya10a5",
    email: "sumaiya10a5@school.com",
    password: "student123",
    role: "student",
    firstName: "Sumaiya",
    lastName: "Khanam",
    phone: "01915555555",
    studentProfile: { rollNumber: 5, classLevel: 10, section: "A", fatherName: "Mosharraf Khanam", motherName: "Dilruba Khanam", address: "Faridpur" },
  },
  // ── Class 10 Section B ─────────────────────────────────────────────────────
  {
    username: "rabbi10b1",
    email: "rabbi10b1@school.com",
    password: "student123",
    role: "student",
    firstName: "Rabbi",
    lastName: "Mia",
    phone: "01916666666",
    studentProfile: { rollNumber: 1, classLevel: 10, section: "B", fatherName: "Korim Mia", motherName: "Shahanara Begum", address: "Narsingdi" },
  },
  {
    username: "meher10b2",
    email: "meher10b2@school.com",
    password: "student123",
    role: "student",
    firstName: "Meher",
    lastName: "Nigar",
    phone: "01917777777",
    studentProfile: { rollNumber: 2, classLevel: 10, section: "B", fatherName: "Salam Nigar", motherName: "Rebeka Nigar", address: "Kishoreganj" },
  },
  {
    username: "emon10b3",
    email: "emon10b3@school.com",
    password: "student123",
    role: "student",
    firstName: "Emon",
    lastName: "Sarker",
    phone: "01918888888",
    studentProfile: { rollNumber: 3, classLevel: 10, section: "B", fatherName: "Sukumar Sarker", motherName: "Arpita Sarker", address: "Jashore" },
  },
  {
    username: "nasrin10b4",
    email: "nasrin10b4@school.com",
    password: "student123",
    role: "student",
    firstName: "Nasrin",
    lastName: "Sultana",
    phone: "01919999999",
    studentProfile: { rollNumber: 4, classLevel: 10, section: "B", fatherName: "Hafiz Sultana", motherName: "Amena Begum", address: "Bogura" },
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMarks(examId) {
  // Class Test (1): lower marks overall
  // Half Yearly (2): medium marks
  // Annual (3): higher marks (not yet published)
  const baseWritten = examId === 1 ? [35, 55] : examId === 2 ? [45, 65] : [50, 70];
  const baseMcq = examId === 1 ? [12, 20] : examId === 2 ? [14, 22] : [15, 23];
  return {
    marksWritten: randInt(...baseWritten),
    marksMcq: randInt(...baseMcq),
    marksPractical: 0,
  };
}

function getWorkingDays(startDate, endDate) {
  const days = [];
  const d = new Date(startDate);
  while (d <= endDate) {
    const dow = d.getDay();
    if (dow !== 5 && dow !== 6) { // Friday (5) and Saturday (6) are off in Bangladesh
      days.push(new Date(d));
    }
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function pickStatus(attendanceRate) {
  const r = Math.random();
  if (r < attendanceRate) return "Present";
  if (r < attendanceRate + 0.05) return "Late";
  return "Absent";
}

async function upsertUser(data) {
  const exists = await User.findOne({ email: data.email });
  if (!exists) {
    return User.create(data);
  }
  return exists;
}

// ── Main seed function ────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");

  // Clear collections in correct order (dependent first)
  console.log("Clearing old data…");
  await AssignmentSubmission.deleteMany({});
  await Assignment.deleteMany({});
  await Mark.deleteMany({});
  await Attendance.deleteMany({});
  await ParentChild.deleteMany({});
  await TeacherClass.deleteMany({});
  await Timetable.deleteMany({});
  await Fee.deleteMany({});
  await Notice.deleteMany({});
  await Event.deleteMany({});
  await Leave.deleteMany({});
  await BookIssue.deleteMany({});
  await Book.deleteMany({});
  await StudentTransport.deleteMany({});
  await TransportRoute.deleteMany({});
  await ExamSchedule.deleteMany({});
  await SchoolSettings.deleteMany({});
  await Syllabus.deleteMany({});
  await Staff.deleteMany({});
  await Gallery.deleteMany({});
  await Achievement.deleteMany({});
  await Subject.deleteMany({});
  await Exam.deleteMany({});
  // Don't delete users automatically to preserve login sessions; upsert instead
  console.log("Done clearing.\n");

  // ── Exams ─────────────────────────────────────────────────────────────────
  for (const exam of EXAMS) {
    await Exam.findByIdAndUpdate(exam._id, exam, { upsert: true, new: true });
  }
  console.log(`Seeded ${EXAMS.length} exams`);

  // ── Subjects per class level ───────────────────────────────────────────────
  const subjectDocs = {};
  for (const [classLevel, subs] of Object.entries(SUBJECTS_BY_CLASS)) {
    subjectDocs[classLevel] = [];
    for (const sub of subs) {
      const doc = await Subject.findOneAndUpdate(
        { code: sub.code, classLevel: parseInt(classLevel, 10) },
        { ...sub, classLevel: parseInt(classLevel, 10) },
        { upsert: true, new: true }
      );
      subjectDocs[classLevel].push(doc);
    }
    console.log(`  Class ${classLevel}: ${subs.length} subjects`);
  }
  console.log(`Seeded subjects for ${Object.keys(SUBJECTS_BY_CLASS).length} class levels`);

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminDoc = await upsertUser(ADMIN);
  console.log(`\nAdmin: ${ADMIN.email}`);

  const teacherDocs = [];
  for (const t of TEACHERS) {
    const doc = await upsertUser(t);
    teacherDocs.push(doc);
  }
  console.log(`Teachers: ${TEACHERS.length}`);

  const parentDocs = [];
  for (const p of PARENTS) {
    const doc = await upsertUser(p);
    parentDocs.push(doc);
  }
  console.log(`Parents: ${PARENTS.length}`);

  const studentDocs = [];
  for (const s of STUDENTS) {
    const doc = await upsertUser(s);
    studentDocs.push(doc);
  }
  console.log(`Students: ${STUDENTS.length}`);

  // ── Parent-Child links ─────────────────────────────────────────────────────
  const parent1 = parentDocs[0];
  const parent2 = parentDocs[1];
  const student1 = studentDocs[0]; // Ahmed Rahman (9A)
  const student2 = studentDocs[7]; // Mim Chowdhury (9B)

  const links = [
    { parent: parent1._id, child: student1._id },
    { parent: parent2._id, child: student2._id },
  ];
  for (const link of links) {
    await ParentChild.findOneAndUpdate(link, link, { upsert: true, new: true });
  }
  console.log(`Parent-child links: ${links.length}`);

  // ── Marks for all students ─────────────────────────────────────────────────
  console.log("\nSeeding marks…");
  let marksCount = 0;
  for (const student of studentDocs) {
    const { classLevel } = student.studentProfile;
    const subjects = subjectDocs[classLevel] || [];

    for (const exam of EXAMS) {
      for (const subject of subjects) {
        const { marksWritten, marksMcq, marksPractical } = generateMarks(exam._id);
        await Mark.findOneAndUpdate(
          { student: student._id, exam: exam._id, subject: subject._id },
          { marksWritten, marksMcq, marksPractical, submittedBy: teacherDocs[0]._id },
          { upsert: true, new: true }
        );
        marksCount++;
      }
    }
  }
  console.log(`Seeded ${marksCount} mark records`);

  // ── Attendance for past 60 days ────────────────────────────────────────────
  console.log("\nSeeding attendance…");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const workingDays = getWorkingDays(sixtyDaysAgo, today);
  let attCount = 0;

  // One attendance record per student per day
  for (const day of workingDays) {
    const ops = studentDocs.map((s) => {
      const rate = 0.80 + (parseInt(s.studentProfile.rollNumber, 10) % 5) * 0.04;
      return {
        updateOne: {
          filter: { student: s._id, date: day },
          update: { $set: { status: pickStatus(rate), markedBy: teacherDocs[0]._id } },
          upsert: true,
        },
      };
    });
    await Attendance.bulkWrite(ops, { ordered: false });
    attCount += studentDocs.length;
  }
  console.log(`Seeded ${attCount} attendance records (${workingDays.length} working days × ${studentDocs.length} students)`);

  // ── Assignments for past 4 weeks ───────────────────────────────────────────
  console.log("\nSeeding assignments…");
  const currentYear = today.getFullYear();
  const dayOfYear = Math.ceil((today - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.ceil(dayOfYear / 7);

  const assignmentData = [];

  // 3 assignments per section per week for past 4 weeks
  for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
    const weekNum = Math.max(1, currentWeek - weekOffset);
    const dueDate = new Date(today);
    dueDate.setDate(dueDate.getDate() - weekOffset * 7 + 2); // due mid-week

    for (const [clsLevel, subs] of Object.entries(SUBJECTS_BY_CLASS)) {
      if (parseInt(clsLevel, 10) < 9) continue; // only for class 9 and 10
      const sections9or10 = clsLevel === "9" ? ["A", "B"] : ["A", "B"];

      for (const sec of sections9or10) {
        // 2 assignments per week per section
        const sub1 = subs[0]; // Bangla
        const sub2 = subs[2]; // Mathematics
        const subDoc1 = subjectDocs[clsLevel].find((s) => s.code === sub1.code);
        const subDoc2 = subjectDocs[clsLevel].find((s) => s.code === sub2.code);

        assignmentData.push({
          title: `Week ${weekNum} ${sub1.label} Assignment`,
          description: `Complete all exercises from Chapter ${weekNum % 5 + 1}. Write answers neatly.`,
          classLevel: parseInt(clsLevel, 10),
          section: sec,
          subject: subDoc1?._id || null,
          dueDate: new Date(dueDate),
          weekNumber: weekNum,
          year: currentYear,
          assignedBy: teacherDocs[2]._id, // Fatema Khatun (language)
        });

        assignmentData.push({
          title: `Week ${weekNum} ${sub2.label} Assignment`,
          description: `Solve problems 1–10 from Exercise ${weekNum % 3 + 1}. Show all working.`,
          classLevel: parseInt(clsLevel, 10),
          section: sec,
          subject: subDoc2?._id || null,
          dueDate: new Date(dueDate),
          weekNumber: weekNum,
          year: currentYear,
          assignedBy: teacherDocs[1]._id, // Kamal Hossain (math)
        });
      }
    }
  }

  const insertedAssignments = await Assignment.insertMany(assignmentData);
  console.log(`Seeded ${insertedAssignments.length} assignments`);

  // ── Assignment submissions ─────────────────────────────────────────────────
  console.log("\nSeeding assignment submissions…");
  let subCount = 0;

  for (const student of studentDocs) {
    const { classLevel, section } = student.studentProfile;
    const studentAssignments = insertedAssignments.filter(
      (a) => a.classLevel === classLevel && (!a.section || a.section === section)
    );

    for (const assignment of studentAssignments) {
      // Older assignments: 90% submitted, recent: 60% submitted
      const ageInWeeks = currentWeek - assignment.weekNumber;
      const submitChance = ageInWeeks >= 2 ? 0.9 : ageInWeeks === 1 ? 0.75 : 0.5;

      if (Math.random() < submitChance) {
        const isGraded = ageInWeeks >= 2 && Math.random() > 0.3;
        await AssignmentSubmission.findOneAndUpdate(
          { assignment: assignment._id, student: student._id },
          {
            status: isGraded ? "Graded" : "Submitted",
            submittedAt: new Date(assignment.dueDate.getTime() - randInt(0, 2) * 24 * 60 * 60 * 1000),
            marks: isGraded ? randInt(12, 20) : null,
            feedback: isGraded ? "Good work!" : "",
          },
          { upsert: true, new: true }
        );
        subCount++;
      }
    }
  }
  console.log(`Seeded ${subCount} assignment submissions`);

  // ── School Settings ───────────────────────────────────────────────────────
  console.log("\nSeeding school settings…");
  await SchoolSettings.create({
    schoolName: "Sunshine Model High School",
    schoolCode: "SMHS-2026",
    address: "House 12, Road 5, Dhanmondi, Dhaka, Bangladesh",
    phone: "+880-2-9123456",
    email: "info@sunshineschool.edu.bd",
    website: "https://sunshineschool.edu.bd",
    currentAcademicYear: "2025-2026",
    academicYearStart: new Date(2026, 0, 1),
    academicYearEnd: new Date(2026, 11, 31),
    currency: "৳",
    workingDays: [0, 1, 2, 3, 4],
    periodsPerDay: 7,
    classStartTime: "08:00",
    classEndTime: "14:30",
    country: "Bangladesh",
    tagline: "Inspiring minds, shaping futures",
    motto: "Knowledge · Discipline · Service",
    foundedYear: 1985,
    about:
      "Sunshine Model High School is one of Bangladesh's premier educational institutions, committed to academic excellence and holistic development since 1985. Our state-of-the-art campus, dedicated faculty, and rigorous curriculum produce well-rounded students prepared for the challenges of tomorrow.",
    mission:
      "To provide quality education that nurtures intellectual curiosity, ethical values, and lifelong learning — empowering every student to become a responsible, creative, and contributing member of society.",
    vision:
      "To be the most respected school in Bangladesh — recognized globally for academic achievement, character building, and producing future leaders who serve humanity with integrity.",
    history:
      "Founded in 1985 with just 60 students and 6 teachers, Sunshine Model High School has grown into a vibrant community of over 1,200 students and 80+ faculty members. Our journey of four decades has been marked by countless achievements in academics, sports, and cultural pursuits.",
    principalName: "Dr. Md. Karim Uddin",
    principalMessage:
      "Welcome to Sunshine Model High School. Education here is more than textbooks and exams — it's about nurturing character, curiosity, and confidence. We believe every child has a unique spark, and our mission is to fuel that spark into a flame that lights up their future. I invite you to explore our community and join us on this remarkable journey.",
    principalPhotoUrl: "https://images.unsplash.com/photo-1559548331-f9cb98001426?w=400&h=400&fit=crop",
    heroImageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&h=900&fit=crop",
    facebookUrl: "https://facebook.com/sunshineschool",
    twitterUrl: "https://twitter.com/sunshineschool",
    youtubeUrl: "https://youtube.com/@sunshineschool",
    mapEmbedUrl: "https://www.openstreetmap.org/export/embed.html?bbox=90.37,23.74,90.39,23.76",
    totalStudents: 1200,
    totalTeachers: 85,
    awardsCount: 47,
    facilities: [
      "Smart Classrooms",
      "Science Laboratories",
      "Computer Lab",
      "Library (15,000+ books)",
      "Sports Ground",
      "Indoor Auditorium",
      "Medical Room",
      "Transport Service",
      "Cafeteria",
      "Prayer Room",
    ],
  });
  console.log("Seeded school settings");

  // ── Teacher-Class Assignments ─────────────────────────────────────────────
  console.log("\nSeeding teacher-class assignments…");
  const teacherClassData = [];
  // Teacher 1 (Nasrin - Science) → teaches Physics/Chemistry/Biology for 9 and 10
  for (const cls of [9, 10]) {
    for (const code of [`PHY${cls}01`, `CHE${cls}01`, `BIO${cls}01`]) {
      const subj = subjectDocs[cls].find((s) => s.code === code);
      if (!subj) continue;
      for (const sec of ["A", "B"]) {
        teacherClassData.push({
          teacher: teacherDocs[0]._id,
          classLevel: cls,
          section: sec,
          subject: subj._id,
          isClassTeacher: cls === 9 && sec === "A" && code.startsWith("PHY"),
        });
      }
    }
  }
  // Teacher 2 (Kamal - Math)
  for (const cls of [9, 10]) {
    const subj = subjectDocs[cls].find((s) => s.code === `MAT${cls}01`);
    if (!subj) continue;
    for (const sec of ["A", "B"]) {
      teacherClassData.push({
        teacher: teacherDocs[1]._id,
        classLevel: cls,
        section: sec,
        subject: subj._id,
        isClassTeacher: cls === 9 && sec === "B",
      });
    }
  }
  // Teacher 3 (Fatema - Language)
  for (const cls of [9, 10]) {
    for (const code of [`BAN${cls}01`, `ENG${cls}01`]) {
      const subj = subjectDocs[cls].find((s) => s.code === code);
      if (!subj) continue;
      for (const sec of ["A", "B"]) {
        teacherClassData.push({
          teacher: teacherDocs[2]._id,
          classLevel: cls,
          section: sec,
          subject: subj._id,
          isClassTeacher: cls === 10 && sec === "A" && code.startsWith("BAN"),
        });
      }
    }
  }
  // Teacher 4 (Rashed - ICT)
  for (const cls of [9, 10]) {
    const subj = subjectDocs[cls].find((s) => s.code === `ICT${cls}01`);
    if (!subj) continue;
    for (const sec of ["A", "B"]) {
      teacherClassData.push({
        teacher: teacherDocs[3]._id,
        classLevel: cls,
        section: sec,
        subject: subj._id,
        isClassTeacher: cls === 10 && sec === "B",
      });
    }
  }
  await TeacherClass.insertMany(teacherClassData, { ordered: false }).catch(() => {});
  console.log(`Seeded ${teacherClassData.length} teacher-class assignments`);

  // ── Timetable ─────────────────────────────────────────────────────────────
  console.log("\nSeeding timetable…");
  // Periods: 1=8:00-8:45, 2=8:50-9:35, 3=9:40-10:25, BREAK=10:25-10:55, 4=10:55-11:40, 5=11:45-12:30, 6=12:35-1:20, 7=1:25-2:10
  const periodTimes = [
    { p: 1, start: "08:00", end: "08:45" },
    { p: 2, start: "08:50", end: "09:35" },
    { p: 3, start: "09:40", end: "10:25" },
    { p: 4, start: "10:55", end: "11:40", afterBreak: true },
    { p: 5, start: "11:45", end: "12:30" },
    { p: 6, start: "12:35", end: "13:20" },
    { p: 7, start: "13:25", end: "14:10" },
  ];
  const subjectAssignments = {
    // Map each (class, section, day, period) to subject+teacher
    // Simple rotation: each weekday cycles through subjects
  };
  const timetableData = [];
  for (const cls of [9, 10]) {
    for (const sec of ["A", "B"]) {
      const subs = subjectDocs[cls];
      // Find teachers for this class+section
      const tclasses = teacherClassData.filter((tc) => tc.classLevel === cls && tc.section === sec);
      for (let day = 0; day <= 4; day++) {
        // 0=Sun … 4=Thu (working days)
        // Break between period 3 and 4
        timetableData.push({
          classLevel: cls,
          section: sec,
          dayOfWeek: day,
          periodNumber: 8, // place break as separate "slot" — use period 8 for tracking? Actually let's skip storing breaks as periods
          startTime: "10:25",
          endTime: "10:55",
          isBreak: true,
          breakLabel: "Tiffin Break",
          subject: null,
          teacher: null,
        });
        for (const pt of periodTimes) {
          const subj = subs[(day + pt.p - 1) % subs.length];
          const tc = tclasses.find((t) => t.subject?.toString() === subj._id.toString());
          timetableData.push({
            classLevel: cls,
            section: sec,
            dayOfWeek: day,
            periodNumber: pt.p,
            startTime: pt.start,
            endTime: pt.end,
            subject: subj._id,
            teacher: tc?.teacher || teacherDocs[0]._id,
            roomNumber: `${cls}${sec}-${100 + pt.p}`,
            isBreak: false,
          });
        }
      }
    }
  }
  // Upsert each one to avoid duplicate-key crashes (break uses periodNumber 8 unique per day/class/section)
  for (const slot of timetableData) {
    await Timetable.findOneAndUpdate(
      {
        classLevel: slot.classLevel,
        section: slot.section,
        dayOfWeek: slot.dayOfWeek,
        periodNumber: slot.periodNumber,
      },
      slot,
      { upsert: true, new: true }
    );
  }
  console.log(`Seeded ${timetableData.length} timetable slots`);

  // ── Fees ──────────────────────────────────────────────────────────────────
  console.log("\nSeeding fees…");
  const feeData = [];
  const currentMonth = today.getMonth() + 1;
  for (const student of studentDocs) {
    // Tuition fees for past 3 months
    for (let m = -2; m <= 1; m++) {
      const month = currentMonth + m;
      if (month < 1 || month > 12) continue;
      const isPast = m < 0;
      const isCurrent = m === 0;
      feeData.push({
        student: student._id,
        feeType: "Tuition",
        amount: 2500,
        month,
        year: currentYear,
        dueDate: new Date(currentYear, month - 1, 10),
        status: isPast ? "Paid" : isCurrent ? "Unpaid" : "Unpaid",
        paidAt: isPast ? new Date(currentYear, month - 1, 9) : null,
        paidAmount: isPast ? 2500 : 0,
        paymentMethod: isPast ? "Cash" : "",
        createdBy: adminDoc._id,
      });
    }
    // One-time exam fee (paid)
    feeData.push({
      student: student._id,
      feeType: "Exam",
      amount: 800,
      year: currentYear,
      dueDate: new Date(currentYear, 2, 15),
      status: "Paid",
      paidAt: new Date(currentYear, 2, 14),
      paidAmount: 800,
      paymentMethod: "Bkash",
      transactionId: `TXN${randInt(10000, 99999)}`,
      createdBy: adminDoc._id,
    });
    // Library fee (unpaid)
    feeData.push({
      student: student._id,
      feeType: "Library",
      amount: 300,
      year: currentYear,
      dueDate: new Date(currentYear, currentMonth, 20),
      status: "Unpaid",
      createdBy: adminDoc._id,
    });
  }
  await Fee.insertMany(feeData);
  console.log(`Seeded ${feeData.length} fee records`);

  // ── Notices ───────────────────────────────────────────────────────────────
  console.log("\nSeeding notices…");
  const noticesData = [
    {
      title: "Half-Yearly Examination Schedule Released",
      content: "The half-yearly examination will commence from June 10, 2026. Detailed schedule has been uploaded. Please collect admit cards from the office by June 5.",
      category: "Exam",
      priority: "important",
      isPinned: true,
      targetRoles: ["student", "teacher", "parent"],
      createdBy: adminDoc._id,
    },
    {
      title: "School Closed on Victory Day",
      content: "The school will remain closed on December 16 in observance of Victory Day. Special programs will be held on December 15.",
      category: "Holiday",
      priority: "normal",
      isPinned: false,
      targetRoles: ["student", "teacher", "parent", "admin"],
      createdBy: adminDoc._id,
    },
    {
      title: "Parent-Teacher Meeting — Class 9 & 10",
      content: "Parent-teacher meeting for Class 9 and 10 students will be held on Saturday, May 25 at 10:00 AM. All parents are requested to attend.",
      category: "Event",
      priority: "important",
      isPinned: true,
      targetRoles: ["parent", "teacher"],
      createdBy: adminDoc._id,
    },
    {
      title: "Tuition Fee Reminder — May",
      content: "May month tuition fee should be paid by May 10. Late payment will incur a fine of ৳100. Please pay through Bkash or visit the accounts office.",
      category: "Fee",
      priority: "normal",
      isPinned: false,
      targetRoles: ["student", "parent"],
      createdBy: adminDoc._id,
    },
    {
      title: "Annual Sports Day Registration Open",
      content: "Registration for Annual Sports Day is now open. Interested students should contact their class teacher by May 20. Events include 100m sprint, long jump, cricket, and football.",
      category: "Event",
      priority: "normal",
      isPinned: false,
      targetRoles: ["student", "teacher", "parent"],
      createdBy: teacherDocs[0]._id,
    },
    {
      title: "Library Book Return Reminder",
      content: "All students with overdue library books should return them by May 18 to avoid fines. Visit the library between 9 AM and 4 PM.",
      category: "General",
      priority: "normal",
      isPinned: false,
      targetRoles: ["student"],
      createdBy: adminDoc._id,
    },
    {
      title: "ICT Lab Maintenance",
      content: "The ICT lab will be closed for maintenance on May 17. Computer classes scheduled for that day will be rescheduled.",
      category: "Academic",
      priority: "normal",
      isPinned: false,
      targetRoles: ["student", "teacher"],
      createdBy: teacherDocs[3]._id,
    },
    {
      title: "Emergency Drill on May 20",
      content: "A fire safety drill will be conducted on May 20 at 11:00 AM. All staff and students must participate. Please follow instructions from the safety team.",
      category: "Emergency",
      priority: "urgent",
      isPinned: true,
      targetRoles: ["student", "teacher", "parent", "admin"],
      createdBy: adminDoc._id,
    },
  ];
  await Notice.insertMany(noticesData);
  console.log(`Seeded ${noticesData.length} notices`);

  // ── Events / Academic Calendar ───────────────────────────────────────────
  console.log("\nSeeding events…");
  const eventsData = [
    {
      title: "New Year's Day",
      eventType: "Holiday",
      startDate: new Date(2026, 0, 1),
      endDate: new Date(2026, 0, 1),
      isHoliday: true,
      createdBy: adminDoc._id,
    },
    {
      title: "International Mother Language Day",
      eventType: "Holiday",
      startDate: new Date(2026, 1, 21),
      endDate: new Date(2026, 1, 21),
      isHoliday: true,
      description: "School closed in observance of Ekushey February.",
      createdBy: adminDoc._id,
    },
    {
      title: "Independence Day",
      eventType: "Holiday",
      startDate: new Date(2026, 2, 26),
      endDate: new Date(2026, 2, 26),
      isHoliday: true,
      createdBy: adminDoc._id,
    },
    {
      title: "Class Test Week",
      eventType: "Exam",
      startDate: new Date(2026, 3, 5),
      endDate: new Date(2026, 3, 12),
      description: "Class Test for all classes.",
      createdBy: adminDoc._id,
    },
    {
      title: "Bengali New Year (Pohela Boishakh)",
      eventType: "Cultural",
      startDate: new Date(2026, 3, 14),
      endDate: new Date(2026, 3, 14),
      isHoliday: true,
      createdBy: adminDoc._id,
    },
    {
      title: "Half-Yearly Examination",
      eventType: "Exam",
      startDate: new Date(2026, 5, 10),
      endDate: new Date(2026, 5, 25),
      description: "Half-yearly examination for all classes.",
      createdBy: adminDoc._id,
    },
    {
      title: "Summer Vacation",
      eventType: "Vacation",
      startDate: new Date(2026, 6, 1),
      endDate: new Date(2026, 6, 15),
      isHoliday: true,
      createdBy: adminDoc._id,
    },
    {
      title: "Annual Sports Day",
      eventType: "Sports",
      startDate: new Date(2026, 10, 20),
      endDate: new Date(2026, 10, 20),
      description: "Inter-house sports competition.",
      createdBy: adminDoc._id,
    },
    {
      title: "Annual Cultural Function",
      eventType: "Cultural",
      startDate: new Date(2026, 11, 5),
      endDate: new Date(2026, 11, 5),
      createdBy: adminDoc._id,
    },
    {
      title: "Annual Examination",
      eventType: "Exam",
      startDate: new Date(2026, 11, 8),
      endDate: new Date(2026, 11, 22),
      description: "Annual examination for all classes.",
      createdBy: adminDoc._id,
    },
    {
      title: "Victory Day",
      eventType: "Holiday",
      startDate: new Date(2026, 11, 16),
      endDate: new Date(2026, 11, 16),
      isHoliday: true,
      createdBy: adminDoc._id,
    },
    {
      title: "Parent-Teacher Meeting",
      eventType: "Meeting",
      startDate: new Date(2026, 4, 25),
      endDate: new Date(2026, 4, 25),
      description: "Parent-teacher meeting for class 9 and 10.",
      targetRoles: ["parent", "teacher", "admin"],
      createdBy: adminDoc._id,
    },
  ];
  await Event.insertMany(eventsData);
  console.log(`Seeded ${eventsData.length} events`);

  // ── Leaves ────────────────────────────────────────────────────────────────
  console.log("\nSeeding leave requests…");
  const leaveData = [
    {
      applicant: studentDocs[0]._id,
      applicantRole: "student",
      leaveType: "Sick",
      startDate: new Date(today.getTime() - 7 * 86400000),
      endDate: new Date(today.getTime() - 5 * 86400000),
      reason: "Fever and weakness. Medical certificate attached.",
      status: "Approved",
      reviewedBy: teacherDocs[0]._id,
      reviewedAt: new Date(today.getTime() - 6 * 86400000),
      reviewNote: "Get well soon.",
    },
    {
      applicant: studentDocs[1]._id,
      applicantRole: "student",
      leaveType: "Family",
      startDate: new Date(today.getTime() + 3 * 86400000),
      endDate: new Date(today.getTime() + 5 * 86400000),
      reason: "Family wedding ceremony in hometown.",
      status: "Pending",
    },
    {
      applicant: studentDocs[7]._id,
      applicantRole: "student",
      leaveType: "Medical",
      startDate: new Date(today.getTime() - 2 * 86400000),
      endDate: new Date(today.getTime()),
      reason: "Dental surgery scheduled.",
      status: "Approved",
      reviewedBy: teacherDocs[1]._id,
      reviewedAt: new Date(today.getTime() - 3 * 86400000),
    },
    {
      applicant: teacherDocs[1]._id,
      applicantRole: "teacher",
      leaveType: "Personal",
      startDate: new Date(today.getTime() + 10 * 86400000),
      endDate: new Date(today.getTime() + 12 * 86400000),
      reason: "Personal work — government office visit required.",
      status: "Pending",
    },
  ];
  await Leave.insertMany(leaveData);
  console.log(`Seeded ${leaveData.length} leave requests`);

  // ── Library Books ─────────────────────────────────────────────────────────
  console.log("\nSeeding library books…");
  const bookData = [
    { title: "Padma Nadir Majhi", author: "Manik Bandopadhyay", category: "Fiction", totalCopies: 5, availableCopies: 4, shelfLocation: "A-1", publishYear: 1936 },
    { title: "Lalsalu", author: "Syed Waliullah", category: "Fiction", totalCopies: 4, availableCopies: 4, shelfLocation: "A-2", publishYear: 1948 },
    { title: "Gitanjali", author: "Rabindranath Tagore", category: "Poetry", totalCopies: 6, availableCopies: 5, shelfLocation: "B-1", publishYear: 1910 },
    { title: "Pather Panchali", author: "Bibhutibhushan Bandyopadhyay", category: "Fiction", totalCopies: 3, availableCopies: 3, shelfLocation: "A-3", publishYear: 1929 },
    { title: "Higher Mathematics", author: "Md. Ketab Uddin", category: "Mathematics", totalCopies: 10, availableCopies: 8, shelfLocation: "M-1", publishYear: 2020 },
    { title: "Physics for Class 10", author: "Dr. Shahjahan Tapan", category: "Science", totalCopies: 12, availableCopies: 10, shelfLocation: "S-1", publishYear: 2022 },
    { title: "Chemistry Fundamentals", author: "Dr. Hazari", category: "Science", totalCopies: 10, availableCopies: 9, shelfLocation: "S-2", publishYear: 2021 },
    { title: "English Grammar & Composition", author: "P.C. Das", category: "Language", totalCopies: 15, availableCopies: 13, shelfLocation: "L-1", publishYear: 2019 },
    { title: "World History", author: "John Smith", category: "History", totalCopies: 6, availableCopies: 6, shelfLocation: "H-1", publishYear: 2018 },
    { title: "Computer Science Basics", author: "Mahbubul Alam", category: "ICT", totalCopies: 8, availableCopies: 7, shelfLocation: "C-1", publishYear: 2023 },
    { title: "Bangladesh — A Brief History", author: "Muntassir Mamoon", category: "History", totalCopies: 5, availableCopies: 5, shelfLocation: "H-2", publishYear: 2015 },
    { title: "Bengali Poetry Collection", author: "Various", category: "Poetry", totalCopies: 4, availableCopies: 4, shelfLocation: "B-2", publishYear: 2010 },
  ].map((b) => ({ ...b, addedBy: adminDoc._id }));
  const insertedBooks = await Book.insertMany(bookData);
  console.log(`Seeded ${insertedBooks.length} library books`);

  // Some active book issues
  const bookIssueData = [
    {
      book: insertedBooks[0]._id,
      borrower: studentDocs[0]._id,
      borrowerRole: "student",
      issuedAt: new Date(today.getTime() - 5 * 86400000),
      dueDate: new Date(today.getTime() + 9 * 86400000),
      status: "Issued",
      issuedBy: adminDoc._id,
    },
    {
      book: insertedBooks[4]._id,
      borrower: studentDocs[2]._id,
      borrowerRole: "student",
      issuedAt: new Date(today.getTime() - 10 * 86400000),
      dueDate: new Date(today.getTime() + 4 * 86400000),
      status: "Issued",
      issuedBy: adminDoc._id,
    },
    {
      book: insertedBooks[5]._id,
      borrower: studentDocs[5]._id,
      borrowerRole: "student",
      issuedAt: new Date(today.getTime() - 15 * 86400000),
      dueDate: new Date(today.getTime() - 1 * 86400000),
      status: "Overdue",
      issuedBy: adminDoc._id,
    },
    {
      book: insertedBooks[7]._id,
      borrower: studentDocs[10]._id,
      borrowerRole: "student",
      issuedAt: new Date(today.getTime() - 30 * 86400000),
      dueDate: new Date(today.getTime() - 16 * 86400000),
      returnedAt: new Date(today.getTime() - 14 * 86400000),
      status: "Returned",
      fine: 10,
      issuedBy: adminDoc._id,
    },
  ];
  await BookIssue.insertMany(bookIssueData);
  console.log(`Seeded ${bookIssueData.length} book issues`);

  // ── Transport Routes ──────────────────────────────────────────────────────
  console.log("\nSeeding transport routes…");
  const routeData = [
    {
      routeName: "Route A — Dhanmondi",
      vehicleNumber: "DHK-METRO-12-3456",
      driverName: "Karim Mia",
      driverPhone: "01711000001",
      capacity: 30,
      isActive: true,
      stops: [
        { stopName: "Dhanmondi 27", pickupTime: "07:00", dropTime: "15:00", fare: 1500 },
        { stopName: "Dhanmondi 15", pickupTime: "07:10", dropTime: "15:10", fare: 1500 },
        { stopName: "Mirpur Road", pickupTime: "07:20", dropTime: "15:20", fare: 1800 },
      ],
    },
    {
      routeName: "Route B — Mohammadpur",
      vehicleNumber: "DHK-METRO-12-7890",
      driverName: "Rahim Sheikh",
      driverPhone: "01711000002",
      capacity: 28,
      isActive: true,
      stops: [
        { stopName: "Mohammadpur Bus Stand", pickupTime: "06:50", dropTime: "15:00", fare: 1600 },
        { stopName: "Asad Gate", pickupTime: "07:00", dropTime: "15:10", fare: 1600 },
        { stopName: "Shyamoli", pickupTime: "07:15", dropTime: "15:25", fare: 1700 },
      ],
    },
    {
      routeName: "Route C — Uttara",
      vehicleNumber: "DHK-METRO-15-1234",
      driverName: "Salam Hossain",
      driverPhone: "01711000003",
      capacity: 35,
      isActive: true,
      stops: [
        { stopName: "Uttara Sector 7", pickupTime: "06:30", dropTime: "15:30", fare: 2200 },
        { stopName: "Uttara Sector 4", pickupTime: "06:40", dropTime: "15:40", fare: 2200 },
        { stopName: "Airport Road", pickupTime: "06:55", dropTime: "15:55", fare: 2000 },
      ],
    },
  ];
  const insertedRoutes = await TransportRoute.insertMany(routeData);
  console.log(`Seeded ${insertedRoutes.length} transport routes`);

  // Student transport assignments (half of students use transport)
  const transportAssignments = [];
  studentDocs.slice(0, Math.floor(studentDocs.length / 2)).forEach((s, i) => {
    const route = insertedRoutes[i % insertedRoutes.length];
    transportAssignments.push({
      student: s._id,
      route: route._id,
      stopName: route.stops[i % route.stops.length].stopName,
      assignedBy: adminDoc._id,
    });
  });
  await StudentTransport.insertMany(transportAssignments);
  console.log(`Seeded ${transportAssignments.length} student transport assignments`);

  // ── Exam Schedules ────────────────────────────────────────────────────────
  console.log("\nSeeding exam schedules…");
  const examScheduleData = [];
  // Schedule for Half Yearly (exam id 2), June 2026
  const halfYearlyStart = new Date(2026, 5, 10);
  for (const cls of [9, 10]) {
    const subs = subjectDocs[cls];
    subs.forEach((subj, i) => {
      const examDate = new Date(halfYearlyStart);
      examDate.setDate(halfYearlyStart.getDate() + i);
      examScheduleData.push({
        exam: 2,
        subject: subj._id,
        classLevel: cls,
        section: null,
        examDate,
        startTime: "10:00",
        endTime: "13:00",
        roomNumber: `Hall-${cls}-${i + 1}`,
        totalMarks: 100,
        invigilator: teacherDocs[i % teacherDocs.length]._id,
      });
    });
  }
  await ExamSchedule.insertMany(examScheduleData);
  console.log(`Seeded ${examScheduleData.length} exam schedules`);

  // ── Syllabus ──────────────────────────────────────────────────────────────
  console.log("\nSeeding syllabus…");
  const academicYears = ["2024-2025", "2025-2026", "2026-2027"];
  const syllabusData = [];
  for (const year of academicYears) {
    for (const cls of [6, 7, 8, 9, 10]) {
      const subs = subjectDocs[cls] || [];
      for (const subj of subs) {
        syllabusData.push({
          title: `${subj.label} Syllabus — Class ${cls} (${year})`,
          classLevel: cls,
          subject: subj._id,
          academicYear: year,
          description: `Complete curriculum for ${subj.label} in Class ${cls} for academic year ${year}. Covers all topics for Class Test, Half-Yearly, and Annual examinations.`,
          chapters: [
            { title: "Chapter 1: Introduction", description: "Foundational concepts and basics", weeks: 2 },
            { title: "Chapter 2: Core Concepts", description: "Main topics with examples and exercises", weeks: 3 },
            { title: "Chapter 3: Advanced Topics", description: "Deeper exploration and applications", weeks: 3 },
            { title: "Chapter 4: Practice & Revision", description: "Practice problems and revision exercises", weeks: 2 },
            { title: "Chapter 5: Project Work", description: "Hands-on project work and presentations", weeks: 2 },
          ],
          fileUrl: "",
          createdBy: adminDoc._id,
        });
      }
    }
  }
  await Syllabus.insertMany(syllabusData);
  console.log(`Seeded ${syllabusData.length} syllabus records (${academicYears.length} years × 5 classes × 7 subjects)`);

  // ── Staff (for public website) ────────────────────────────────────────────
  console.log("\nSeeding public staff profiles…");
  const staffData = [
    {
      name: "Dr. Md. Karim Uddin",
      designation: "Principal",
      department: "Administration",
      email: "principal@sunshineschool.edu.bd",
      phone: "+880-1711-000001",
      bio: "Dr. Karim has over 30 years of experience in education. A PhD in Educational Leadership from University of Dhaka, he has been leading the school since 2010 with a vision of holistic education.",
      photoUrl: "https://images.unsplash.com/photo-1559548331-f9cb98001426?w=400&h=400&fit=crop",
      qualifications: ["PhD in Educational Leadership", "M.A. in English", "B.Ed."],
      yearsOfExperience: 30,
      joinedDate: new Date(2010, 0, 15),
      isPrincipal: true,
      displayOrder: 1,
    },
    {
      name: "Mrs. Nasrin Akhter",
      designation: "Vice Principal",
      department: "Administration",
      email: "viceprincipal@sunshineschool.edu.bd",
      phone: "+880-1711-000002",
      bio: "An experienced educator and administrator with a passion for curriculum development and student welfare.",
      photoUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop",
      qualifications: ["M.A. in Bangla", "B.Ed.", "Diploma in Educational Administration"],
      yearsOfExperience: 22,
      joinedDate: new Date(2012, 5, 1),
      isVicePrincipal: true,
      displayOrder: 2,
    },
    {
      name: "Mr. Shamsul Hoque",
      designation: "Head of Science Department",
      department: "Science",
      email: "science@sunshineschool.edu.bd",
      bio: "Specialist in physics and chemistry with several published papers on STEM education.",
      photoUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop",
      qualifications: ["M.Sc. in Physics", "B.Ed."],
      yearsOfExperience: 18,
      joinedDate: new Date(2014, 2, 10),
      isDepartmentHead: true,
      displayOrder: 10,
    },
    {
      name: "Ms. Tahmina Begum",
      designation: "Head of Mathematics Department",
      department: "Mathematics",
      email: "math@sunshineschool.edu.bd",
      bio: "Award-winning math teacher, mentor of national math olympiad winners.",
      photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
      qualifications: ["M.Sc. in Mathematics", "B.Ed."],
      yearsOfExperience: 15,
      joinedDate: new Date(2015, 6, 20),
      isDepartmentHead: true,
      displayOrder: 11,
    },
    {
      name: "Mr. Abdullah Rahman",
      designation: "Head of English Department",
      department: "English",
      email: "english@sunshineschool.edu.bd",
      bio: "Literature enthusiast, runs the school's debate and drama clubs.",
      photoUrl: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop",
      qualifications: ["M.A. in English Literature", "B.Ed.", "CELTA"],
      yearsOfExperience: 14,
      joinedDate: new Date(2016, 0, 12),
      isDepartmentHead: true,
      displayOrder: 12,
    },
    {
      name: "Ms. Roksana Khanam",
      designation: "Head of Bangla Department",
      department: "Bangla",
      email: "bangla@sunshineschool.edu.bd",
      bio: "Published poet and dedicated teacher of Bengali language and literature.",
      photoUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop",
      qualifications: ["M.A. in Bangla", "B.Ed."],
      yearsOfExperience: 17,
      joinedDate: new Date(2013, 8, 5),
      isDepartmentHead: true,
      displayOrder: 13,
    },
    {
      name: "Mr. Rashed Iqbal",
      designation: "Head of ICT Department",
      department: "ICT",
      email: "ict@sunshineschool.edu.bd",
      bio: "Champions modern technology integration in education and runs coding clubs for students.",
      photoUrl: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop",
      qualifications: ["B.Sc. in CSE", "M.Sc. in IT"],
      yearsOfExperience: 10,
      joinedDate: new Date(2018, 1, 1),
      isDepartmentHead: true,
      displayOrder: 14,
    },
    {
      name: "Mr. Anwar Hossain",
      designation: "Head of Sports Department",
      department: "Sports",
      bio: "Former national cricket player, coaches school teams in cricket, football, and athletics.",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      qualifications: ["B.A. in Physical Education", "National Sports Coaching License"],
      yearsOfExperience: 12,
      isDepartmentHead: true,
      displayOrder: 15,
    },
    {
      name: "Ms. Fatema Sultana",
      designation: "Senior Teacher",
      department: "Science",
      photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      qualifications: ["M.Sc. in Biology", "B.Ed."],
      yearsOfExperience: 9,
      displayOrder: 50,
    },
    {
      name: "Mr. Kamal Hassan",
      designation: "Senior Teacher",
      department: "Mathematics",
      photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      qualifications: ["M.Sc. in Mathematics", "B.Ed."],
      yearsOfExperience: 7,
      displayOrder: 51,
    },
    {
      name: "Ms. Sumi Akter",
      designation: "Librarian",
      department: "Library",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      qualifications: ["B.A. in Library Science"],
      yearsOfExperience: 6,
      displayOrder: 60,
    },
    {
      name: "Dr. Rina Begum",
      designation: "School Doctor",
      department: "Medical",
      photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
      qualifications: ["MBBS", "Diploma in Pediatrics"],
      yearsOfExperience: 12,
      displayOrder: 61,
    },
  ];
  await Staff.insertMany(staffData);
  console.log(`Seeded ${staffData.length} staff profiles`);

  // ── Gallery ───────────────────────────────────────────────────────────────
  console.log("\nSeeding gallery…");
  const galleryData = [
    { title: "School Campus", caption: "Main building with garden", category: "Campus", imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&h=600&fit=crop", displayOrder: 1 },
    { title: "Science Lab", caption: "Fully-equipped chemistry lab", category: "Academic", imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop", displayOrder: 2 },
    { title: "Library", caption: "Over 15,000 books at students' disposal", category: "Campus", imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop", displayOrder: 3 },
    { title: "Annual Sports Day", caption: "Inter-house athletics meet 2024", category: "Sports", imageUrl: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&h=600&fit=crop", displayOrder: 4 },
    { title: "Cultural Performance", caption: "Annual cultural night", category: "Cultural", imageUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop", displayOrder: 5 },
    { title: "Science Fair", caption: "Innovative student projects", category: "Academic", imageUrl: "https://images.unsplash.com/photo-1564644271277-b09f10ec1b7c?w=800&h=600&fit=crop", displayOrder: 6 },
    { title: "Computer Lab", caption: "Modern IT facilities", category: "Academic", imageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&h=600&fit=crop", displayOrder: 7 },
    { title: "Football Match", caption: "Inter-school championship", category: "Sports", imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800&h=600&fit=crop", displayOrder: 8 },
    { title: "Graduation Day", caption: "Class of 2024", category: "Events", imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop", displayOrder: 9 },
    { title: "Classroom Activity", caption: "Students engaged in group work", category: "Academic", imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop", displayOrder: 10 },
    { title: "Independence Day", caption: "March 26 celebrations", category: "Cultural", imageUrl: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&h=600&fit=crop", displayOrder: 11 },
    { title: "Field Trip", caption: "Visit to National Museum", category: "Events", imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop", displayOrder: 12 },
  ].map((g) => ({ ...g, isPublic: true, addedBy: adminDoc._id }));
  await Gallery.insertMany(galleryData);
  console.log(`Seeded ${galleryData.length} gallery items`);

  // ── Achievements ──────────────────────────────────────────────────────────
  console.log("\nSeeding achievements…");
  const achievementsData = [
    {
      title: "National Math Olympiad — Gold Medal",
      description: "Our student Ahmed Rahman won the Gold medal in the National Math Olympiad 2024 organized by the Math Olympiad Committee of Bangladesh.",
      category: "Academic",
      achievedOn: new Date(2024, 2, 15),
      awardedBy: "Math Olympiad Committee of Bangladesh",
      iconUrl: "🏆",
    },
    {
      title: "Inter-School Football Champions",
      description: "Our school football team won the inter-school championship for the third consecutive year, defeating 12 schools.",
      category: "Sports",
      achievedOn: new Date(2024, 5, 20),
      awardedBy: "Dhaka District Sports Association",
      iconUrl: "⚽",
    },
    {
      title: "National Science Fair — 1st Position",
      description: "Project on renewable energy by our Class 10 students secured 1st position at the national science fair.",
      category: "Science",
      achievedOn: new Date(2024, 8, 10),
      awardedBy: "Ministry of Science and Technology",
      iconUrl: "🔬",
    },
    {
      title: "Best School Award 2024",
      description: "Recognized as one of the top 10 schools in Bangladesh by the Education Times annual awards.",
      category: "Award",
      achievedOn: new Date(2024, 11, 1),
      awardedBy: "Education Times Bangladesh",
      iconUrl: "🌟",
    },
    {
      title: "International Debate Championship",
      description: "School debate team reached the semi-finals at the Asia-Pacific Schools Debate Championship in Singapore.",
      category: "Cultural",
      achievedOn: new Date(2024, 9, 25),
      awardedBy: "Asia-Pacific Debate Federation",
      iconUrl: "🎤",
    },
    {
      title: "100% SSC Pass Rate",
      description: "Achieved 100% pass rate in the SSC examination 2024 with 65% students securing GPA 5.",
      category: "Academic",
      achievedOn: new Date(2024, 4, 30),
      awardedBy: "Dhaka Education Board",
      iconUrl: "🎓",
    },
    {
      title: "National Art Competition Winner",
      description: "Mim Chowdhury (Class 9) won the national painting competition organized by Shilpakala Academy.",
      category: "Cultural",
      achievedOn: new Date(2024, 6, 18),
      awardedBy: "Bangladesh Shilpakala Academy",
      iconUrl: "🎨",
    },
    {
      title: "Eco-Schools Green Flag",
      description: "Awarded the prestigious Green Flag for environmental excellence and student-led sustainability initiatives.",
      category: "Award",
      achievedOn: new Date(2023, 10, 12),
      awardedBy: "Foundation for Environmental Education",
      iconUrl: "🌿",
    },
  ].map((a) => ({ ...a, isPublic: true, addedBy: adminDoc._id }));
  await Achievement.insertMany(achievementsData);
  console.log(`Seeded ${achievementsData.length} achievements`);

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  SEED COMPLETE");
  console.log("═══════════════════════════════════════════════════");
  console.log("\nDemo accounts:");
  console.log("  admin      admin@school.com       / admin123");
  console.log("  teacher    teacher@school.com      / teacher123");
  console.log("  teacher2   teacher2@school.com     / teacher123");
  console.log("  teacher3   teacher3@school.com     / teacher123");
  console.log("  teacher4   teacher4@school.com     / teacher123");
  console.log("  student    student@school.com      / student123  (9A Roll 1)");
  console.log("  parent     parent@school.com       / parent123   (parent of Ahmed)");
  console.log("  parent2    parent2@school.com      / parent123   (parent of Mim)");
  console.log("\nSubjects: class-specific (no global subjects)");
  console.log("Exams order: Class Test → Half Yearly → Annual");
  console.log("═══════════════════════════════════════════════════\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
