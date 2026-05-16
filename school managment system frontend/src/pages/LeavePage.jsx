import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { leaveApi } from "../api";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";

const LEAVE_TYPES = ["Sick", "Personal", "Family", "Medical", "Other"];
const STATUS_BADGE = {
  Pending: "bg-amber-100 text-amber-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-rose-100 text-rose-700",
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function LeavePage() {
  const { user } = useAuth();
  const canReview = user?.role === "admin" || user?.role === "teacher";
  const canApply = user?.role === "student" || user?.role === "teacher";

  const [tab, setTab] = useState(canApply ? "my" : "manage");
  const [my, setMy] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leave_type: "Sick", start_date: "", end_date: "", reason: "" });

  const [reviewingId, setReviewingId] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  async function load() {
    try {
      setLoading(true);
      if (canApply) {
        const r = await leaveApi.my();
        setMy(r.data);
      }
      if (canReview) {
        const r = await leaveApi.list();
        setAll(r.data);
      }
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.role]);

  async function submit(e) {
    e.preventDefault();
    if (!form.start_date || !form.end_date || form.reason.trim().length < 3) {
      setToast({ type: "error", message: "Please complete all fields." });
      return;
    }
    try {
      await leaveApi.apply(form);
      setToast({ type: "success", message: "Leave request submitted." });
      setShowForm(false);
      setForm({ leave_type: "Sick", start_date: "", end_date: "", reason: "" });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function review(id, status) {
    try {
      await leaveApi.review(id, { status, review_note: reviewNote });
      setToast({ type: "success", message: `Leave ${status.toLowerCase()}.` });
      setReviewingId(null);
      setReviewNote("");
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  return (
    <Sidebar title="Leaves">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          hero
          gradient="from-pink-500 to-rose-600"
          title="Leave Management"
          subtitle="Apply for leave or review pending requests"
          action={
            canApply && (
              <button
                onClick={() => setShowForm((s) => !s)}
                className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25"
              >
                {showForm ? "Cancel" : "+ Apply"}
              </button>
            )
          }
        />

        {canApply && canReview && (
          <div className="mb-4 flex gap-2 border-b border-slate-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${tab === "my" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}
              onClick={() => setTab("my")}
            >
              My Requests
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${tab === "manage" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}
              onClick={() => setTab("manage")}
            >
              Review Requests
            </button>
          </div>
        )}

        {showForm && canApply && (
          <form onSubmit={submit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.leave_type}
              onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
            >
              {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              required
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
            />
            <textarea
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-3"
              rows={3}
              placeholder="Reason for leave…"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
            <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white md:col-span-3">
              Submit
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : (
          <>
            {(tab === "my" || (!canReview && canApply)) && (
              <LeaveTable
                leaves={my}
                showApplicant={false}
                empty="You haven't applied for any leave yet."
              />
            )}
            {(tab === "manage" || (!canApply && canReview)) && canReview && (
              <LeaveTable
                leaves={all}
                showApplicant
                reviewingId={reviewingId}
                setReviewingId={setReviewingId}
                reviewNote={reviewNote}
                setReviewNote={setReviewNote}
                onReview={review}
                empty="No leave requests to review."
              />
            )}
          </>
        )}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}

function LeaveTable({ leaves, showApplicant, reviewingId, setReviewingId, reviewNote, setReviewNote, onReview, empty }) {
  if (leaves.length === 0) {
    return <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">{empty}</p>;
  }
  return (
    <>
      {/* Mobile: cards */}
      <div className="space-y-2 md:hidden">
        {leaves.map((l) => (
          <div key={l.id} className="surface p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {showApplicant ? (
                  <>
                    <p className="text-sm font-bold text-slate-900">{l.applicant_name}</p>
                    <p className="text-[11px] capitalize text-slate-500">
                      {l.applicant_role}
                      {l.class_level && ` · Class ${l.class_level}-${l.section}`}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-bold text-slate-900">{l.leave_type} Leave</p>
                )}
              </div>
              <span className={`chip shrink-0 ${STATUS_BADGE[l.status]}`}>{l.status}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="chip bg-indigo-100 text-indigo-700">{l.leave_type}</span>
              <span className="chip bg-slate-100 text-slate-700">{fmtDate(l.start_date)} – {fmtDate(l.end_date)}</span>
            </div>
            <p className="mt-2 text-xs text-slate-700">{l.reason}</p>
            {l.review_note && (
              <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] italic text-slate-600">"{l.review_note}"</p>
            )}
            {showApplicant && l.status === "Pending" && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                {reviewingId !== l.id ? (
                  <button onClick={() => setReviewingId(l.id)} className="w-full rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                    Review
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      className="input"
                      placeholder="Note (optional)"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => onReview(l.id, "Approved")} className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Approve</button>
                      <button onClick={() => onReview(l.id, "Rejected")} className="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">Reject</button>
                      <button onClick={() => setReviewingId(null)} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs">×</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden tbl-wrap md:block">
      <table className="tbl">
        <thead>
          <tr>
            {showApplicant && <th>Applicant</th>}
            <th>Type</th>
            <th>Period</th>
            <th>Reason</th>
            <th>Status</th>
            {showApplicant && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {leaves.map((l) => (
            <tr key={l.id}>
              {showApplicant && (
                <td>
                  <div>{l.applicant_name}</div>
                  <div className="text-xs font-normal capitalize text-slate-500">
                    {l.applicant_role}
                    {l.class_level && ` · Class ${l.class_level}-${l.section}`}
                  </div>
                </td>
              )}
              <td><span className="chip bg-indigo-100 text-indigo-700">{l.leave_type}</span></td>
              <td>{fmtDate(l.start_date)} – {fmtDate(l.end_date)}</td>
              <td className="max-w-xs">{l.reason}</td>
              <td>
                <span className={`chip ${STATUS_BADGE[l.status]}`}>{l.status}</span>
                {l.review_note && <div className="mt-1 text-xs italic text-slate-500">"{l.review_note}"</div>}
              </td>
              {showApplicant && (
                <td className="px-4 py-3">
                  {l.status === "Pending" && reviewingId !== l.id && (
                    <button onClick={() => setReviewingId(l.id)} className="text-xs text-indigo-600 hover:underline">
                      Review
                    </button>
                  )}
                  {reviewingId === l.id && (
                    <div className="flex flex-col gap-1">
                      <input
                        className="rounded border border-slate-300 px-2 py-1 text-xs"
                        placeholder="Note (optional)"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                      />
                      <div className="flex gap-1">
                        <button onClick={() => onReview(l.id, "Approved")} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve</button>
                        <button onClick={() => onReview(l.id, "Rejected")} className="rounded bg-rose-600 px-2 py-1 text-xs text-white">Reject</button>
                        <button onClick={() => setReviewingId(null)} className="rounded bg-slate-200 px-2 py-1 text-xs">×</button>
                      </div>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}
