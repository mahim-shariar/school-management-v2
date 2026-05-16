import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { EXAMS, SECTIONS } from "../constants";
import { resultsApi } from "../api";

function GradeChip({ grade }) {
  if (!grade) return <span className="text-slate-300">—</span>;
  const colors = { "A+": "bg-emerald-100 text-emerald-700", A: "bg-sky-100 text-sky-700", "A-": "bg-sky-50 text-sky-600", B: "bg-indigo-100 text-indigo-700", C: "bg-amber-100 text-amber-700", D: "bg-orange-100 text-orange-700", F: "bg-rose-100 text-rose-700" };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[grade] ?? "bg-slate-100 text-slate-600"}`}>{grade}</span>;
}

function studentAvgGpa(exams) {
  const vals = EXAMS.map((e) => exams[e.id]?.gpa).filter((g) => g != null);
  if (!vals.length) return null;
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
}

export default function TeacherGradeBookPage() {
  const [section, setSection] = useState(SECTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [students, setStudents] = useState([]);

  async function loadGradeBook() {
    setLoading(true);
    setLoaded(false);
    try {
      const responses = await Promise.all(
        EXAMS.map((e) => resultsApi.sectionResults(e.id, section.classLevel, section.section).catch(() => null))
      );
      const gradebook = {};
      responses.forEach((res, i) => {
        const examId = EXAMS[i].id;
        (res?.data || []).forEach((row) => {
          const key = row.roll_number ?? row.student_name;
          if (!gradebook[key]) {
            gradebook[key] = { name: row.student_name, exams: {} };
          }
          gradebook[key].exams[examId] = {
            total: row.total_marks,
            grade: row.letter_grade,
            gpa: row.gpa,
          };
        });
      });
      setStudents(Object.entries(gradebook));
      setLoaded(true);
    } catch {
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sidebar>
      <div className="mx-auto max-w-[1200px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-200">Grade Book</p>
          <h1 className="mt-0.5 text-xl font-bold">Section Grade Book</h1>
          <p className="mt-0.5 text-sm text-violet-200">All exams consolidated view by student</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Section</label>
            <select
              value={section.label}
              onChange={(e) => { const s = SECTIONS.find((x) => x.label === e.target.value); if (s) { setSection(s); setLoaded(false); } }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {SECTIONS.map((s) => <option key={s.label} value={s.label}>Class {s.classLevel} — Section {s.section}</option>)}
            </select>
          </div>
          <button type="button" onClick={loadGradeBook} disabled={loading}
            className="mt-auto rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-colors">
            {loading ? "Loading…" : "Load Grade Book"}
          </button>
          {loaded && students.length > 0 && (
            <div className="ml-auto flex items-center gap-4 text-sm text-slate-500">
              <span><span className="font-semibold text-slate-800">{students.length}</span> students</span>
            </div>
          )}
        </div>

        {loaded && students.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="font-semibold text-slate-900">Class {section.classLevel} — Section {section.section} · All Exams</h2>
            </div>

            {/* Mobile: per-student card with grouped exam stats */}
            <div className="space-y-3 p-3 md:hidden">
              {students.map(([rollNo, data]) => {
                const avg = studentAvgGpa(data.exams);
                return (
                  <div key={rollNo} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                          {rollNo}
                        </div>
                        <p className="truncate text-sm font-semibold text-slate-900">{data.name}</p>
                      </div>
                      {avg && (
                        <span className="chip bg-violet-100 text-violet-700">Avg {avg}</span>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {EXAMS.map((exam) => {
                        const entry = data.exams[exam.id];
                        return (
                          <div key={exam.id} className="rounded-lg bg-slate-50 p-2 text-center">
                            <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-500">{exam.label}</p>
                            {entry ? (
                              <>
                                <p className="mt-1 text-sm font-bold text-slate-900">{entry.total}</p>
                                <div className="mt-0.5 flex items-center justify-center"><GradeChip grade={entry.grade} /></div>
                                <p className="mt-0.5 text-[10px] font-bold text-violet-600">GP {(entry.gpa ?? 0).toFixed(1)}</p>
                              </>
                            ) : (
                              <p className="mt-2 text-sm text-slate-300">—</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: wide grade-book table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Roll</th>
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Student Name</th>
                    {EXAMS.map((exam) => (
                      <th key={exam.id} colSpan={3} className="border-l border-slate-100 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                        {exam.label}
                      </th>
                    ))}
                    <th className="border-l border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center">Avg GPA</th>
                  </tr>
                  <tr className="bg-slate-50/70 border-b border-slate-100">
                    <th className="px-5 pb-2" colSpan={2} />
                    {EXAMS.map((exam) =>
                      ["Total", "Grd", "GP"].map((h) => (
                        <th key={`${exam.id}-${h}`} className="border-l border-slate-50 px-3 pb-2 text-[10px] font-medium text-slate-400 text-center">{h}</th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map(([rollNo, data]) => {
                    const avg = studentAvgGpa(data.exams);
                    return (
                      <tr key={rollNo} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{rollNo}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{data.name}</td>
                        {EXAMS.map((exam) => {
                          const entry = data.exams[exam.id];
                          return entry ? (
                            <>
                              <td key={`${exam.id}-total`} className="border-l border-slate-100 px-3 py-3 text-center text-slate-700 tabular-nums">{entry.total}</td>
                              <td key={`${exam.id}-grade`} className="px-3 py-3 text-center"><GradeChip grade={entry.grade} /></td>
                              <td key={`${exam.id}-gp`} className="px-3 py-3 text-center font-bold text-violet-600 tabular-nums">{(entry.gpa ?? 0).toFixed(2)}</td>
                            </>
                          ) : (
                            <>
                              <td key={`${exam.id}-total`} className="border-l border-slate-100 px-3 py-3 text-center text-slate-200">—</td>
                              <td key={`${exam.id}-grade`} className="px-3 py-3 text-center text-slate-200">—</td>
                              <td key={`${exam.id}-gp`} className="px-3 py-3 text-center text-slate-200">—</td>
                            </>
                          );
                        })}
                        <td className="border-l border-slate-100 px-5 py-3 text-center">
                          {avg ? <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-bold text-violet-700">{avg}</span> : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loaded && students.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="font-semibold text-slate-700">No results found for this section</p>
          </div>
        )}

        {!loaded && !loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
              <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700">Select a section and load the grade book</p>
            <p className="mt-1 text-sm text-slate-400">All three exams will be loaded side by side.</p>
          </div>
        )}

      </div>
    </Sidebar>
  );
}
