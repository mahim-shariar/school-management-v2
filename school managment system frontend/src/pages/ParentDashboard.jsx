import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { PageLoader } from "../components/Skeleton";
import { STATUS_STYLES, MONTH_NAMES, EXAMS } from "../constants";
import { authApi, attendanceApi, resultsApi, assignmentApi, feeApi } from "../api";

const AVATAR_COLORS = ["bg-sky-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500"];

function getInitials(name) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function avgGpa(rows) {
  if (!rows.length) return null;
  return (rows.reduce((s, r) => s + (r.gpa ?? 0), 0) / rows.length).toFixed(2);
}

function gpaBadge(gpa) {
  const g = parseFloat(gpa);
  if (g >= 4.5) return "bg-emerald-100 text-emerald-700";
  if (g >= 3.5) return "bg-sky-100 text-sky-700";
  if (g >= 2.5) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function AttendanceSummaryBar({ label, value, max, colorClass }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-700">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(false);

  const [attendance, setAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [examResults, setExamResults] = useState({});
  const [assignmentStats, setAssignmentStats] = useState(null);
  const [fees, setFees] = useState([]);

  useEffect(() => {
    authApi.myChildren()
      .then((res) => {
        const list = (res.data || []).map((c) => ({
          ...c,
          student_name: [c.first_name, c.last_name].filter(Boolean).join(" "),
        }));
        setChildren(list);
        if (list.length > 0) selectChild(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingChildren(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectChild = useCallback((child) => {
    setSelectedChild(child);
    setLoading(true);
    setExamResults({});
    setAssignmentStats(null);
    setAttendance([]);
    setAttendanceSummary(null);
    setFees([]);

    const now = new Date();
    Promise.all([
      attendanceApi.childAttendance(child.id, { month: now.getMonth() + 1, year: now.getFullYear() }).catch(() => null),
      ...EXAMS.map((e) => resultsApi.childResult(e.id, child.id).catch(() => null)),
      assignmentApi.childStats(child.id).catch(() => null),
      feeApi.childFees(child.id).catch(() => null),
    ])
      .then((responses) => {
        const attRes = responses[0];
        setAttendance(attRes?.data?.records || []);
        setAttendanceSummary(attRes?.data?.summary || null);

        const examData = {};
        EXAMS.forEach((exam, i) => {
          const r = responses[1 + i];
          const subjects = (r?.data?.subjects ?? []).map((s) => ({
            subject_name: s.subject_name,
            total: s.total_marks,
            grade: s.letter_grade,
            gpa: s.gpa,
          }));
          examData[exam.id] = {
            subjects,
            total_marks: r?.data?.total_marks || 0,
            gpa: r?.data?.gpa || 0,
            letter_grade: r?.data?.letter_grade || null,
            is_passed: r?.data?.is_passed || false,
          };
        });
        setExamResults(examData);

        const stats = responses[1 + EXAMS.length];
        setAssignmentStats(stats?.data || null);

        const fr = responses[2 + EXAMS.length];
        setFees(fr?.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const periodLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const examGpas = EXAMS.map((e) => avgGpa(examResults[e.id]?.subjects ?? []));
  const validGpas = examGpas.filter(Boolean).map(Number);
  const bestGpa = validGpas.length ? Math.max(...validGpas).toFixed(2) : "—";
  const overallAvgGpa = validGpas.length
    ? (validGpas.reduce((a, b) => a + b, 0) / validGpas.length).toFixed(2)
    : "—";

  const subjects = [...new Set(
    Object.values(examResults).flatMap((r) => r.subjects?.map((s) => s.subject_name) || [])
  )];

  const totalDue = fees.reduce((s, f) => s + (f.amount || 0), 0);
  const totalPaid = fees.filter((f) => f.status === "Paid").reduce((s, f) => s + (f.paid_amount || 0), 0);
  const outstanding = totalDue - totalPaid;
  const overdueCount = fees.filter((f) => f.status === "Overdue").length;

  const presentPct = attendanceSummary?.percentage ?? 0;
  const presentCount = attendanceSummary?.present ?? 0;
  const absentCount = attendanceSummary?.absent ?? 0;
  const lateCount = attendanceSummary?.late ?? 0;
  const total = attendanceSummary?.total ?? 0;

  return (
    <Sidebar title="Parent">
      <div className="mx-auto max-w-[1200px] space-y-4 px-4 py-4 sm:space-y-6 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 px-5 py-5 text-white shadow-soft sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-100">Parent Portal</p>
          <h1 className="mt-0.5 text-lg font-bold sm:text-xl">My Children</h1>
          <p className="mt-0.5 text-xs text-amber-100 sm:text-sm">Monitor academic progress, attendance, assignments and fees.</p>
        </div>

        {/* Children selector chips */}
        {loadingChildren ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-200 border-t-amber-600" />
          </div>
        ) : children.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            No children linked yet. Please contact the school office.
          </div>
        ) : (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:gap-3 sm:pb-0">
            {children.map((child, i) => {
              const isSelected = selectedChild?.id === child.id;
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => selectChild(child)}
                  className={`flex shrink-0 items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all sm:px-4 sm:py-3 ${
                    isSelected
                      ? "border-amber-400 bg-white shadow-md ring-2 ring-amber-200"
                      : "border-slate-200 bg-white hover:border-amber-200"
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                    {getInitials(child.student_name || child.username || "?")}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">{child.student_name}</p>
                    <p className="text-xs text-slate-500">
                      Class {child.class_level}-{child.section} · Roll {child.roll_number}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {selectedChild && loading && (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
          </div>
        )}

        {selectedChild && !loading && (
          <>
            {/* Student profile card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white ${AVATAR_COLORS[children.indexOf(selectedChild) % AVATAR_COLORS.length]}`}>
                  {getInitials(selectedChild.student_name)}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900">{selectedChild.student_name}</h2>
                  <p className="text-sm text-slate-500">
                    Class {selectedChild.class_level}-{selectedChild.section} · Roll {selectedChild.roll_number} · {selectedChild.email}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 md:gap-6 text-center">
                  <Stat label="Avg GPA" value={overallAvgGpa} color="text-indigo-600" />
                  <Stat label="Best" value={bestGpa} color="text-emerald-600" />
                  <Stat label="Attendance" value={`${presentPct}%`} color={presentPct >= 80 ? "text-emerald-600" : "text-amber-600"} />
                </div>
              </div>
            </div>

            {/* KPI cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard
                label="Latest Result"
                value={examResults[EXAMS[EXAMS.length - 1]?.id]?.letter_grade || "—"}
                sub={`GPA ${examResults[EXAMS[EXAMS.length - 1]?.id]?.gpa || 0}`}
                color="violet"
              />
              <KPICard
                label="Assignments"
                value={`${assignmentStats?.submitted || 0}/${assignmentStats?.total || 0}`}
                sub={`${assignmentStats?.completion_rate || 0}% complete`}
                color="sky"
              />
              <KPICard
                label="Fee Outstanding"
                value={`৳ ${outstanding.toLocaleString()}`}
                sub={overdueCount > 0 ? `${overdueCount} overdue!` : "All up to date"}
                color={outstanding > 0 ? "rose" : "emerald"}
              />
              <KPICard
                label="Attendance Rate"
                value={`${presentPct}%`}
                sub={`${presentCount} present / ${total} days`}
                color={presentPct >= 80 ? "emerald" : "amber"}
              />
            </div>

            {/* Exam GPA cards */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">Exam Results</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                {EXAMS.map((exam, i) => {
                  const gpa = examGpas[i];
                  const result = examResults[exam.id];
                  return (
                    <div key={exam.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{exam.label}</p>
                      {gpa ? (
                        <>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-indigo-600">{gpa}</span>
                            <span className="text-xs text-slate-500">GPA</span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {result.subjects.length} subjects · Total {result.total_marks}
                          </p>
                          {result.letter_grade && (
                            <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${gpaBadge(result.gpa)}`}>
                              {result.letter_grade}
                            </span>
                          )}
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">Not yet published</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* GPA trend bars */}
              <div className="mt-6 border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">GPA Trend</p>
                <div className="flex items-end gap-4">
                  {EXAMS.map((exam, i) => {
                    const gpa = examGpas[i];
                    const pct = gpa ? Math.min((parseFloat(gpa) / 5) * 100, 100) : 0;
                    const colors = ["bg-sky-500", "bg-violet-500", "bg-emerald-500"];
                    return (
                      <div key={exam.id} className="flex flex-1 flex-col items-center gap-1">
                        <span className="text-sm font-bold text-slate-700">{gpa ?? "—"}</span>
                        <div className="flex w-full items-end" style={{ height: "60px" }}>
                          <div
                            className={`${colors[i]} w-full rounded-t transition-all duration-700`}
                            style={{ height: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 text-center">{exam.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Subject comparison */}
            {subjects.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="font-semibold text-slate-900">Subject-wise Marks</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Subject</th>
                        {EXAMS.map((exam) => (
                          <th key={exam.id} className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            {exam.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {subjects.map((subName) => (
                        <tr key={subName} className="hover:bg-slate-50">
                          <td className="px-6 py-3 font-medium text-slate-900">{subName}</td>
                          {EXAMS.map((exam) => {
                            const d = examResults[exam.id]?.subjects?.find((r) => r.subject_name === subName);
                            return (
                              <td key={exam.id} className="px-4 py-3 text-center">
                                {d ? (
                                  <div>
                                    <div className="font-medium text-slate-900">{d.total}</div>
                                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${gpaBadge(d.gpa)}`}>
                                      {d.grade} ({(d.gpa ?? 0).toFixed(1)})
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Assignment progress */}
            {assignmentStats && assignmentStats.total > 0 && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-500">Assignments</p>
                    <h3 className="mt-0.5 font-semibold text-slate-900">Weekly Assignment Progress</h3>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  <Stat label="Total" value={assignmentStats.total} color="text-slate-900" />
                  <Stat label="Submitted" value={assignmentStats.submitted} color="text-sky-600" />
                  <Stat label="Pending" value={assignmentStats.pending} color="text-amber-600" />
                  <Stat label="Graded" value={assignmentStats.graded} color="text-emerald-600" />
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Completion Rate</span>
                    <span className="font-bold text-sky-600">{assignmentStats.completion_rate}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${assignmentStats.completion_rate}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/* Attendance + Fees row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Attendance */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Attendance</h3>
                  <span className="text-xs text-slate-500">{periodLabel}</span>
                </div>
                {total > 0 ? (
                  <>
                    <div className="space-y-2.5">
                      <AttendanceSummaryBar label="Present" value={presentCount} max={total} colorClass="bg-emerald-500" />
                      <AttendanceSummaryBar label="Absent" value={absentCount} max={total} colorClass="bg-rose-500" />
                      <AttendanceSummaryBar label="Late" value={lateCount} max={total} colorClass="bg-amber-500" />
                    </div>
                    <p className="mt-3 text-xs text-slate-400">{total} records this month</p>
                  </>
                ) : (
                  <p className="py-6 text-center text-sm text-slate-400">No attendance records this month.</p>
                )}
              </div>

              {/* Fees */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Fees</h3>
                  <Link to="/parent/fees" className="text-xs font-semibold text-amber-600 hover:underline">View all</Link>
                </div>
                {fees.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No fee records.</p>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-500">Total Charged</span><span className="font-semibold">৳ {totalDue.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-slate-500">Paid</span><span className="font-semibold text-emerald-600">৳ {totalPaid.toLocaleString()}</span></div>
                      <div className="flex justify-between border-t border-slate-100 pt-2"><span className="text-slate-700 font-semibold">Outstanding</span><span className={`font-bold ${outstanding > 0 ? "text-rose-600" : "text-emerald-600"}`}>৳ {outstanding.toLocaleString()}</span></div>
                    </div>
                    {overdueCount > 0 && (
                      <div className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                        ⚠ {overdueCount} fee{overdueCount > 1 ? "s" : ""} overdue
                      </div>
                    )}
                    <div className="mt-3 space-y-1 text-xs">
                      {fees.slice(0, 4).map((f) => (
                        <div key={f.id} className="flex justify-between">
                          <span className="text-slate-600">{f.fee_type} {f.month ? `(${f.month}/${f.year})` : f.year}</span>
                          <span className={f.status === "Paid" ? "text-emerald-600" : f.status === "Overdue" ? "text-rose-600" : "text-amber-600"}>
                            {f.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Daily attendance table */}
            {attendance.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="font-semibold text-slate-900">Daily Attendance — {periodLabel}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Date</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendance.map((record, idx) => (
                        <tr key={idx}>
                          <td className="px-5 py-3 text-slate-700">{record.date}</td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[record.status]?.badge ?? "bg-slate-100 text-slate-600"}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </Sidebar>
  );
}

function Stat({ label, value, color = "text-slate-900" }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function KPICard({ label, value, sub, color = "indigo" }) {
  const colorMap = {
    indigo: "from-indigo-500 to-indigo-600",
    violet: "from-violet-500 to-violet-600",
    sky: "from-sky-500 to-sky-600",
    emerald: "from-emerald-500 to-emerald-600",
    rose: "from-rose-500 to-rose-600",
    amber: "from-amber-500 to-amber-600",
  };
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${colorMap[color]} p-5 text-white shadow-sm`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-white/80">{sub}</p>
    </div>
  );
}
