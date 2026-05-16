// Exam order: Class Test → Half Yearly → Annual (as per user requirement)
export const EXAMS = [
  { id: 1, label: "Class Test" },
  { id: 2, label: "Half Yearly" },
  { id: 3, label: "Annual" },
];

export const CLASS_LEVELS = [6, 7, 8, 9, 10];

export const SECTIONS_LIST = ["A", "B", "C", "D"];

export const SECTIONS = [
  { label: "6A", classLevel: 6, section: "A" },
  { label: "6B", classLevel: 6, section: "B" },
  { label: "7A", classLevel: 7, section: "A" },
  { label: "7B", classLevel: 7, section: "B" },
  { label: "8A", classLevel: 8, section: "A" },
  { label: "8B", classLevel: 8, section: "B" },
  { label: "9A", classLevel: 9, section: "A" },
  { label: "9B", classLevel: 9, section: "B" },
  { label: "9C", classLevel: 9, section: "C" },
  { label: "10A", classLevel: 10, section: "A" },
  { label: "10B", classLevel: 10, section: "B" },
  { label: "10C", classLevel: 10, section: "C" },
];

export const MARK_FIELDS = [
  { field: "marks_written", label: "Written", max: 75, header: "Written /75" },
  { field: "marks_mcq", label: "MCQ", max: 25, header: "MCQ /25" },
  { field: "marks_practical", label: "Practical", max: 25, header: "Practical /25" },
];

export const STATUS_STYLES = {
  Present: {
    badge: "bg-emerald-100 text-emerald-700",
    active: "border-emerald-500 bg-emerald-50 text-emerald-700",
    inactive:
      "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/50",
  },
  Absent: {
    badge: "bg-rose-100 text-rose-700",
    active: "border-rose-500 bg-rose-50 text-rose-700",
    inactive:
      "border-slate-200 bg-white text-slate-500 hover:border-rose-300 hover:bg-rose-50/50",
  },
  Late: {
    badge: "bg-amber-100 text-amber-700",
    active: "border-amber-500 bg-amber-50 text-amber-700",
    inactive:
      "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:bg-amber-50/50",
  },
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
