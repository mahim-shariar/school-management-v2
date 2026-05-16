import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { CLASS_LEVELS, MONTH_NAMES, SECTIONS_LIST } from "../constants";
import { attendanceApi } from "../api";

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const selectCls =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";

function attendanceColor(pct) {
  const n = parseFloat(pct);
  if (n >= 80) return { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" };
  if (n >= 60) return { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700" };
  return { bar: "bg-rose-500", badge: "bg-rose-100 text-rose-700" };
}

export default function AttendanceReportPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [classLevel, setClassLevel] = useState(9);
  const [section, setSection] = useState("A");
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await attendanceApi.report({ class_level: classLevel, section, month, year });
      // Map API response to display format
      const mapped = (res.data || []).map((row) => ({
        student: row.student_name,
        roll: row.roll_number,
        section,
        attendance_percentage: String(row.percentage),
        present: row.present,
        absent: row.absent,
        late: row.late,
        total_days: row.total_days,
      }));
      setReport(mapped);
      setHasLoaded(true);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate report.");
      setReport([]);
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = report.length;
  const avgAttendance = totalStudents > 0
    ? (report.reduce((s, r) => s + parseFloat(r.attendance_percentage || 0), 0) / totalStudents).toFixed(1)
    : "0.0";
  const aboveEighty = report.filter((r) => parseFloat(r.attendance_percentage) >= 80).length;
  const belowSixty = report.filter((r) => parseFloat(r.attendance_percentage) < 60).length;

  return (
    <Sidebar>
      <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Admin Portal</p>
          <h1 className="mt-0.5 text-xl font-bold text-white">Attendance Report</h1>
          <p className="mt-0.5 text-sm text-slate-400">Monthly attendance summary by class level and section.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Month</label>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={selectCls}>
              {MONTH_NAMES.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Year</label>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={selectCls}>
              {YEARS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Class Level</label>
            <select value={classLevel} onChange={(e) => setClassLevel(Number(e.target.value))} className={selectCls}>
              {CLASS_LEVELS.map((l) => <option key={l} value={l}>Class {l}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)} className={selectCls}>
              {SECTIONS_LIST.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={fetchReport} disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50">
            {loading ? "Loading…" : "Generate Report"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
        )}

        {hasLoaded && report.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              { label: "Total Students", value: totalStudents, color: "text-slate-900", bg: "bg-white border-slate-200" },
              { label: "Avg Attendance", value: `${avgAttendance}%`, color: "text-indigo-600", bg: "bg-indigo-50 border-indigo-200" },
              { label: "Above 80%", value: aboveEighty, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
              { label: "Below 60%", value: belowSixty, color: "text-rose-600", bg: "bg-rose-50 border-rose-200" },
            ].map((card) => (
              <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${card.bg}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
                <p className={`mt-2 text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">{MONTH_NAMES[month - 1]} {year} — Class {classLevel} · Section {section}</h2>
              {report.length > 0 && <p className="mt-0.5 text-xs text-slate-400">{totalStudents} student{totalStudents !== 1 ? "s" : ""}</p>}
            </div>
            {report.length > 0 && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Avg {avgAttendance}%</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : report.length ? (
            <>
              {/* Mobile: stacked cards */}
              <div className="space-y-2 p-3 md:hidden">
                {report.map((row, index) => {
                  const { bar, badge } = attendanceColor(row.attendance_percentage);
                  const pct = Math.min(parseFloat(row.attendance_percentage) || 0, 100);
                  return (
                    <div key={index} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
                            {row.roll ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{row.student}</p>
                            <p className="text-[11px] text-slate-500">#{index + 1}</p>
                          </div>
                        </div>
                        <span className={`chip shrink-0 ${badge}`}>{row.attendance_percentage}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%`, transition: "width 0.6s ease" }} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-emerald-50 py-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Present</p>
                          <p className="text-sm font-bold text-emerald-700">{row.present ?? "—"}</p>
                        </div>
                        <div className="rounded-lg bg-rose-50 py-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-rose-600">Absent</p>
                          <p className="text-sm font-bold text-rose-700">{row.absent ?? "—"}</p>
                        </div>
                        <div className="rounded-lg bg-amber-50 py-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Late</p>
                          <p className="text-sm font-bold text-amber-700">{row.late ?? "—"}</p>
                        </div>
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
                      {["#", "Student", "Roll", "Present", "Absent", "Late", "Attendance %"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((row, index) => {
                      const { bar, badge } = attendanceColor(row.attendance_percentage);
                      const pct = Math.min(parseFloat(row.attendance_percentage) || 0, 100);
                      return (
                        <tr key={index}>
                          <td className="text-xs text-slate-400">{index + 1}</td>
                          <td>{row.student}</td>
                          <td className="font-mono text-slate-500">{row.roll ?? "N/A"}</td>
                          <td className="font-semibold text-emerald-600 tabular-nums">{row.present ?? "—"}</td>
                          <td className="font-semibold text-rose-600 tabular-nums">{row.absent ?? "—"}</td>
                          <td className="font-semibold text-amber-600 tabular-nums">{row.late ?? "—"}</td>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%`, transition: "width 0.6s ease" }} />
                              </div>
                              <span className={`chip ${badge}`}>{row.attendance_percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : hasLoaded ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
              </svg>
              <p className="mt-3 text-sm text-slate-400">No attendance records for this period.</p>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-400">Select filters and click Generate Report.</div>
          )}
        </div>

      </div>
    </Sidebar>
  );
}
