import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { SECTIONS, STATUS_STYLES } from "../constants";
import { marksApi, attendanceApi } from "../api";

const STATUSES = ["Present", "Absent", "Late"];

const selectCls =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20";

export default function TeacherAttendancePage() {
  const [sectionLabel, setSectionLabel] = useState(SECTIONS[0].label);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [loadMsg, setLoadMsg] = useState(null);

  const selectedSection = SECTIONS.find((s) => s.label === sectionLabel);

  const handleLoadStudents = async () => {
    setLoadingStudents(true);
    setLoadMsg(null);
    setStudents([]);
    setLoaded(false);
    try {
      const res = await marksApi.getStudents(selectedSection.classLevel, selectedSection.section);
      const list = (res.data || []).map((s) => ({ ...s, name: s.full_name, status: "Present" }));
      setStudents(list);
      setLoaded(true);
      setLoadMsg({ type: list.length ? "success" : "info", text: list.length ? `Loaded ${list.length} students for ${sectionLabel} on ${date}.` : "No students found in this section." });
    } catch (err) {
      setLoadMsg({ type: "error", text: err.response?.data?.error || "Failed to load students." });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStatusChange = (studentId, status) =>
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, status } : s)));

  const markAll = (status) =>
    setStudents((prev) => prev.map((s) => ({ ...s, status })));

  const handleRemoveStudent = (id) =>
    setStudents((prev) => prev.filter((s) => s.id !== id));

  const handleSubmit = async () => {
    if (!students.length) { setToast({ type: "error", text: "No students to submit." }); return; }
    setSubmitting(true);
    try {
      await attendanceApi.mark({
        date,
        classLevel: selectedSection.classLevel,
        section: selectedSection.section,
        records: students.map((s) => ({ studentId: String(s.id), status: s.status })),
      });
      setToast({ type: "success", text: `Attendance saved for ${students.length} student(s) — ${sectionLabel} · ${date}.` });
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.error || "Failed to save attendance." });
    } finally {
      setSubmitting(false);
    }
  };

  const summary = students.reduce(
    (acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; },
    { Present: 0, Absent: 0, Late: 0 },
  );

  const msgBg = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-rose-200 bg-rose-50 text-rose-600",
    info: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <Sidebar>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-100">Teacher Portal</p>
          <h1 className="mt-0.5 text-xl font-bold">Mark Attendance</h1>
          <p className="mt-0.5 text-sm text-emerald-100">Select section and date, load students, then save attendance.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Section</label>
            <select value={sectionLabel} onChange={(e) => { setSectionLabel(e.target.value); setStudents([]); setLoaded(false); setLoadMsg(null); }} className={selectCls}>
              {SECTIONS.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</label>
            <input type="date" value={date} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => { setDate(e.target.value); setStudents([]); setLoaded(false); setLoadMsg(null); }}
              className={selectCls} />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleLoadStudents} disabled={loadingStudents}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50">
            {loadingStudents ? "Loading…" : "Load Students"}
          </button>
        </div>

        {loadMsg && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${msgBg[loadMsg.type]}`}>{loadMsg.text}</div>
        )}

        {loaded && students.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {["Present", "Absent", "Late"].map((s) => (
              <div key={s} className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${STATUS_STYLES[s].badge} border-current/20`}>
                <span>{s}</span>
                <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold">{summary[s]}</span>
              </div>
            ))}
            <div className="ml-auto flex gap-2">
              {STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => markAll(s)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50">
                  All {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {loaded && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Student Attendance</h2>
              <p className="mt-0.5 text-xs text-slate-400">{sectionLabel} · {date} · {students.length} student{students.length !== 1 ? "s" : ""}</p>
            </div>
            {students.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {students.map((student) => (
                  <div key={student.id} className="flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {student.roll_number ?? "?"}
                      </div>
                      <span className="text-sm font-medium text-slate-900">{student.name ?? `Student #${student.id}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {STATUSES.map((status) => {
                        const active = student.status === status;
                        return (
                          <button key={status} type="button" onClick={() => handleStatusChange(student.id, status)}
                            className={`flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-150 sm:flex-none ${active ? STATUS_STYLES[status].active : STATUS_STYLES[status].inactive}`}>
                            {status}
                          </button>
                        );
                      })}
                      <button type="button" onClick={() => handleRemoveStudent(student.id)}
                        className="ml-1 rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors hover:border-rose-300 hover:text-rose-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-6 py-6 text-sm text-slate-400">No records. Load students first.</p>
            )}
          </div>
        )}

        {loaded && (
          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={submitting || !students.length}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
              {submitting ? "Saving…" : "Save Attendance"}
            </button>
          </div>
        )}

      </div>
    </Sidebar>
  );
}
