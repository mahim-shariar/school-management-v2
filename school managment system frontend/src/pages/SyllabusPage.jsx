import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { SkeletonCard } from "../components/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { subjectApi, syllabusApi } from "../api";
import { ClassLevelSelect } from "../components/ClassSectionPicker";

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function SyllabusPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [syllabi, setSyllabi] = useState([]);
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [expanded, setExpanded] = useState(null);

  // Filters — students default to their own class
  const [filter, setFilter] = useState({
    class_level: user?.class_level || "",
    subject_id: "",
    academic_year: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    class_level: 9,
    subject_id: "",
    academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
    description: "",
    chapters: [{ title: "", description: "", weeks: 2 }],
    file_url: "",
  });
  const [formSubjects, setFormSubjects] = useState([]);

  async function loadList() {
    try {
      setLoading(true);
      const params = {};
      if (filter.class_level) params.class_level = filter.class_level;
      if (filter.subject_id) params.subject_id = filter.subject_id;
      if (filter.academic_year) params.academic_year = filter.academic_year;
      const r = await syllabusApi.list(params);
      setSyllabi(r.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  async function loadYears() {
    try {
      const r = await syllabusApi.years();
      setYears(r.data);
    } catch (err) {
      // ignore
    }
  }

  async function loadSubjects(classLevel) {
    if (!classLevel) {
      setSubjects([]);
      return;
    }
    try {
      const r = await subjectApi.list(classLevel);
      setSubjects(r.data);
    } catch (err) {
      setSubjects([]);
    }
  }

  async function loadFormSubjects(classLevel) {
    if (!classLevel) {
      setFormSubjects([]);
      return;
    }
    try {
      const r = await subjectApi.list(classLevel);
      setFormSubjects(r.data);
    } catch (err) {
      setFormSubjects([]);
    }
  }

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    loadList();
  }, [filter.class_level, filter.subject_id, filter.academic_year]);

  useEffect(() => {
    loadSubjects(filter.class_level);
  }, [filter.class_level]);

  useEffect(() => {
    loadFormSubjects(form.class_level);
  }, [form.class_level]);

  useEffect(() => {
    if (showForm) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [showForm]);

  function openCreate() {
    setEditingId(null);
    setForm({
      title: "",
      class_level: 9,
      subject_id: "",
      academic_year: new Date().getFullYear() + "-" + (new Date().getFullYear() + 1),
      description: "",
      chapters: [{ title: "", description: "", weeks: 2 }],
      file_url: "",
    });
    setShowForm(true);
  }

  function openEdit(s) {
    setEditingId(s.id);
    setForm({
      title: s.title,
      class_level: s.class_level,
      subject_id: s.subject_id || "",
      academic_year: s.academic_year,
      description: s.description || "",
      chapters: s.chapters?.length ? s.chapters : [{ title: "", description: "", weeks: 2 }],
      file_url: s.file_url || "",
    });
    setShowForm(true);
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.academic_year.trim() || !form.class_level) {
      setToast({ type: "error", message: "Title, class, and academic year required." });
      return;
    }
    const payload = {
      ...form,
      chapters: form.chapters.filter((c) => c.title.trim()),
    };
    try {
      if (editingId) {
        await syllabusApi.update(editingId, payload);
        setToast({ type: "success", message: "Syllabus updated." });
      } else {
        await syllabusApi.create(payload);
        setToast({ type: "success", message: "Syllabus added." });
      }
      setShowForm(false);
      setEditingId(null);
      loadList();
      loadYears();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this syllabus?")) return;
    try {
      await syllabusApi.remove(id);
      setToast({ type: "success", message: "Deleted." });
      loadList();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  function addChapter() {
    setForm({ ...form, chapters: [...form.chapters, { title: "", description: "", weeks: 2 }] });
  }
  function updateChapter(idx, field, value) {
    const chapters = [...form.chapters];
    chapters[idx] = { ...chapters[idx], [field]: value };
    setForm({ ...form, chapters });
  }
  function removeChapter(idx) {
    setForm({ ...form, chapters: form.chapters.filter((_, i) => i !== idx) });
  }

  // Group by year for display
  const grouped = {};
  syllabi.forEach((s) => {
    if (!grouped[s.academic_year]) grouped[s.academic_year] = [];
    grouped[s.academic_year].push(s);
  });
  const sortedYears = Object.keys(grouped).sort().reverse();

  return (
    <Sidebar title="Syllabus">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          hero
          gradient="from-indigo-500 to-violet-600"
          title="Syllabus"
          subtitle="Curriculum for every class, subject, and academic year"
          action={
            isAdmin && (
              <button onClick={openCreate} className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25">
                + Add
              </button>
            )
          }
        />

        {/* Filters */}
        <div className="surface grid grid-cols-2 gap-2 p-3 sm:grid-cols-4 sm:gap-3 sm:p-4">
          <ClassLevelSelect
            value={filter.class_level}
            onChange={(v) => setFilter({ ...filter, class_level: v, subject_id: "" })}
          />
          <select
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            value={filter.subject_id}
            onChange={(e) => setFilter({ ...filter, subject_id: e.target.value })}
            disabled={!filter.class_level}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.code} – {s.label}</option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            value={filter.academic_year}
            onChange={(e) => setFilter({ ...filter, academic_year: e.target.value })}
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFilter({ class_level: "", subject_id: "", academic_year: "" })}
            className="btn-secondary col-span-2 sm:col-span-1"
          >
            Clear
          </button>
        </div>

        {/* Form — modal-style on all screens */}
        <AnimatePresence>
        {showForm && isAdmin && (
          <>
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.4 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] sm:inset-0 sm:m-auto sm:max-h-[90vh] sm:max-w-2xl sm:p-4 lg:max-w-3xl"
            >
              <form
                onSubmit={submit}
                className="relative flex h-full max-h-[92vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
              >
                {/* Header */}
                <div className="relative shrink-0 overflow-hidden border-b border-slate-200/70 bg-gradient-to-br from-indigo-500 to-violet-600 px-5 py-5 text-white sm:px-7">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-violet-300/20 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 shadow-lg backdrop-blur-sm">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={editingId ? "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" : "M12 4.5v15m7.5-7.5h-15"} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Syllabus</p>
                        <h3 className="text-lg font-bold sm:text-xl">{editingId ? "Edit Syllabus" : "Create New Syllabus"}</h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingId(null); }}
                      className="rounded-xl p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Close"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-50/40 px-5 py-5 sm:px-7 sm:py-6">
                  {/* Section 1 — Basics */}
                  <section className="surface p-4 sm:p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">1</div>
                      <h4 className="text-sm font-bold text-slate-900">Basic Information</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="label">Title</label>
                        <input
                          className="input"
                          placeholder="e.g., Mathematics Syllabus — Class 9"
                          required
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="label">Class Level</label>
                          <ClassLevelSelect
                            value={form.class_level}
                            onChange={(v) => setForm({ ...form, class_level: v || 9, subject_id: "" })}
                            required
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="label">Subject <span className="font-normal normal-case text-slate-400">(optional)</span></label>
                          <select
                            className="input"
                            value={form.subject_id}
                            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
                          >
                            <option value="">All Subjects</option>
                            {formSubjects.map((s) => (
                              <option key={s.id} value={s.id}>{s.code} – {s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="label">Academic Year</label>
                          <input
                            className="input"
                            placeholder="2025-2026"
                            required
                            value={form.academic_year}
                            onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="label">File URL <span className="font-normal normal-case text-slate-400">(PDF link)</span></label>
                          <input
                            className="input"
                            placeholder="https://…"
                            value={form.file_url}
                            onChange={(e) => setForm({ ...form, file_url: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Description / Objectives</label>
                        <textarea
                          className="input"
                          rows={3}
                          placeholder="Brief description of curriculum scope, learning objectives, etc."
                          value={form.description}
                          onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Section 2 — Chapters */}
                  <section className="surface mt-4 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">2</div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Chapters / Units</h4>
                          <p className="text-[11px] text-slate-500">{form.chapters.length} item{form.chapters.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addChapter}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Chapter
                      </button>
                    </div>

                    {form.chapters.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
                        <p className="text-sm text-slate-500">No chapters yet. Click "Add Chapter" to start.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {form.chapters.map((c, i) => (
                          <div
                            key={i}
                            className="group relative rounded-2xl border border-slate-200 bg-white p-3 transition-colors hover:border-slate-300 sm:p-4"
                          >
                            {/* Mobile-friendly grid */}
                            <div className="flex gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm sm:h-10 sm:w-10">
                                {i + 1}
                              </div>
                              <div className="min-w-0 flex-1 space-y-2">
                                <input
                                  className="input"
                                  placeholder={`Chapter ${i + 1} title`}
                                  value={c.title}
                                  onChange={(e) => updateChapter(i, "title", e.target.value)}
                                />
                                <textarea
                                  className="input"
                                  rows={2}
                                  placeholder="What's covered in this chapter?"
                                  value={c.description}
                                  onChange={(e) => updateChapter(i, "description", e.target.value)}
                                />
                                <div className="flex items-center justify-between gap-2">
                                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <input
                                      type="number"
                                      min="0"
                                      max="52"
                                      className="w-12 bg-transparent text-center text-sm font-semibold text-slate-700 focus:outline-none focus:ring-0"
                                      placeholder="2"
                                      value={c.weeks}
                                      onChange={(e) => updateChapter(i, "weeks", Number(e.target.value))}
                                      style={{ fontSize: "14px" }}
                                    />
                                    <span className="text-xs text-slate-500">{c.weeks === 1 ? "week" : "weeks"}</span>
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => removeChapter(i)}
                                    className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                                    aria-label="Remove chapter"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t border-slate-200/70 bg-white/80 px-5 py-3 backdrop-blur-sm safe-bottom sm:px-7 sm:py-4">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingId(null); }}
                      className="btn-secondary w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary w-full sm:w-auto">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {editingId ? "Save Changes" : "Create Syllabus"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </>
        )}
        </AnimatePresence>

        {/* Syllabus list grouped by year */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonCard rows={3} />
            <SkeletonCard rows={3} />
          </div>
        ) : syllabi.length === 0 ? (
          <EmptyState
            title="No syllabus found"
            description="Try adjusting the filters above, or contact your administrator."
          />
        ) : (
          <div className="space-y-6">
            {sortedYears.map((year) => (
              <div key={year} className="animate-fade-in">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    Academic Year {year}
                  </h2>
                  <span className="chip bg-indigo-100 text-indigo-700">
                    {grouped[year].length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {grouped[year].map((s) => {
                    const isExpanded = expanded === s.id;
                    return (
                      <div key={s.id} className="surface surface-hover p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-slate-900">{s.title}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium text-indigo-700">
                                Class {s.class_level}
                              </span>
                              {s.subject_label && (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-700">
                                  {s.subject_code} · {s.subject_label}
                                </span>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex flex-col gap-1">
                              <button onClick={() => openEdit(s)} className="text-xs text-indigo-600 hover:underline">
                                Edit
                              </button>
                              <button onClick={() => remove(s.id)} className="text-xs text-rose-600 hover:underline">
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                        {s.description && (
                          <p className="mt-2 text-sm text-slate-600">{s.description}</p>
                        )}
                        {s.chapters?.length > 0 && (
                          <>
                            <button
                              onClick={() => setExpanded(isExpanded ? null : s.id)}
                              className="mt-3 text-xs font-medium text-indigo-600 hover:underline"
                            >
                              {isExpanded ? "Hide" : "Show"} {s.chapters.length} chapter{s.chapters.length > 1 ? "s" : ""} →
                            </button>
                            {isExpanded && (
                              <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                                {s.chapters.map((c, i) => (
                                  <div key={i} className="rounded-lg bg-slate-50 p-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-800">
                                          <span className="text-slate-400">#{i + 1}</span> {c.title}
                                        </p>
                                        {c.description && (
                                          <p className="mt-0.5 text-xs text-slate-600">{c.description}</p>
                                        )}
                                      </div>
                                      {c.weeks > 0 && (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 whitespace-nowrap">
                                          {c.weeks} {c.weeks === 1 ? "week" : "weeks"}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        {s.file_url && (
                          <a
                            href={s.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block text-xs font-medium text-sky-600 hover:underline"
                          >
                            📎 Download PDF
                          </a>
                        )}
                        <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                          Posted by {s.created_by_name || "Admin"} · {fmtDate(s.created_at)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}
