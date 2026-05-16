import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

/* ── Icon registry ─────────────────────────────────────────── */
const IC = {
  dashboard: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  calendar: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5",
  pencil: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10",
  chart: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  document: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
  users: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  child: "M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z",
  logout: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75",
  menu: "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5",
  bell: "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  money: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 12a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V12zm-12 0h.008v.008H6V12z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  book: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  trend: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941",
  star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  task: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
  subject: "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25",
  search: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  close: "M6 18L18 6M6 6l12 12",
  chevron: "M8.25 4.5l7.5 7.5-7.5 7.5",
  settings: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
};

function NavIcon({ name, className = "h-5 w-5" }) {
  return (
    <svg className={`shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d={IC[name] || IC.dashboard} />
    </svg>
  );
}

/* ── Navigation config ───────────────────────────────────── */
const NAV = {
  student: [
    {
      group: "Overview",
      items: [
        { to: "/student", label: "Dashboard", icon: "dashboard" },
        { to: "/student/progress", label: "My Progress", icon: "trend" },
      ],
    },
    {
      group: "Academics",
      items: [
        { to: "/student/attendance", label: "Attendance", icon: "calendar" },
        { to: "/student/assignments", label: "Assignments", icon: "task" },
        { to: "/student/timetable", label: "Timetable", icon: "clock" },
        { to: "/student/exams", label: "Exam Schedule", icon: "document" },
        { to: "/syllabus", label: "Syllabus", icon: "book" },
      ],
    },
    {
      group: "Services",
      items: [
        { to: "/student/fees", label: "Fee Status", icon: "money" },
        { to: "/library", label: "Library", icon: "book" },
        { to: "/student/transport", label: "Transport", icon: "calendar" },
        { to: "/leaves", label: "Leave Requests", icon: "document" },
      ],
    },
    {
      group: "Information",
      items: [
        { to: "/notices", label: "Notice Board", icon: "bell" },
        { to: "/calendar", label: "Calendar", icon: "star" },
      ],
    },
  ],
  teacher: [
    {
      group: "Marks & Results",
      items: [
        { to: "/teacher/marks", label: "Marks Entry", icon: "pencil" },
        { to: "/teacher/gradebook", label: "Grade Book", icon: "book" },
        { to: "/teacher/results", label: "Section Results", icon: "chart" },
        { to: "/exams", label: "Exam Schedule", icon: "document" },
      ],
    },
    {
      group: "Classroom",
      items: [
        { to: "/teacher/assignments", label: "Assignments", icon: "task" },
        { to: "/teacher/attendance", label: "Attendance", icon: "calendar" },
        { to: "/teacher/timetable", label: "My Timetable", icon: "clock" },
        { to: "/syllabus", label: "Syllabus", icon: "book" },
      ],
    },
    {
      group: "Management",
      items: [
        { to: "/teacher/parent-link", label: "Parent Linking", icon: "child" },
        { to: "/leaves", label: "Leave Requests", icon: "document" },
        { to: "/library", label: "Library", icon: "book" },
      ],
    },
    {
      group: "Information",
      items: [
        { to: "/notices", label: "Notice Board", icon: "bell" },
        { to: "/calendar", label: "Calendar", icon: "star" },
      ],
    },
  ],
  parent: [
    { group: "Overview", items: [{ to: "/parent", label: "Dashboard", icon: "dashboard" }] },
    {
      group: "Services",
      items: [
        { to: "/parent/fees", label: "Fee Status", icon: "money" },
        { to: "/syllabus", label: "Syllabus", icon: "book" },
      ],
    },
    {
      group: "Information",
      items: [
        { to: "/notices", label: "Notice Board", icon: "bell" },
        { to: "/calendar", label: "Calendar", icon: "star" },
      ],
    },
  ],
  admin: [
    {
      group: "Overview",
      items: [
        { to: "/admin", label: "Dashboard", icon: "dashboard" },
        { to: "/admin/users", label: "Users", icon: "users" },
        { to: "/admin/parent-link", label: "Parent Links", icon: "child" },
      ],
    },
    {
      group: "Academics",
      items: [
        { to: "/admin/subjects", label: "Subjects", icon: "subject" },
        { to: "/admin/teacher-classes", label: "Teacher Assignments", icon: "users" },
        { to: "/admin/timetable", label: "Timetable Editor", icon: "clock" },
        { to: "/exams", label: "Exam Schedule", icon: "document" },
        { to: "/syllabus", label: "Syllabus", icon: "book" },
      ],
    },
    {
      group: "Operations",
      items: [
        { to: "/admin/fees", label: "Fee Management", icon: "money" },
        { to: "/library", label: "Library", icon: "book" },
        { to: "/transport", label: "Transport", icon: "calendar" },
        { to: "/leaves", label: "Leave Requests", icon: "document" },
      ],
    },
    {
      group: "Reports",
      items: [{ to: "/attendance/report", label: "Attendance Report", icon: "document" }],
    },
    {
      group: "System",
      items: [
        { to: "/notices", label: "Notice Board", icon: "bell" },
        { to: "/calendar", label: "Calendar", icon: "star" },
        { to: "/admin/website", label: "Public Website", icon: "star" },
        { to: "/admin/settings", label: "School Settings", icon: "settings" },
      ],
    },
  ],
};

const BOTTOM_NAV = {
  student: [
    { to: "/student", label: "Home", icon: "dashboard" },
    { to: "/student/progress", label: "Progress", icon: "trend" },
    { to: "/student/assignments", label: "Tasks", icon: "task" },
    { to: "/student/timetable", label: "Schedule", icon: "clock" },
  ],
  teacher: [
    { to: "/teacher/marks", label: "Marks", icon: "pencil" },
    { to: "/teacher/attendance", label: "Attend", icon: "calendar" },
    { to: "/teacher/assignments", label: "Tasks", icon: "task" },
    { to: "/teacher/timetable", label: "Schedule", icon: "clock" },
  ],
  parent: [
    { to: "/parent", label: "Home", icon: "dashboard" },
    { to: "/parent/fees", label: "Fees", icon: "money" },
    { to: "/notices", label: "Notices", icon: "bell" },
    { to: "/calendar", label: "Events", icon: "star" },
  ],
  admin: [
    { to: "/admin", label: "Home", icon: "dashboard" },
    { to: "/admin/users", label: "Users", icon: "users" },
    { to: "/admin/fees", label: "Fees", icon: "money" },
    { to: "/admin/timetable", label: "Schedule", icon: "clock" },
  ],
};

const ROLE_THEME = {
  student: {
    grad: "from-sky-500 to-blue-600",
    gradSubtle: "from-sky-500/20 to-blue-600/20",
    accent: "bg-sky-500",
    text: "text-sky-500",
    glow: "shadow-sky-500/30",
  },
  teacher: {
    grad: "from-violet-500 to-purple-600",
    gradSubtle: "from-violet-500/20 to-purple-600/20",
    accent: "bg-violet-500",
    text: "text-violet-500",
    glow: "shadow-violet-500/30",
  },
  parent: {
    grad: "from-amber-500 to-orange-600",
    gradSubtle: "from-amber-500/20 to-orange-600/20",
    accent: "bg-amber-500",
    text: "text-amber-500",
    glow: "shadow-amber-500/30",
  },
  admin: {
    grad: "from-indigo-500 to-indigo-700",
    gradSubtle: "from-indigo-500/20 to-indigo-700/20",
    accent: "bg-indigo-500",
    text: "text-indigo-500",
    glow: "shadow-indigo-500/30",
  },
};

function getInitials(user) {
  if (user?.first_name && user?.last_name)
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
  return (user?.username?.[0] ?? "U").toUpperCase();
}

export default function Sidebar({ children, title }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const role = user?.role || "student";
  const groups = NAV[role] ?? [];
  const bottomItems = BOTTOM_NAV[role] ?? [];
  const theme = ROLE_THEME[role] ?? ROLE_THEME.student;

  useEffect(() => {
    setDrawerOpen(false);
    setSearch("");
  }, [location.pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [drawerOpen]);

  const isActive = (to) => location.pathname === to;

  // Filter nav by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, search]);

  const currentTitle = useMemo(() => {
    for (const g of groups) {
      const found = g.items.find((i) => i.to === location.pathname);
      if (found) return found.label;
    }
    return title || "EduPortal";
  }, [groups, location.pathname, title]);

  const NavContent = ({ onClose, fullscreen = false }) => (
    <div className="relative flex h-full flex-col overflow-hidden bg-slate-950 text-slate-300">
      {/* Decorative glow */}
      <div className={`pointer-events-none absolute -left-12 top-0 h-56 w-56 rounded-full bg-gradient-to-br ${theme.grad} opacity-20 blur-3xl`} />
      <div className={`pointer-events-none absolute -right-16 top-1/2 h-48 w-48 rounded-full bg-gradient-to-br ${theme.grad} opacity-10 blur-3xl`} />

      {/* Drag handle (only when fullscreen mobile drawer) */}
      {fullscreen && (
        <div className="flex shrink-0 justify-center pt-2 safe-top">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>
      )}

      {/* Brand — generous spacing; safe-top guarantees the iOS notch doesn't cut */}
      <div className={`relative flex shrink-0 items-center gap-3 border-b border-white/5 px-5 ${fullscreen ? "pb-4 pt-4" : "pb-5 pt-7 safe-top sm:pb-4 sm:pt-6"}`}>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.grad} text-base font-extrabold text-white shadow-xl ${theme.glow}`}>
          E
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold tracking-tight text-white">EduPortal</p>
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">School Suite</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-slate-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95 lg:hidden"
            aria-label="Close menu"
          >
            <NavIcon name="close" className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User card */}
      <div className="relative shrink-0 border-b border-white/5 px-4 py-3.5">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10">
          <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${theme.grad} text-xs font-bold text-white shadow-lg ${theme.glow}`}>
            {getInitials(user)}
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-white">
              {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username}
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              {role} · {user?.class_level ? `Class ${user.class_level}-${user.section}` : "Active"}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative shrink-0 border-b border-white/5 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 transition-all focus-within:bg-white/[0.07] focus-within:ring-white/20">
          <NavIcon name="search" className="h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search menu…"
            className="w-full bg-transparent text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ fontSize: "14px" }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-500 transition-colors hover:text-white">
              <NavIcon name="close" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation — scroll area */}
      <nav className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-dark px-3 pb-8 pt-5 sm:pt-4">
        <div className="space-y-5">
          {filteredGroups.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-slate-500">No matches</p>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.group}>
                <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  {group.group}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((link) => {
                    const active = isActive(link.to);
                    return (
                      <Link
                        key={link.to}
                        to={link.to}
                        className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 active:scale-[0.98] ${
                          active
                            ? `bg-gradient-to-r ${theme.grad} text-white shadow-lg ${theme.glow}`
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-white/80" />
                        )}
                        <NavIcon name={link.icon} className="h-[17px] w-[17px]" />
                        <span className="flex-1 truncate">{link.label}</span>
                        {active && <NavIcon name="chevron" className="h-3.5 w-3.5 opacity-70" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </nav>

      {/* Sign out — pinned with explicit safe-area for iOS home-indicator */}
      <div className="relative shrink-0 border-t border-white/5 bg-slate-950/95 backdrop-blur-sm px-3 pt-3 pb-3 safe-bottom">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold text-slate-400 transition-all hover:bg-rose-500/10 hover:text-rose-400 active:scale-[0.98]"
        >
          <NavIcon name="logout" className="h-[17px] w-[17px]" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="relative hidden w-[240px] shrink-0 overflow-hidden lg:block">
        <NavContent />
      </aside>

      {/* Mobile drawer — full-screen with spring physics */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-slate-950 lg:hidden"
            style={{ height: "100dvh" }}
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 32, mass: 0.8 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.18 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) setDrawerOpen(false);
              }}
              className="h-full w-full overflow-hidden"
              style={{ height: "100dvh" }}
            >
              <NavContent onClose={() => setDrawerOpen(false)} fullscreen />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="glass sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200/60 px-4 safe-top lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="-ml-2 rounded-xl p-2 text-slate-700 transition-colors hover:bg-slate-100 active:bg-slate-200"
            aria-label="Open menu"
          >
            <NavIcon name="menu" className="h-6 w-6" />
          </button>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-3">
            <span className="truncate text-[15px] font-bold text-slate-900">{currentTitle}</span>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${theme.grad} text-[11px] font-bold text-white shadow-md ${theme.glow}`}>
            {getInitials(user)}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0">
          {children}
        </main>

        {/* Mobile bottom navigation — smooth pill indicator + spring physics */}
        <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/50 safe-bottom shadow-[0_-4px_24px_-8px_rgba(15,23,42,0.08)] lg:hidden">
          <div className="relative mx-auto flex max-w-md items-stretch px-2 py-2">
            {[...bottomItems, { to: "__more__", label: "More", icon: "menu" }].map((item, idx) => {
              const isMore = item.to === "__more__";
              const active = !isMore && isActive(item.to);

              const Inner = (
                <>
                  {/* Animated active pill underlay */}
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-pill"
                      className={`absolute inset-x-1 inset-y-1 -z-10 rounded-2xl bg-gradient-to-br ${theme.grad} shadow-lg ${theme.glow}`}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    className="flex h-6 w-9 items-center justify-center"
                  >
                    <NavIcon
                      name={item.icon}
                      className={`transition-all duration-300 ${active ? "h-[20px] w-[20px] text-white" : "h-[19px] w-[19px] text-slate-500"}`}
                    />
                  </motion.div>

                  <motion.span
                    animate={{
                      opacity: active ? 1 : 0.7,
                      y: active ? 0 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                    className={`text-[10px] font-bold tracking-wide transition-colors ${
                      active ? "text-white" : "text-slate-500"
                    }`}
                  >
                    {item.label}
                  </motion.span>
                </>
              );

              if (isMore) {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="group relative flex flex-1 flex-col items-center justify-center rounded-2xl py-1.5"
                  >
                    {Inner}
                  </button>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5"
                >
                  {Inner}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
