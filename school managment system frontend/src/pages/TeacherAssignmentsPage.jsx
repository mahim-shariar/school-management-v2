import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { SECTIONS, CLASS_LEVELS } from "../constants";
import { assignmentApi, subjectApi } from "../api";

const selectCls =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20";

const STATUS_COLORS = {
  Graded: "bg-emerald-100 text-emerald-700",
  Submitted: "bg-sky-100 text-sky-700",
  Pending: "bg-amber-100 text-amber-700",
};

const currentYear = new Date().getFullYear();
const dayOfYear = Math.ceil((new Date() - new Date(currentYear, 0, 1)) / (1000 * 60 * 60 * 24));
const currentWeek = Math.ceil(dayOfYear / 7);

export default function TeacherAssignmentsPage() {
  const [toast, setToast] = useState(null);

  // Filter state
  const [filterClass, setFilterClass] = useState(9);
  const [filterSection, setFilterSection] = useState("A");
  const [filterWeek, setFilterWeek] = useState(currentWeek);
  const [filterYear, setFilterYear] = useState(currentYear);

  // Assignments list
  const [assignments, setAssignments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Subjects for the selected class
  const [subjects, setSubjects] = useState([]);

  // Submissions view
  const [viewingSubs, setViewingSubs] = useState(null); // assignment object
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [gradingId, setGradingId] = useState(null);
  const [gradeValues, setGradeValues] = useState({});

  // New assignment form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", classLevel: 9, section: "A",
    subjectId: "", dueDate: "", weekNumber: currentWeek, year: currentYear,
  });
  const [formSubjects, setFormSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Load subjects when form class changes
  useEffect(() => {
    subjectApi.list(form.classLevel)
      .then((res) => { setFormSubjects(res.data || []); setForm((f) => ({ ...f, subjectId: res.data?.[0]?.id || "" })); })
      .catch(() => setFormSubjects([]));
  }, [form.classLevel]);

  const fetchAssignments = async () => {
    setLoadingList(true);
    try {
      const res = await assignmentApi.list({
        class_level: filterClass,
        section: filterSection,
        week: filterWeek,
        year: filterYear,
      });
      setAssignments(res.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, [filterClass, filterSection, filterWeek, filterYear]);

  const handleViewSubmissions = async (assignment) => {
    setViewingSubs(assignment);
    setLoadingSubs(true);
    setGradeValues({});
    try {
      const res = await assignmentApi.submissions(assignment._id);
      setSubmissions(res.data || []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleGrade = async (submission) => {
    const marks = gradeValues[`${submission.submission_id}-marks`];
    const feedback = gradeValues[`${submission.submission_id}-feedback`] || "";
    setGradingId(submission.submission_id);
    try {
      await assignmentApi.grade(viewingSubs._id, submission.submission_id, {
        marks: marks !== undefined && marks !== "" ? Number(marks) : null,
        feedback,
      });
      setSubmissions((prev) => prev.map((s) =>
        s.submission_id === submission.submission_id
          ? { ...s, status: "Graded", marks: marks !== "" ? Number(marks) : null, feedback }
          : s
      ));
      setToast({ type: "success", text: "Graded successfully." });
    } catch {
      setToast({ type: "error", text: "Failed to grade submission." });
    } finally {
      setGradingId(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim() || !form.dueDate) { setFormError("Title and due date are required."); return; }
    setSubmitting(true);
    try {
      await assignmentApi.create({
        title: form.title.trim(),
        description: form.description.trim(),
        classLevel: form.classLevel,
        section: form.section || null,
        subjectId: form.subjectId || null,
        dueDate: form.dueDate,
        weekNumber: form.weekNumber,
        year: form.year,
      });
      setToast({ type: "success", text: "Assignment created!" });
      setShowForm(false);
      setForm({ title: "", description: "", classLevel: 9, section: "A", subjectId: "", dueDate: "", weekNumber: currentWeek, year: currentYear });
      fetchAssignments();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create assignment.");
    } finally {
      setSubmitting(false);
    }
  };

  const sectionOptions = [...new Set(SECTIONS.map((s) => s.section))];

  if (viewingSubs) {
    const submitted = submissions.filter((s) => s.status !== "Pending").length;
    const graded = submissions.filter((s) => s.status === "Graded").length;
    return (
      <Sidebar>
        <Toast toast={toast} onDismiss={() => setToast(null)} />
        <div className="mx-auto max-w-[900px] space-y-6 p-4 sm:p-6 lg:p-8">
          <button onClick={() => setViewingSubs(null)}
            className="flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Assignments
          </button>

          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-5 text-white shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-200">Submissions</p>
            <h1 className="mt-0.5 text-xl font-bold">{viewingSubs.title}</h1>
            <p className="mt-0.5 text-sm text-violet-200">
              Class {viewingSubs.class_level}{viewingSubs.section ? ` · Section ${viewingSubs.section}` : ""} · Week {viewingSubs.week_number}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total", value: submissions.length, color: "text-slate-900" },
              { label: "Submitted", value: submitted, color: "text-sky-600" },
              { label: "Graded", value: graded, color: "text-emerald-600" },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{c.label}</p>
                <p className={`mt-2 text-3xl font-bold ${c.color}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loadingSubs ? (
              <div className="flex justify-center py-12">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {submissions.map((sub) => (
                  <div key={sub.student_id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{sub.student_name}</p>
                        <p className="text-xs text-slate-400">Roll {sub.roll_number} · Section {sub.section}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[sub.status] || STATUS_COLORS.Pending}`}>
                        {sub.status}
                      </span>
                    </div>
                    {sub.status !== "Pending" && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Marks /20</label>
                          <input
                            type="number" min={0} max={20}
                            defaultValue={sub.marks ?? ""}
                            onChange={(e) => setGradeValues((prev) => ({ ...prev, [`${sub.submission_id}-marks`]: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                            placeholder="—"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Feedback</label>
                          <input
                            type="text"
                            defaultValue={sub.feedback || ""}
                            onChange={(e) => setGradeValues((prev) => ({ ...prev, [`${sub.submission_id}-feedback`]: e.target.value }))}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
                            placeholder="Optional feedback"
                          />
                        </div>
                      </div>
                    )}
                    {sub.status !== "Pending" && (
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleGrade(sub)}
                          disabled={gradingId === sub.submission_id}
                          className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-violet-700 disabled:opacity-50"
                        >
                          {gradingId === sub.submission_id ? "Saving…" : sub.status === "Graded" ? "Update Grade" : "Grade"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <div className="mx-auto max-w-[1000px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-200">Teacher Portal</p>
          <h1 className="mt-0.5 text-xl font-bold">Assignments</h1>
          <p className="mt-0.5 text-sm text-violet-200">Create weekly assignments and track student submissions.</p>
        </div>

        {/* Filters */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Class</label>
            <select value={filterClass} onChange={(e) => setFilterClass(Number(e.target.value))} className={selectCls}>
              {CLASS_LEVELS.map((l) => <option key={l} value={l}>Class {l}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Section</label>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className={selectCls}>
              {sectionOptions.map((s) => <option key={s} value={s}>Section {s}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Week</label>
            <input type="number" min={1} max={52} value={filterWeek}
              onChange={(e) => setFilterWeek(Number(e.target.value))}
              className={`mt-2 ${inputCls}`} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Year</label>
            <input type="number" min={2020} max={2100} value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
              className={`mt-2 ${inputCls}`} />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-[0.98]">
            {showForm ? "Cancel" : "+ New Assignment"}
          </button>
        </div>

        {/* New assignment form */}
        {showForm && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6 shadow-sm">
            <h2 className="font-semibold text-violet-900">New Assignment</h2>
            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600">Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Week 10 Physics Assignment"
                  className={`mt-2 ${inputCls}`} maxLength={200} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Assignment instructions or details…"
                  rows={3}
                  className={`mt-2 ${inputCls} resize-none`} maxLength={2000} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600">Class Level *</label>
                  <select value={form.classLevel} onChange={(e) => setForm((f) => ({ ...f, classLevel: Number(e.target.value) }))} className={`mt-2 ${selectCls}`}>
                    {CLASS_LEVELS.map((l) => <option key={l} value={l}>Class {l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600">Section (blank = all)</label>
                  <select value={form.section} onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} className={`mt-2 ${selectCls}`}>
                    <option value="">All Sections</option>
                    {sectionOptions.map((s) => <option key={s} value={s}>Section {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600">Subject</label>
                  <select value={form.subjectId} onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))} className={`mt-2 ${selectCls}`}>
                    <option value="">No specific subject</option>
                    {formSubjects.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600">Due Date *</label>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                    className={`mt-2 ${inputCls}`} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600">Week Number</label>
                  <input type="number" min={1} max={52} value={form.weekNumber}
                    onChange={(e) => setForm((f) => ({ ...f, weekNumber: Number(e.target.value) }))}
                    className={`mt-2 ${inputCls}`} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600">Year</label>
                  <input type="number" min={2020} max={2100} value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    className={`mt-2 ${inputCls}`} />
                </div>
              </div>
              {formError && <p className="text-sm text-rose-600">{formError}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
                  {submitting ? "Creating…" : "Create Assignment"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Assignments list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="font-semibold text-slate-900">
              Class {filterClass} · Section {filterSection} · Week {filterWeek}
            </h2>
            {!loadingList && (
              <span className="text-xs text-slate-400">{assignments.length} assignment{assignments.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {loadingList ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-violet-600" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-slate-400">No assignments for this week.</p>
              <p className="mt-1 text-xs text-slate-300">Use the "+ New Assignment" button to create one.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <div key={a._id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{a.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {a.subject && (
                        <span className="rounded-md bg-violet-50 px-2 py-0.5 font-medium text-violet-600">{a.subject.label}</span>
                      )}
                      <span>Due {new Date(a.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                      {a.section ? <span>Section {a.section}</span> : <span className="text-slate-300">All sections</span>}
                      <span>by {a.assigned_by}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewSubmissions(a)}
                    className="ml-4 shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-violet-600 transition-colors hover:bg-violet-50"
                  >
                    View Submissions
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Sidebar>
  );
}
