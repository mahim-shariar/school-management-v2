import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { authApi, examScheduleApi, subjectApi } from "../api";
import { EXAMS } from "../constants";
import { ClassLevelSelect, SectionSelect } from "../components/ClassSectionPicker";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

export default function ExamSchedulePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [examId, setExamId] = useState(2);
  const [classLevel, setClassLevel] = useState(user?.class_level || 9);
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    exam_id: 2,
    subject_id: "",
    class_level: 9,
    section: "",
    exam_date: "",
    start_time: "10:00",
    end_time: "13:00",
    room_number: "",
    total_marks: 100,
    invigilator_id: "",
  });

  async function load() {
    try {
      setLoading(true);
      const r = await examScheduleApi.list({ exam_id: examId, class_level: classLevel });
      setSchedules(r.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    } finally {
      setLoading(false);
    }
  }

  async function loadHelpers() {
    if (!isAdmin) return;
    try {
      const [subjR, teachR] = await Promise.all([
        subjectApi.list(form.class_level || classLevel),
        authApi.users({ role: "teacher" }),
      ]);
      setSubjects(subjR.data);
      setTeachers(teachR.data);
    } catch (err) {
      // ignore
    }
  }

  useEffect(() => {
    load();
  }, [examId, classLevel]);

  useEffect(() => {
    loadHelpers();
  }, [form.class_level, isAdmin]);

  async function submit(e) {
    e.preventDefault();
    if (!form.subject_id || !form.exam_date) {
      setToast({ type: "error", message: "Subject and date required." });
      return;
    }
    try {
      await examScheduleApi.upsert(form);
      setToast({ type: "success", message: "Schedule saved." });
      setShowForm(false);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this schedule?")) return;
    try {
      await examScheduleApi.remove(id);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  return (
    <Sidebar>
      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Exam Schedule</h1>
            <p className="text-sm text-slate-500">Exam timetable for each class</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowForm((s) => !s)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
              {showForm ? "Cancel" : "+ Add Schedule"}
            </button>
          )}
        </div>

        <div className="mb-4 flex gap-3">
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={examId} onChange={(e) => setExamId(Number(e.target.value))}>
            {EXAMS.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
          {!user?.class_level && (
            <ClassLevelSelect value={classLevel} onChange={(v) => setClassLevel(v || 9)} />
          )}
        </div>

        {showForm && isAdmin && (
          <form onSubmit={submit} className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.exam_id} onChange={(e) => setForm({ ...form, exam_id: Number(e.target.value) })}>
              {EXAMS.map((ex) => <option key={ex.id} value={ex.id}>{ex.label}</option>)}
            </select>
            <ClassLevelSelect value={form.class_level} onChange={(v) => setForm({ ...form, class_level: v || 9 })} />
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
              <option value="">— Subject —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.code} – {s.label}</option>)}
            </select>
            <input type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Start HH:MM" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="End HH:MM" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Room" value={form.room_number} onChange={(e) => setForm({ ...form, room_number: e.target.value })} />
            <input type="number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Total marks" value={form.total_marks} onChange={(e) => setForm({ ...form, total_marks: Number(e.target.value) })} />
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={form.invigilator_id} onChange={(e) => setForm({ ...form, invigilator_id: e.target.value })}>
              <option value="">— Invigilator —</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
            </select>
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white md:col-span-3">Save</button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : schedules.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No schedule yet.</p>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-2 md:hidden">
              {schedules.map((s) => (
                <div key={s.id} className="surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{s.subject_label}</p>
                      <p className="text-[11px] text-slate-500">{s.subject_code}</p>
                    </div>
                    <span className="chip bg-indigo-100 text-indigo-700">{s.total_marks} marks</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Date</p>
                      <p className="mt-0.5 font-semibold text-slate-700">{fmtDate(s.exam_date)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Time</p>
                      <p className="mt-0.5 font-semibold text-slate-700">{s.start_time}–{s.end_time}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Room</p>
                      <p className="mt-0.5 font-semibold text-slate-700">{s.room_number || "—"}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Invigilator</p>
                      <p className="mt-0.5 truncate font-semibold text-slate-700">{s.invigilator_name || "—"}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button onClick={() => remove(s.id)} className="mt-3 w-full rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden tbl-wrap md:block">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Time</th>
                    <th>Room</th>
                    <th>Invigilator</th>
                    <th>Marks</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s.id}>
                      <td>{fmtDate(s.exam_date)}</td>
                      <td>{s.subject_code} – {s.subject_label}</td>
                      <td><span className="chip bg-slate-100 text-slate-700">{s.start_time} – {s.end_time}</span></td>
                      <td>{s.room_number || "—"}</td>
                      <td>{s.invigilator_name || "—"}</td>
                      <td><span className="chip bg-indigo-100 text-indigo-700">{s.total_marks}</span></td>
                      {isAdmin && (
                        <td>
                          <button onClick={() => remove(s.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">Delete</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}
