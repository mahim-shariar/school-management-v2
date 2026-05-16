import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { subjectApi, teacherClassApi } from "../api";
import { ClassLevelSelect, SectionSelect } from "../components/ClassSectionPicker";

export default function AdminTeacherClassPage() {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    teacher_id: "",
    class_level: 9,
    section: "A",
    subject_id: "",
    is_class_teacher: false,
  });

  async function loadAll() {
    try {
      setLoading(true);
      const [assignR, teachR] = await Promise.all([
        teacherClassApi.list(),
        teacherClassApi.teachers(),
      ]);
      setAssignments(assignR.data);
      setTeachers(teachR.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  async function loadSubjects(classLevel) {
    try {
      const r = await subjectApi.list(classLevel);
      setSubjects(r.data);
    } catch (err) {
      setSubjects([]);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (form.class_level) loadSubjects(form.class_level);
  }, [form.class_level]);

  async function submit(e) {
    e.preventDefault();
    if (!form.teacher_id) {
      setToast({ type: "error", message: "Pick a teacher." });
      return;
    }
    try {
      await teacherClassApi.create(form);
      setToast({ type: "success", message: "Assignment created." });
      loadAll();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await teacherClassApi.remove(id);
      setToast({ type: "success", message: "Removed." });
      loadAll();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  return (
    <Sidebar>
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Teacher-Class Assignment</h1>
        <p className="mb-6 text-sm text-slate-500">Assign teachers to teach specific subjects in specific classes</p>

        <form onSubmit={submit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-3"
            value={form.teacher_id}
            onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            required
          >
            <option value="">— Select Teacher —</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.employee_id}) - {t.department}
              </option>
            ))}
          </select>
          <ClassLevelSelect
            value={form.class_level}
            onChange={(v) => setForm({ ...form, class_level: v || 9 })}
          />
          <SectionSelect
            value={form.section}
            onChange={(v) => setForm({ ...form, section: v })}
            allowAll
          />
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
          >
            <option value="">— Select Subject —</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} – {s.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_class_teacher}
              onChange={(e) => setForm({ ...form, is_class_teacher: e.target.checked })}
            />
            Class Teacher (primary teacher for this class)
          </label>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
            Assign
          </button>
        </form>

        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : assignments.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No assignments yet.</p>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-2 md:hidden">
              {assignments.map((a) => (
                <div key={a.id} className="surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900">{a.teacher_name}</p>
                      <p className="truncate text-[11px] text-slate-500">{a.teacher_email}</p>
                    </div>
                    {a.is_class_teacher && (
                      <span className="chip shrink-0 bg-indigo-100 text-indigo-700">Class Teacher</span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="chip bg-slate-100 text-slate-700">Class {a.class_level}{a.section ? `-${a.section}` : ""}</span>
                    {a.subject_label && (
                      <span className="chip bg-sky-100 text-sky-700">{a.subject_code} · {a.subject_label}</span>
                    )}
                  </div>
                  <button onClick={() => remove(a.id)} className="mt-3 w-full rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden tbl-wrap md:block">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Teacher</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-bold text-white shadow-md">
                            {a.teacher_name?.[0] || "T"}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{a.teacher_name}</div>
                            <div className="text-xs text-slate-500">{a.teacher_email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="chip bg-slate-100 text-slate-700">Class {a.class_level}{a.section ? `-${a.section}` : ""}</span></td>
                      <td>{a.subject_label ? <span className="chip bg-sky-100 text-sky-700">{a.subject_code} · {a.subject_label}</span> : <span className="text-slate-300">—</span>}</td>
                      <td>{a.is_class_teacher && <span className="chip bg-indigo-100 text-indigo-700">Class Teacher</span>}</td>
                      <td>
                        <button onClick={() => remove(a.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                          Remove
                        </button>
                      </td>
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
