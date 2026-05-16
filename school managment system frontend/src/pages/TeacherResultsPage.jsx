import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { SECTIONS, EXAMS } from "../constants";
import { resultsApi } from "../api";

const selectCls =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

export default function TeacherResultsPage() {
  const [sectionLabel, setSectionLabel] = useState(SECTIONS[0].label);
  const [examId, setExamId] = useState(EXAMS[0].id);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const selectedSection = SECTIONS.find((s) => s.label === sectionLabel);
  const selectedExam = EXAMS.find((e) => e.id === examId);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setLoaded(false);
    try {
      const res = await resultsApi.sectionResults(examId, selectedSection.classLevel, selectedSection.section);
      const data = res.data || [];
      setResults(data);
      setLoaded(true);
      if (!data.length) setError("No results published for this section and exam.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load results.");
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = results.length;
  const passedCount = results.filter((r) => r.is_passed).length;
  const avgGpa = totalStudents > 0
    ? (results.reduce((s, r) => s + (r.gpa ?? 0), 0) / totalStudents).toFixed(2)
    : null;

  return (
    <Sidebar>
      <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-200">Teacher Portal</p>
          <h1 className="mt-0.5 text-xl font-bold">Section Results</h1>
          <p className="mt-0.5 text-sm text-violet-200">View published exam results for your class section.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Section</label>
            <select value={sectionLabel} onChange={(e) => { setSectionLabel(e.target.value); setResults([]); setLoaded(false); setError(null); }} className={selectCls}>
              {SECTIONS.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Exam</label>
            <select value={examId} onChange={(e) => { setExamId(Number(e.target.value)); setResults([]); setLoaded(false); setError(null); }} className={selectCls}>
              {EXAMS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleLoad} disabled={loading}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-[0.98] disabled:opacity-50">
            {loading ? "Loading…" : "Load Results"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>
        )}

        {loaded && totalStudents > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Students</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalStudents}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Passed</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{passedCount}</p>
              <p className="text-xs text-emerald-500">{((passedCount / totalStudents) * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">Avg GPA</p>
              <p className="mt-2 text-3xl font-bold text-indigo-700">{avgGpa ?? "—"}</p>
              <p className="text-xs text-indigo-400">out of 5.00</p>
            </div>
          </div>
        )}

        {loaded && totalStudents > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Results — {sectionLabel} · {selectedExam?.label}</h2>
              <p className="mt-0.5 text-xs text-slate-400">{totalStudents} student{totalStudents !== 1 ? "s" : ""}</p>
            </div>
            {/* Mobile: cards */}
            <div className="space-y-2 p-3 md:hidden">
              {results.map((row, idx) => {
                const pos = row.class_position ?? idx + 1;
                const medal = pos === 1 ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" : pos === 2 ? "bg-slate-200 text-slate-700 ring-1 ring-slate-300" : pos === 3 ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300" : "bg-slate-100 text-slate-500";
                return (
                  <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${medal}`}>
                      {pos}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{row.student_name}</p>
                      <p className="text-[11px] text-slate-500">{row.total_marks} marks · {row.letter_grade}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-violet-600">{(row.gpa ?? 0).toFixed(2)}</p>
                      <span className={`chip ${row.is_passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {row.is_passed ? "Passed" : "Failed"}
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
                    {["#", "Student", "Total Marks", "GPA", "Grade", "Status"].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => {
                    const pos = row.class_position ?? idx + 1;
                    const medal = pos === 1 ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md shadow-amber-500/30" : pos === 2 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-md" : pos === 3 ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md shadow-orange-500/30" : "bg-slate-100 text-slate-500";
                    return (
                      <tr key={idx}>
                        <td>
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${medal}`}>{pos}</span>
                        </td>
                        <td>{row.student_name}</td>
                        <td className="tabular-nums">{row.total_marks}</td>
                        <td className="font-bold text-violet-600 tabular-nums">{(row.gpa ?? 0).toFixed(2)}</td>
                        <td><span className="chip bg-violet-100 text-violet-700">{row.letter_grade}</span></td>
                        <td>
                          <span className={`chip ${row.is_passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {row.is_passed ? "Passed" : "Failed"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loaded && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <svg className="h-12 w-12 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="mt-3 text-sm font-medium text-slate-500">Select a section and exam to view results</p>
          </div>
        )}

      </div>
    </Sidebar>
  );
}
