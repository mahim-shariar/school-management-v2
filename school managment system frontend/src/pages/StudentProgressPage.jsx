import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { EXAMS } from "../constants";
import { resultsApi, assignmentApi } from "../api";

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

function TrendArrow({ prev, curr }) {
  if (prev == null || curr == null) return <span className="text-slate-300">—</span>;
  const diff = parseFloat(curr) - parseFloat(prev);
  if (Math.abs(diff) < 0.01) return <span className="text-slate-400 text-xs">±0</span>;
  return diff > 0
    ? <span className="text-emerald-600 text-xs font-semibold">▲ {diff.toFixed(2)}</span>
    : <span className="text-rose-500 text-xs font-semibold">▼ {Math.abs(diff).toFixed(2)}</span>;
}

export default function StudentProgressPage() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [assignmentStats, setAssignmentStats] = useState(null);

  useEffect(() => {
    Promise.all([
      ...EXAMS.map((e) => resultsApi.myResult(e.id).catch(() => null)),
      assignmentApi.myStats().catch(() => null),
    ]).then((responses) => {
      const data = {};
      EXAMS.forEach((exam, i) => {
        const subjects = (responses[i]?.data?.subjects ?? []).map((s) => ({
          subject_name: s.subject_name,
          total: s.total_marks,
          grade: s.letter_grade,
          gpa: s.gpa,
        }));
        data[exam.id] = subjects;
      });
      setResults(data);
      setAssignmentStats(responses[EXAMS.length]?.data || null);
    }).finally(() => setLoading(false));
  }, []);

  const examGpas = EXAMS.map((e) => avgGpa(results[e.id] ?? []));
  const validGpas = examGpas.filter(Boolean).map(Number);
  const bestGpa = validGpas.length ? Math.max(...validGpas).toFixed(2) : "—";

  const subjects = [...new Set(
    Object.values(results).flat().map((r) => r.subject_name)
  )];

  const barColors = ["bg-sky-500", "bg-violet-500", "bg-emerald-500"];

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-200">Academic Progress</p>
          <h1 className="mt-0.5 text-xl font-bold">My Progress Report</h1>
          <p className="mt-0.5 text-sm text-violet-200">Exams · Subjects · Assignment Completion</p>
        </div>

        {/* Exam GPA cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {EXAMS.map((exam, i) => {
            const gpa = examGpas[i];
            const rows = results[exam.id] ?? [];
            return (
              <div key={exam.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{exam.label}</p>
                {gpa ? (
                  <>
                    <p className="mt-2 text-3xl font-bold text-indigo-600">{gpa}</p>
                    <p className="text-xs text-slate-400">GPA · {rows.length} subjects</p>
                    <div className="mt-2">
                      <TrendArrow prev={examGpas[i - 1]} curr={gpa} />
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-400">Not yet published</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Assignment progress */}
        {assignmentStats !== null && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-500">Assignments</p>
                <h2 className="mt-0.5 font-semibold text-slate-900">Assignment Progress</h2>
              </div>
              <Link to="/student/assignments"
                className="rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-600 transition-colors hover:bg-sky-50">
                View All
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {[
                { label: "Total", value: assignmentStats.total, color: "text-slate-900" },
                { label: "Submitted", value: assignmentStats.submitted, color: "text-sky-600" },
                { label: "Pending", value: assignmentStats.pending, color: "text-amber-600" },
                { label: "Graded", value: assignmentStats.graded, color: "text-emerald-600" },
              ].map((c) => (
                <div key={c.label} className="rounded-xl bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{c.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>
            {assignmentStats.total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Completion Rate</span>
                  <span className="font-bold text-sky-600">{assignmentStats.completion_rate}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-700"
                    style={{ width: `${assignmentStats.completion_rate}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* GPA trend chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">GPA Trend Across Exams</h2>
          <div className="mt-4 flex items-end gap-6">
            {EXAMS.map((exam, i) => {
              const gpa = examGpas[i];
              const pct = gpa ? Math.min((parseFloat(gpa) / 5) * 100, 100) : 0;
              return (
                <div key={exam.id} className="flex flex-1 flex-col items-center gap-2">
                  <p className="text-sm font-bold text-slate-700">{gpa ?? "—"}</p>
                  <div className="w-full rounded-t-lg overflow-hidden bg-slate-100" style={{ height: "80px" }}>
                    <div
                      className={`${barColors[i]} w-full rounded-t-lg transition-all duration-700`}
                      style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{exam.label}</p>
                </div>
              );
            })}
            <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl bg-indigo-50 p-3">
              <p className="text-[10px] text-indigo-400 uppercase tracking-wider">Best GPA</p>
              <p className="text-2xl font-bold text-indigo-600">{bestGpa}</p>
            </div>
          </div>
        </div>

        {/* Subject comparison table */}
        {subjects.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Subject-wise Marks Comparison</h2>
              <p className="mt-0.5 text-xs text-slate-400">All exams side by side</p>
            </div>
            {/* Mobile: per-subject cards stacked */}
            <div className="space-y-3 p-4 md:hidden">
              {subjects.map((subName) => (
                <div key={subName} className="rounded-xl border border-slate-200 bg-slate-50/40 p-3">
                  <p className="mb-2 text-sm font-bold text-slate-900">{subName}</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {EXAMS.map((exam) => {
                      const rows = results[exam.id] ?? [];
                      const d = rows.find((r) => r.subject_name === subName);
                      return (
                        <div key={exam.id} className="rounded-lg bg-white p-2 text-center shadow-sm">
                          <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{exam.label}</p>
                          {d ? (
                            <>
                              <p className="mt-1 text-base font-bold text-slate-900">{d.total}</p>
                              <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${gpaBadge(d.gpa)}`}>{d.grade}</span>
                              <p className="mt-0.5 text-[10px] font-bold text-indigo-600">GP {(d.gpa ?? 0).toFixed(1)}</p>
                            </>
                          ) : (
                            <p className="mt-2 text-base text-slate-300">—</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: comparison table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Subject</th>
                    {EXAMS.map((exam) => (
                      <th key={exam.id} colSpan={3} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-l border-slate-100">
                        {exam.label}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 pb-2" />
                    {EXAMS.map((exam) =>
                      ["Total", "Grade", "GP"].map((h) => (
                        <th key={`${exam.id}-${h}`} className="px-4 pb-2 text-[10px] text-slate-400 font-medium">{h}</th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map((subName) => (
                    <tr key={subName} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-900">{subName}</td>
                      {EXAMS.map((exam) => {
                        const rows = results[exam.id] ?? [];
                        const d = rows.find((r) => r.subject_name === subName);
                        return d ? (
                          <>
                            <td key={`${exam.id}-total`} className="px-4 py-3 text-slate-700 tabular-nums">{d.total}</td>
                            <td key={`${exam.id}-grade`} className="px-4 py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${gpaBadge(d.gpa)}`}>{d.grade}</span>
                            </td>
                            <td key={`${exam.id}-gp`} className="px-4 py-3 font-bold text-indigo-600 tabular-nums">{(d.gpa ?? 0).toFixed(2)}</td>
                          </>
                        ) : (
                          <>
                            <td key={`${exam.id}-total`} className="px-4 py-3 text-slate-300">—</td>
                            <td key={`${exam.id}-grade`} className="px-4 py-3 text-slate-300">—</td>
                            <td key={`${exam.id}-gp`} className="px-4 py-3 text-slate-300">—</td>
                          </>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!subjects.length && !assignmentStats?.total && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">No results or assignments yet.</p>
          </div>
        )}

      </div>
    </Sidebar>
  );
}
