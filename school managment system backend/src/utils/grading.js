/**
 * Bangladesh SSC-style grade scale.
 * percentage = (earned / maxPossible) * 100
 * maxPossible = 100 for non-practical subjects, 125 for practical subjects.
 */
const calculateGrade = (earnedMarks, hasPractical = false) => {
  const max = hasPractical ? 125 : 100;
  const pct = (earnedMarks / max) * 100;

  if (pct >= 80) return { gpa: 5.0, letterGrade: "A+" };
  if (pct >= 70) return { gpa: 4.0, letterGrade: "A" };
  if (pct >= 60) return { gpa: 3.5, letterGrade: "A-" };
  if (pct >= 50) return { gpa: 3.0, letterGrade: "B" };
  if (pct >= 40) return { gpa: 2.0, letterGrade: "C" };
  if (pct >= 33) return { gpa: 1.0, letterGrade: "D" };
  return { gpa: 0.0, letterGrade: "F" };
};

const gpaToLetter = (gpa) => {
  if (gpa >= 5.0) return "A+";
  if (gpa >= 4.0) return "A";
  if (gpa >= 3.5) return "A-";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.0) return "C";
  if (gpa >= 1.0) return "D";
  return "F";
};

module.exports = { calculateGrade, gpaToLetter };
