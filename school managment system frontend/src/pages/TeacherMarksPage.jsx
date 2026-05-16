import { useState, useCallback, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { SECTIONS, EXAMS, MARK_FIELDS } from "../constants";
import { marksApi, subjectApi } from "../api";

const selectCls =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

export default function TeacherMarksPage() {
  const [sectionLabel, setSectionLabel] = useState(SECTIONS[0].label);
  const [examId, setExamId] = useState(EXAMS[0].id);
  const [subjectId, setSubjectId] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [students, setStudents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [values, setValues] = useState({});
  const [cellErrors, setCellErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const selectedSection = SECTIONS.find((s) => s.label === sectionLabel);
  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const selectedExam = EXAMS.find((e) => e.id === examId);

  // Load subjects whenever the class level changes
  useEffect(() => {
    if (!selectedSection) return;
    setLoadingSubjects(true);
    setSubjectId("");
    setSubjects([]);
    subjectApi.list(selectedSection.classLevel)
      .then((res) => {
        setSubjects(res.data || []);
        if (res.data?.length) setSubjectId(res.data[0].id);
      })
      .catch(() => setSubjects([]))
      .finally(() => setLoadingSubjects(false));
  }, [selectedSection?.classLevel]);

  const resetSection = () => {
    setStudents([]);
    setLoaded(false);
    setValues({});
    setCellErrors({});
    setLoadError(null);
  };

  const handleLoadStudents = async () => {
    if (!subjectId) { setToast({ type: "error", text: "Please select a subject first." }); return; }
    setLoadingStudents(true);
    setLoadError(null);
    setStudents([]);
    setLoaded(false);
    setValues({});
    setCellErrors({});
    try {
      const res = await marksApi.getStudents(selectedSection.classLevel, selectedSection.section);
      setStudents(res.data || []);
      setLoaded(true);
      if (!res.data?.length) setLoadError("No students found in this section.");
    } catch (err) {
      setLoadError(err.response?.data?.error || "Failed to load students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleChange = useCallback((studentId, field, value) => {
    setValues((prev) => ({ ...prev, [`${studentId}-${field}`]: value }));
    setCellErrors((prev) => {
      if (!prev[`${studentId}-${field}`]) return prev;
      const next = { ...prev };
      delete next[`${studentId}-${field}`];
      return next;
    });
  }, []);

  const getRowTotal = (studentId) =>
    MARK_FIELDS.reduce((sum, { field }) => {
      const v = parseFloat(values[`${studentId}-${field}`] || 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

  const handleRemoveStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setValues((prev) => {
      const next = { ...prev };
      MARK_FIELDS.forEach(({ field }) => delete next[`${id}-${field}`]);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!students.length) { setToast({ type: "error", text: "No students loaded." }); return; }
    if (!subjectId) { setToast({ type: "error", text: "No subject selected." }); return; }
    const newCellErrors = {};
    students.forEach((s) => {
      MARK_FIELDS.forEach(({ field, max }) => {
        const v = Number(values[`${s.id}-${field}`] ?? 0);
        if (v < 0 || v > max) newCellErrors[`${s.id}-${field}`] = `0–${max}`;
      });
    });
    if (Object.keys(newCellErrors).length) {
      setCellErrors(newCellErrors);
      setToast({ type: "error", text: `${Object.keys(newCellErrors).length} field(s) have invalid values.` });
      return;
    }
    setCellErrors({});
    setSubmitting(true);
    try {
      const records = students.map((s) => ({
        studentId: String(s.id),
        marksWritten: Number(values[`${s.id}-marks_written`] ?? 0),
        marksMcq: Number(values[`${s.id}-marks_mcq`] ?? 0),
        marksPractical: Number(values[`${s.id}-marks_practical`] ?? 0),
      }));
      await marksApi.submitBulk(records, { exam_id: examId, subject_id: subjectId });
      setToast({ type: "success", text: `Marks submitted for ${students.length} student(s) — ${selectedExam?.label} · ${selectedSubject?.label}.` });
      setValues({});
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.error || "Failed to submit marks." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sidebar>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-200">Teacher Portal</p>
          <h1 className="mt-0.5 text-xl font-bold">Marks Entry</h1>
          <p className="mt-0.5 text-sm text-violet-200">Select section, exam, and subject — then load and enter marks.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Section</label>
            <select
              value={sectionLabel}
              onChange={(e) => { setSectionLabel(e.target.value); resetSection(); }}
              className={selectCls}
            >
              {SECTIONS.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
          </div>

          {/* Exam */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Exam</label>
            <select
              value={examId}
              onChange={(e) => setExamId(Number(e.target.value))}
              className={selectCls}
            >
              {EXAMS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>

          {/* Subject — loaded from API */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subject</label>
            {loadingSubjects ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500" />
                Loading subjects…
              </div>
            ) : subjects.length === 0 ? (
              <p className="mt-3 text-sm text-amber-600">No subjects found for this class. Ask admin to add subjects.</p>
            ) : (
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className={selectCls}
              >
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.code})</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          {loaded && (
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{sectionLabel}</span> ·{" "}
              <span className="font-semibold text-slate-900">{selectedExam?.label}</span> ·{" "}
              <span className="font-semibold text-slate-900">{selectedSubject?.label}</span>
            </p>
          )}
          <button
            onClick={handleLoadStudents}
            disabled={loadingStudents || !subjectId}
            className="ml-auto rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50"
          >
            {loadingStudents ? "Loading…" : "Load Students"}
          </button>
        </div>

        {loadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{loadError}</div>
        )}

        {loaded && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Student Marks</h2>
              <p className="mt-0.5 text-xs text-slate-400">{students.length} student{students.length !== 1 ? "s" : ""} · max total: 125</p>
            </div>
            {students.length > 0 ? (
              <>
                {/* Mobile: stacked cards per student */}
                <div className="space-y-3 p-4 md:hidden">
                  {students.map((student) => {
                    const total = getRowTotal(student.id);
                    return (
                      <div key={student.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-xs font-bold text-violet-700">
                              {student.roll_number ?? "?"}
                            </div>
                            <p className="truncate text-sm font-semibold text-slate-900">{student.full_name}</p>
                          </div>
                          <button type="button" onClick={() => handleRemoveStudent(student.id)} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500" aria-label="Remove">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {MARK_FIELDS.map(({ field, label, max }) => {
                            const key = `${student.id}-${field}`;
                            const hasErr = !!cellErrors[key];
                            return (
                              <div key={field}>
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                  {label} <span className="text-slate-400">/{max}</span>
                                </label>
                                <input
                                  type="number" min={0} max={max}
                                  value={values[key] ?? ""}
                                  onChange={(e) => handleChange(student.id, field, e.target.value)}
                                  className={`mt-0.5 w-full rounded-lg border px-2 py-1.5 text-center text-sm font-semibold text-slate-900 outline-none ${hasErr ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-slate-50 focus:border-violet-400 focus:bg-white"}`}
                                  placeholder="0"
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total</span>
                          <span className={`text-base font-bold tabular-nums ${total > 125 ? "text-rose-600" : total > 0 ? "text-violet-700" : "text-slate-300"}`}>
                            {total} <span className="text-xs text-slate-400">/ 125</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Roll</th>
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Name</th>
                        {MARK_FIELDS.map(({ header }) => (
                          <th key={header} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{header}</th>
                        ))}
                        <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total</th>
                        <th className="px-5 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((student) => {
                        const total = getRowTotal(student.id);
                        return (
                          <tr key={student.id} className="transition-colors hover:bg-slate-50">
                            <td className="px-5 py-3.5 font-mono text-sm font-medium text-slate-600">{student.roll_number ?? "—"}</td>
                            <td className="px-5 py-3.5 font-medium text-slate-900">{student.full_name}</td>
                            {MARK_FIELDS.map(({ field, max }) => {
                              const key = `${student.id}-${field}`;
                              const hasErr = !!cellErrors[key];
                              return (
                                <td key={field} className="px-5 py-3.5">
                                  <input
                                    type="number" min={0} max={max}
                                    value={values[key] ?? ""}
                                    onChange={(e) => handleChange(student.id, field, e.target.value)}
                                    className={`w-20 rounded-lg border px-3 py-1.5 text-sm text-slate-900 outline-none transition-colors ${hasErr ? "border-rose-400 bg-rose-50 focus:ring-2 focus:ring-rose-500/20" : "border-slate-200 bg-slate-50 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20"}`}
                                    placeholder="0"
                                  />
                                  {hasErr && <p className="mt-1 text-[10px] text-rose-500">Must be {cellErrors[key]}</p>}
                                </td>
                              );
                            })}
                            <td className="px-5 py-3.5">
                              <span className={`text-sm font-bold tabular-nums ${total > 125 ? "text-rose-600" : total > 0 ? "text-slate-900" : "text-slate-300"}`}>{total}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <button type="button" onClick={() => handleRemoveStudent(student.id)}
                                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-300 hover:text-rose-500">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="px-6 py-6 text-sm text-slate-400">No students loaded.</p>
            )}
          </div>
        )}

        {loaded && (
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => { setValues({}); setCellErrors({}); }}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50">
              Clear All
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting || !students.length}
              className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "Submitting…" : "Submit Marks"}
            </button>
          </div>
        )}

      </div>
    </Sidebar>
  );
}
