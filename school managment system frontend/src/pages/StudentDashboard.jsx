import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import { PageLoader } from "../components/Skeleton";
import { EXAMS } from "../constants";
import { attendanceApi, resultsApi, assignmentApi } from "../api";

function computeGpa(rows) {
  const valid = rows.filter((r) => r.gpa != null);
  if (!valid.length) return null;
  return (valid.reduce((s, r) => s + r.gpa, 0) / valid.length).toFixed(2);
}

function GpaRing({ gpa, size = 110 }) {
  const pct = gpa ? Math.min((parseFloat(gpa) / 5) * 100, 100) : 0;
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const stop1 = pct >= 80 ? "#34d399" : pct >= 60 ? "#818cf8" : pct >= 40 ? "#fbbf24" : "#fb7185";
  const stop2 = pct >= 80 ? "#10b981" : pct >= 60 ? "#6366f1" : pct >= 40 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={`gpa-grad-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={stop1} />
            <stop offset="100%" stopColor={stop2} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#gpa-grad-${size})`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-slate-900 leading-none">{gpa ?? "—"}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">GPA / 5</p>
      </div>
    </div>
  );
}

function AttendanceBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} />
      </div>
    </div>
  );
}

function StatTile({ label, value, sub, icon, gradient }) {
  return (
    <div className="surface surface-hover relative overflow-hidden p-4 sm:p-5">
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
      <div className="relative">
        <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
          {icon}
        </div>
        <p className="h-eyebrow">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

function QuickAction({ to, label, icon, gradient }) {
  return (
    <Link
      to={to}
      className="group surface surface-hover flex items-center gap-3 p-4 text-left"
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-500">Tap to open</p>
      </div>
      <svg className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </Link>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [expandedExam, setExpandedExam] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [examData, setExamData] = useState({});
  const [assignmentStats, setAssignmentStats] = useState(null);

  useEffect(() => {
    const now = new Date();
    attendanceApi
      .myAttendance({ month: now.getMonth() + 1, year: now.getFullYear() })
      .then((res) => setAttendance(res.data.summary))
      .catch(() => setAttendance({ percentage: 0, present: 0, absent: 0, late: 0, total: 0 }));

    assignmentApi.myStats().then((r) => setAssignmentStats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all(EXAMS.map((e) => resultsApi.myResult(e.id).catch(() => null))).then((responses) => {
      const data = {};
      responses.forEach((res, i) => {
        const subjects = res?.data?.subjects ?? [];
        const gpa = res?.data?.gpa != null ? String(res.data.gpa) : computeGpa(subjects);
        data[EXAMS[i].id] = { rows: subjects, gpa };
      });
      setExamData(data);
    });
  }, []);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ");
  const firstName = displayName.split(" ")[0] || "Student";
  const validGpas = EXAMS.map((e) => examData[e.id]?.gpa).filter(Boolean).map(Number);
  const bestGpa = validGpas.length ? Math.max(...validGpas).toFixed(2) : "—";
  const latestGpa = examData[EXAMS[EXAMS.length - 1]?.id]?.gpa ?? examData[1]?.gpa ?? null;
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  return (
    <Sidebar title="Dashboard">
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-4 sm:space-y-6 sm:p-6 lg:p-8">
        {/* Hero greeting */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 px-5 py-6 text-white shadow-xl shadow-sky-500/20 sm:px-7 sm:py-7">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200">{greeting}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Hello, {firstName} 👋
              </h1>
              <p className="mt-1 text-sm text-sky-100">
                Class {user?.class_level} · Section {user?.section} · Roll {user?.roll_number}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-200">Today</p>
                <p className="text-sm font-bold">
                  {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile
            label="Latest GPA"
            value={latestGpa ?? "—"}
            sub={`out of 5.00`}
            gradient="from-indigo-500 to-violet-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            }
          />
          <StatTile
            label="Best GPA"
            value={bestGpa}
            sub="Across all exams"
            gradient="from-emerald-500 to-teal-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
            }
          />
          <StatTile
            label="Attendance"
            value={attendance ? `${attendance.percentage}%` : "—"}
            sub="This month"
            gradient="from-sky-500 to-cyan-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            }
          />
          <StatTile
            label="Assignments"
            value={assignmentStats ? `${assignmentStats.submitted}/${assignmentStats.total}` : "—"}
            sub={assignmentStats ? `${assignmentStats.completion_rate}% done` : ""}
            gradient="from-amber-500 to-orange-600"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Profile + attendance breakdown + GPA ring */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Profile */}
          <div className="surface relative overflow-hidden p-5">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sky-500/10 blur-2xl" />
            <p className="h-eyebrow">Profile</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-lg font-bold text-white shadow-lg shadow-sky-500/30">
                {firstName[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-900">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {[
                { label: "Roll No.", value: user?.roll_number },
                { label: "Class", value: `${user?.class_level} — ${user?.section}` },
                { label: "Phone", value: user?.phone || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2">
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="text-xs font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Attendance */}
          <div className="surface relative overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <p className="h-eyebrow">Attendance · This Month</p>
              <Link to="/student/attendance" className="text-[11px] font-semibold text-sky-600 hover:text-sky-700">
                View all →
              </Link>
            </div>
            {attendance === null ? (
              <div className="mt-6 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-200 border-t-sky-600" />
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-4 flex items-end gap-1">
                  <span className="bg-gradient-to-br from-sky-500 to-blue-600 bg-clip-text text-4xl font-bold text-transparent">
                    {attendance.percentage}%
                  </span>
                  <span className="mb-1 text-xs text-slate-400">present rate</span>
                </div>
                <div className="space-y-3">
                  <AttendanceBar label="Present" value={attendance.present} max={attendance.total} color="bg-gradient-to-r from-emerald-400 to-emerald-500" />
                  <AttendanceBar label="Absent" value={attendance.absent} max={attendance.total} color="bg-gradient-to-r from-rose-400 to-rose-500" />
                  <AttendanceBar label="Late" value={attendance.late} max={attendance.total} color="bg-gradient-to-r from-amber-400 to-amber-500" />
                </div>
                <p className="mt-3 text-[11px] text-slate-400">{attendance.total} school days · {now.toLocaleDateString("en-US", { month: "long" })}</p>
              </div>
            )}
          </div>

          {/* GPA ring */}
          <div className="surface relative flex flex-col items-center justify-center overflow-hidden p-5">
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
            <p className="h-eyebrow">Current GPA</p>
            <div className="my-3">
              <GpaRing gpa={latestGpa} size={130} />
            </div>
            <p className="text-center text-xs text-slate-500">
              From <span className="font-semibold text-slate-700">{EXAMS[EXAMS.length - 1]?.label || EXAMS[0]?.label}</span>
            </p>
            <Link to="/student/progress" className="mt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
              See full progress →
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="mb-3 px-1 text-sm font-bold uppercase tracking-wider text-slate-500">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <QuickAction
              to="/student/assignments"
              label="Assignments"
              gradient="from-amber-500 to-orange-600"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <QuickAction
              to="/student/timetable"
              label="Timetable"
              gradient="from-violet-500 to-purple-600"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <QuickAction
              to="/syllabus"
              label="Syllabus"
              gradient="from-emerald-500 to-teal-600"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              }
            />
            <QuickAction
              to="/student/fees"
              label="Fee Status"
              gradient="from-rose-500 to-pink-600"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 12a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V12zm-12 0h.008v.008H6V12z" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Exam Results */}
        <div className="surface">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Exam Results</h2>
              <p className="mt-0.5 text-xs text-slate-500">Tap an exam to see subject-wise marks</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {EXAMS.map((exam, i) => {
              const entry = examData[exam.id] ?? { rows: [], gpa: null };
              const isExpanded = expandedExam === exam.id;
              const hasData = entry.rows.length > 0;
              const gradients = ["from-sky-500 to-blue-600", "from-violet-500 to-purple-600", "from-emerald-500 to-teal-600"];
              return (
                <div key={exam.id}>
                  <button
                    type="button"
                    onClick={() => hasData && setExpandedExam(isExpanded ? null : exam.id)}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors sm:px-6 ${
                      hasData ? "cursor-pointer hover:bg-slate-50/70" : "cursor-default"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-md ${
                          hasData ? `bg-gradient-to-br ${gradients[i]} text-white` : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {exam.id}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">{exam.label}</p>
                        {hasData ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {entry.rows.length} subjects · {isExpanded ? "Tap to collapse" : "Tap to expand"}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-amber-600">Not yet published</p>
                        )}
                      </div>
                    </div>
                    {hasData && (
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-2xl font-bold text-transparent tabular-nums">
                            {entry.gpa ?? "--"}
                          </p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">GPA</p>
                        </div>
                        <svg
                          className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    )}
                  </button>
                  {isExpanded && hasData && (
                    <div className="animate-slide-down border-t border-slate-100 bg-slate-50/60">
                      {/* Mobile: cards */}
                      <div className="space-y-2 p-4 sm:hidden">
                        {entry.rows.map((row, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-semibold text-slate-900">{row.subject_name}</p>
                              <span className="chip bg-indigo-100 text-indigo-700">{row.letter_grade}</span>
                            </div>
                            <div className="mt-2 grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-[9px] uppercase text-slate-400">Written</p>
                                <p className="text-sm font-semibold text-slate-700">{row.marks_written}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase text-slate-400">MCQ</p>
                                <p className="text-sm font-semibold text-slate-700">{row.marks_mcq}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase text-slate-400">Total</p>
                                <p className="text-sm font-bold text-slate-900">{row.total_marks}</p>
                              </div>
                              <div>
                                <p className="text-[9px] uppercase text-slate-400">GP</p>
                                <p className="bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-sm font-bold text-transparent">{(row.gpa ?? 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Desktop: table */}
                      <div className="hidden overflow-x-auto sm:block">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="bg-slate-100/70">
                              {["Subject", "Written", "MCQ", "Practical", "Total", "Grade", "GP"].map((h) => (
                                <th key={h} className="px-6 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {entry.rows.map((row, idx) => (
                              <tr key={idx} className="transition-colors hover:bg-white">
                                <td className="px-6 py-3 font-medium text-slate-900">{row.subject_name}</td>
                                <td className="px-6 py-3 text-slate-600">{row.marks_written}</td>
                                <td className="px-6 py-3 text-slate-600">{row.marks_mcq}</td>
                                <td className="px-6 py-3 text-slate-600">{row.marks_practical || "—"}</td>
                                <td className="px-6 py-3 font-semibold text-slate-900">{row.total_marks}</td>
                                <td className="px-6 py-3">
                                  <span className="chip bg-indigo-100 text-indigo-700">{row.letter_grade}</span>
                                </td>
                                <td className="px-6 py-3 font-bold text-indigo-600">{(row.gpa ?? 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
