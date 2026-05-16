import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { subjectApi, teacherClassApi, timetableApi } from "../api";
import { ClassLevelSelect, SectionSelect } from "../components/ClassSectionPicker";
import PageHeader from "../components/PageHeader";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

export default function AdminTimetablePage() {
  const [classLevel, setClassLevel] = useState(9);
  const [section, setSection] = useState("A");
  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null); // {day, period}
  const [mobileDay, setMobileDay] = useState(new Date().getDay() <= 4 ? new Date().getDay() : 0);

  const [form, setForm] = useState({
    subject_id: "",
    teacher_id: "",
    start_time: "08:00",
    end_time: "08:45",
    room_number: "",
    is_break: false,
    break_label: "",
  });

  async function loadSlots() {
    try {
      setLoading(true);
      const r = await timetableApi.list({ class_level: classLevel, section });
      setSlots(r.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  async function loadHelpers() {
    try {
      const [subjR, teachR] = await Promise.all([
        subjectApi.list(classLevel),
        teacherClassApi.teachers(),
      ]);
      setSubjects(subjR.data);
      setTeachers(teachR.data);
    } catch (err) {
      setToast({ type: "error", message: "Failed to load." });
    }
  }

  useEffect(() => {
    loadHelpers();
    loadSlots();
  }, [classLevel, section]);

  const grid = useMemo(() => {
    const g = {};
    const ps = new Set();
    slots.forEach((s) => {
      if (!g[s.day_of_week]) g[s.day_of_week] = {};
      g[s.day_of_week][s.period_number] = s;
      ps.add(s.period_number);
    });
    return { g, periods: Array.from(ps).sort((a, b) => a - b) };
  }, [slots]);

  function startEdit(day, period) {
    const existing = grid.g[day]?.[period];
    setEditing({ day, period });
    setForm(
      existing
        ? {
            subject_id: existing.subject_id || "",
            teacher_id: existing.teacher_id || "",
            start_time: existing.start_time,
            end_time: existing.end_time,
            room_number: existing.room_number || "",
            is_break: existing.is_break,
            break_label: existing.break_label || "",
          }
        : {
            subject_id: "",
            teacher_id: "",
            start_time: "08:00",
            end_time: "08:45",
            room_number: "",
            is_break: false,
            break_label: "",
          }
    );
  }

  async function save() {
    try {
      await timetableApi.upsert({
        class_level: classLevel,
        section,
        day_of_week: editing.day,
        period_number: editing.period,
        ...form,
      });
      setToast({ type: "success", message: "Slot saved." });
      setEditing(null);
      loadSlots();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove() {
    const existing = grid.g[editing.day]?.[editing.period];
    if (!existing) return;
    if (!window.confirm("Delete this slot?")) return;
    try {
      await timetableApi.remove(existing.id);
      setToast({ type: "success", message: "Slot deleted." });
      setEditing(null);
      loadSlots();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  return (
    <Sidebar title="Timetable">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          title="Timetable Editor"
          subtitle="Configure the weekly schedule for each class"
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <ClassLevelSelect value={classLevel} onChange={(v) => setClassLevel(v || 9)} />
          <SectionSelect value={section} onChange={(v) => setSection(v || "A")} />
          <span className="text-sm text-slate-600">
            Editing: Class {classLevel}-{section}
          </span>
        </div>

        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : (
          <>
          {/* Mobile: day tabs + period cards */}
          <div className="lg:hidden">
            <div className="surface mb-3 flex gap-1.5 overflow-x-auto p-1.5 no-scrollbar">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMobileDay && setMobileDay(i)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    (mobileDay ?? 0) === i
                      ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              ))}
            </div>
            <p className="mb-2 px-1 text-sm font-bold text-slate-900">{DAYS[mobileDay ?? 0]}</p>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((p) => {
                const slot = grid.g[mobileDay ?? 0]?.[p];
                return (
                  <button
                    key={p}
                    onClick={() => startEdit(mobileDay ?? 0, p)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                      slot
                        ? slot.is_break
                          ? "border-slate-200 bg-slate-50"
                          : "border-sky-200 bg-sky-50"
                        : "border-dashed border-slate-300 bg-white text-slate-400 hover:border-indigo-400"
                    }`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white shadow-md ${
                      slot && !slot.is_break ? "bg-gradient-to-br from-sky-500 to-blue-600" : "bg-slate-300"
                    }`}>
                      <span className="text-[9px] font-bold uppercase">P</span>
                      <span className="text-base font-bold leading-none">{p}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      {slot ? (
                        slot.is_break ? (
                          <p className="font-medium text-slate-600">🍴 {slot.break_label || "Break"}</p>
                        ) : (
                          <>
                            <p className="truncate text-sm font-bold text-sky-900">{slot.subject_label || "—"}</p>
                            <p className="truncate text-[11px] text-slate-500">{slot.teacher_name || "No teacher"}</p>
                            {slot.room_number && <p className="text-[10px] text-slate-400">🚪 {slot.room_number}</p>}
                          </>
                        )
                      ) : (
                        <p className="text-sm font-medium">+ Add Period {p}</p>
                      )}
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop: classic grid */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm lg:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-slate-700">Day</th>
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <th key={p} className="px-3 py-3 text-center font-medium text-slate-700">P{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map((d, dayIdx) => (
                  <tr key={dayIdx}>
                    <td className="px-3 py-3 font-semibold text-slate-900">{d}</td>
                    {[1, 2, 3, 4, 5, 6, 7].map((p) => {
                      const slot = grid.g[dayIdx]?.[p];
                      return (
                        <td key={p} className="px-2 py-2">
                          <button
                            onClick={() => startEdit(dayIdx, p)}
                            className={`w-full rounded-lg border p-2 text-left text-xs hover:border-indigo-400 ${
                              slot
                                ? slot.is_break
                                  ? "bg-slate-50 border-slate-200"
                                  : "bg-sky-50 border-sky-200"
                                : "bg-white border-dashed border-slate-300 text-slate-400"
                            }`}
                          >
                            {slot ? (
                              slot.is_break ? (
                                <span className="font-medium text-slate-600">🍴 {slot.break_label || "Break"}</span>
                              ) : (
                                <>
                                  <div className="font-semibold text-sky-900">{slot.subject_label || "—"}</div>
                                  <div className="text-[10px] text-slate-500">{slot.teacher_name}</div>
                                </>
                              )
                            ) : (
                              "+ add"
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {editing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold">
                Edit {DAYS[editing.day]} – Period {editing.period}
              </h3>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_break}
                    onChange={(e) => setForm({ ...form, is_break: e.target.checked })}
                  />
                  This is a break (no teacher/subject)
                </label>
                {form.is_break ? (
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Break label (e.g., Tiffin Break)"
                    value={form.break_label}
                    onChange={(e) => setForm({ ...form, break_label: e.target.value })}
                  />
                ) : (
                  <>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={form.subject_id}
                      onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                    >
                      <option value="">— Subject —</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.code} – {s.label}</option>
                      ))}
                    </select>
                    <select
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      value={form.teacher_id}
                      onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
                    >
                      <option value="">— Teacher —</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <input
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Room number (optional)"
                      value={form.room_number}
                      onChange={(e) => setForm({ ...form, room_number: e.target.value })}
                    />
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Start (HH:MM)"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="End (HH:MM)"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                {grid.g[editing.day]?.[editing.period] && (
                  <button onClick={remove} className="rounded-lg bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700">
                    Delete
                  </button>
                )}
                <button onClick={() => setEditing(null)} className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium">
                  Cancel
                </button>
                <button onClick={save} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}
