import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { EXAMS, MONTH_NAMES } from "../constants";
import { dashboardApi, resultsApi } from "../api";

function StatCard({ label, value, sub, icon, gradient }) {
  return (
    <div className="surface surface-hover relative overflow-hidden p-4 sm:p-5">
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
      <div className="relative">
        <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <p className="h-eyebrow">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value ?? "—"}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

const today = new Date();

export default function AdminDashboard() {
  const [selectedExam, setSelectedExam] = useState(1);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState(null);
  const [publishedExams, setPublishedExams] = useState(new Set());
  const [stats, setStats] = useState(null);
  const [meritData, setMeritData] = useState({});
  const [loadingMerit, setLoadingMerit] = useState(false);

  useEffect(() => {
    dashboardApi.stats()
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (meritData[selectedExam] !== undefined) return;
    setLoadingMerit(true);
    resultsApi.meritList(selectedExam)
      .then((res) => setMeritData((prev) => ({ ...prev, [selectedExam]: res.data || [] })))
      .catch(() => setMeritData((prev) => ({ ...prev, [selectedExam]: [] })))
      .finally(() => setLoadingMerit(false));
  }, [selectedExam]);

  const meritList = meritData[selectedExam] ?? [];
  const totalStudents = meritList.length;
  const passedCount = meritList.filter((s) => s.is_passed).length;
  const failedCount = totalStudents - passedCount;
  const avgGpa = totalStudents > 0
    ? (meritList.reduce((s, r) => s + (r.gpa ?? 0), 0) / totalStudents).toFixed(2)
    : null;
  const passRate = totalStudents > 0 ? ((passedCount / totalStudents) * 100).toFixed(0) : 0;

  const gpaData = [
    { name: "5.00", students: meritList.filter((s) => s.gpa >= 5).length },
    { name: "4–4.99", students: meritList.filter((s) => s.gpa >= 4 && s.gpa < 5).length },
    { name: "3–3.99", students: meritList.filter((s) => s.gpa >= 3 && s.gpa < 4).length },
    { name: "2–2.99", students: meritList.filter((s) => s.gpa >= 2 && s.gpa < 3).length },
    { name: "<2", students: meritList.filter((s) => s.gpa < 2).length },
  ];

  const statCards = [
    { label: "Total Students", value: stats?.totalStudents, sub: "enrolled in system", gradient: "from-sky-500 to-blue-600", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
    { label: "Total Teachers", value: stats?.totalTeachers, sub: "active staff members", gradient: "from-violet-500 to-purple-600", icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814" },
    { label: "Attendance Rate", value: stats ? `${stats.attendanceRate}%` : null, sub: "all classes · this month", gradient: "from-emerald-500 to-teal-600", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" },
    { label: "Average GPA", value: avgGpa ?? "—", sub: `${EXAMS.find((e) => e.id === selectedExam)?.label} exam`, gradient: "from-indigo-500 to-indigo-700", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  ];

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await resultsApi.publishResult(selectedExam);
      setPublishedExams((prev) => new Set([...prev, selectedExam]));
      setToast({ type: "success", text: `${EXAMS.find((e) => e.id === selectedExam)?.label} results published successfully.` });
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.error || "Failed to publish results." });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Sidebar title="Dashboard">
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-4 sm:space-y-6 sm:p-6 lg:p-8">

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-indigo-800 px-5 py-6 text-white shadow-xl shadow-indigo-900/30 sm:px-7 sm:py-7">
          <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-200 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Admin Portal
              </span>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">School Dashboard</h1>
              <p className="mt-1 text-sm text-indigo-200">{MONTH_NAMES[today.getMonth()]} {today.getFullYear()} overview</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/users" className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                Manage Users
              </Link>
              <Link to="/attendance/report" className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                Reports
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {statCards.map((card) => <StatCard key={card.label} {...card} />)}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-slate-700">Viewing exam:</p>
            <div className="flex gap-1.5">
              {EXAMS.map((e) => (
                <button key={e.id} type="button" onClick={() => setSelectedExam(e.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${selectedExam === e.id ? "bg-indigo-600 text-white" : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                  {e.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handlePublish} disabled={publishing || publishedExams.has(selectedExam)}
            className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
            {publishing ? "Publishing…" : publishedExams.has(selectedExam) ? "Published ✓" : "Publish Results"}
          </button>
        </div>

        {loadingMerit ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 shadow-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : totalStudents > 0 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Passed</p>
                <p className="mt-2 text-4xl font-bold text-emerald-700">{passedCount}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-200">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${passRate}%` }} />
                </div>
                <p className="mt-1 text-xs text-emerald-600">{passRate}% pass rate</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">Failed</p>
                <p className="mt-2 text-4xl font-bold text-rose-700">{failedCount}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-rose-200">
                  <div className="h-full rounded-full bg-rose-500" style={{ width: `${100 - Number(passRate)}%` }} />
                </div>
                <p className="mt-1 text-xs text-rose-600">{100 - Number(passRate)}% fail rate</p>
              </div>
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">Avg GPA</p>
                <p className="mt-2 text-4xl font-bold text-indigo-700">{avgGpa}</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-indigo-200">
                  <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(Number(avgGpa) / 5) * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-indigo-600">out of 5.00</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Pass / Fail Ratio</p>
                <p className="mt-0.5 text-xs text-slate-400">{EXAMS.find((e) => e.id === selectedExam)?.label}</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={[{ name: "Passed", value: passedCount }, { name: "Failed", value: failedCount }]}
                      cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value">
                      <Cell fill="#10b981" />
                      <Cell fill="#f43f5e" />
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v} students`, n]} contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0", fontSize: "0.75rem" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "0.75rem" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">GPA Distribution</p>
                <p className="mt-0.5 text-xs text-slate-400">Number of students per GPA band</p>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={gpaData} margin={{ top: 8, right: 4, left: -22, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip formatter={(v) => [`${v} student${v !== 1 ? "s" : ""}`, "Count"]} contentStyle={{ borderRadius: "0.75rem", border: "1px solid #e2e8f0", fontSize: "0.75rem" }} />
                    <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-center shadow-sm">
            <svg className="h-12 w-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-slate-500">No results data for this exam</p>
            <p className="mt-1 text-xs text-slate-400">Publish results from the Marks section first.</p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Merit List</h2>
              <p className="mt-0.5 text-xs text-slate-400">{EXAMS.find((e) => e.id === selectedExam)?.label} · ranked by total marks</p>
            </div>
            {meritList.length > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{meritList.length} students</span>
            )}
          </div>
          {meritList.length > 0 ? (
            <>
              {/* Mobile: cards */}
              <div className="space-y-2 p-3 md:hidden">
                {meritList.map((item, idx) => {
                  const pos = item.class_position ?? idx + 1;
                  const medal = pos === 1 ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" : pos === 2 ? "bg-slate-200 text-slate-700 ring-1 ring-slate-300" : pos === 3 ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300" : "bg-slate-100 text-slate-500";
                  return (
                    <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${medal}`}>
                        {pos}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.student_name}</p>
                        <p className="text-[11px] text-slate-500">{item.total_marks} marks</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-indigo-600">{(item.gpa ?? 0).toFixed(2)}</p>
                        <span className={`chip ${item.is_passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                          {item.is_passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="tbl">
                  <thead>
                    <tr>
                      {["Rank", "Student", "Total Marks", "GPA", "Status"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {meritList.map((item, idx) => {
                      const pos = item.class_position ?? idx + 1;
                      const medal = pos === 1 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30" : pos === 2 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-md" : pos === 3 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/30" : "bg-slate-100 text-slate-500";
                      return (
                        <tr key={idx}>
                          <td>
                            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${medal}`}>{pos}</span>
                          </td>
                          <td>{item.student_name}</td>
                          <td className="tabular-nums">{item.total_marks}</td>
                          <td className="font-bold text-indigo-600 tabular-nums">{(item.gpa ?? 0).toFixed(2)}</td>
                          <td>
                            <span className={`chip ${item.is_passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                              {item.is_passed ? "Passed" : "Failed"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-slate-400">No merit list for this exam.</p>
            </div>
          )}
        </div>

      </div>
    </Sidebar>
  );
}
