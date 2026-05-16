import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { assignmentApi } from "../api";

const STATUS_STYLES = {
  Graded: {
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
  },
  Submitted: {
    badge: "bg-sky-100 text-sky-700",
    border: "border-sky-200",
    bg: "bg-sky-50",
  },
  Pending: {
    badge: "bg-amber-100 text-amber-700",
    border: "border-amber-200",
    bg: "bg-white",
  },
};

function AssignmentCard({ assignment, onSubmit, submitting }) {
  const styles = STATUS_STYLES[assignment.status] || STATUS_STYLES.Pending;
  const dueDate = new Date(assignment.due_date);
  const isPastDue = dueDate < new Date();
  const isSubmittable = assignment.status === "Pending";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm transition-all ${styles.border} ${styles.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}>
              {assignment.status}
            </span>
            {assignment.subject && (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {assignment.subject.label}
              </span>
            )}
            <span className="text-xs text-slate-400">Week {assignment.week_number}</span>
          </div>
          <h3 className="mt-2 font-semibold text-slate-900">{assignment.title}</h3>
          {assignment.description && (
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{assignment.description}</p>
          )}
        </div>
        {isSubmittable && (
          <button
            onClick={() => onSubmit(assignment._id)}
            disabled={submitting === assignment._id}
            className="shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting === assignment._id ? "Submitting…" : "Submit"}
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
        <span className={isPastDue && isSubmittable ? "font-semibold text-rose-500" : ""}>
          Due {dueDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          {isPastDue && isSubmittable ? " (Overdue)" : ""}
        </span>
        <span>By {assignment.assigned_by}</span>
        {assignment.submitted_at && (
          <span className="text-emerald-600">
            Submitted {new Date(assignment.submitted_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>

      {assignment.status === "Graded" && (
        <div className="mt-3 flex items-center gap-4 rounded-xl border border-emerald-200 bg-white px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Marks</p>
            <p className="text-xl font-bold text-emerald-600">{assignment.marks ?? "—"}<span className="text-sm font-normal text-slate-400">/20</span></p>
          </div>
          {assignment.feedback && (
            <div className="border-l border-slate-200 pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Feedback</p>
              <p className="mt-0.5 text-sm text-slate-700">{assignment.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    assignmentApi.myAssignments()
      .then((res) => setAssignments(res.data || []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (id) => {
    setSubmitting(id);
    try {
      await assignmentApi.submit(id);
      setAssignments((prev) =>
        prev.map((a) => a._id === id ? { ...a, status: "Submitted", submitted_at: new Date().toISOString() } : a)
      );
      setToast({ type: "success", text: "Assignment submitted!" });
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.error || "Failed to submit." });
    } finally {
      setSubmitting(null);
    }
  };

  const total = assignments.length;
  const pending = assignments.filter((a) => a.status === "Pending").length;
  const submitted = assignments.filter((a) => a.status === "Submitted" || a.status === "Graded").length;
  const graded = assignments.filter((a) => a.status === "Graded").length;
  const completionRate = total > 0 ? Math.round((submitted / total) * 100) : 0;

  const filtered = filter === "all"
    ? assignments
    : assignments.filter((a) => a.status === filter);

  return (
    <Sidebar>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <div className="mx-auto max-w-[900px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-200">Student Portal</p>
          <h1 className="mt-0.5 text-xl font-bold">My Assignments</h1>
          <p className="mt-0.5 text-sm text-sky-200">View, submit, and track all your weekly assignments.</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total", value: total, color: "text-slate-900", bg: "bg-white border-slate-200" },
            { label: "Pending", value: pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            { label: "Submitted", value: submitted, color: "text-sky-600", bg: "bg-sky-50 border-sky-200" },
            { label: "Graded", value: graded, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl border p-5 shadow-sm ${c.bg}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{c.label}</p>
              <p className={`mt-2 text-3xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Completion rate */}
        {total > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Overall Completion</p>
              <p className="text-sm font-bold text-sky-600">{completionRate}%</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-700"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">{submitted} of {total} submitted</p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "Pending", label: "Pending" },
            { key: "Submitted", label: "Submitted" },
            { key: "Graded", label: "Graded" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${filter === tab.key ? "bg-sky-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignments */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <p className="text-sm text-slate-400">No {filter === "all" ? "" : filter.toLowerCase() + " "}assignments found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <AssignmentCard key={a._id} assignment={a} onSubmit={handleSubmit} submitting={submitting} />
            ))}
          </div>
        )}

      </div>
    </Sidebar>
  );
}
