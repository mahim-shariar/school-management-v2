import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { eventApi } from "../api";

const EVENT_TYPES = {
  Holiday: { label: "Holiday", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Exam: { label: "Exam", color: "bg-rose-100 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  Sports: { label: "Sports", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Cultural: { label: "Cultural", color: "bg-pink-100 text-pink-700 border-pink-200", dot: "bg-pink-500" },
  Meeting: { label: "Meeting", color: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  Vacation: { label: "Vacation", color: "bg-sky-100 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  Other: { label: "Other", color: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-500" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function AcademicCalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [year] = useState(new Date().getFullYear());
  const [filterType, setFilterType] = useState("All");
  const [showForm, setShowForm] = useState(false);

  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "Holiday",
    start_date: "",
    end_date: "",
    is_holiday: false,
  });

  async function load() {
    try {
      setLoading(true);
      const r = await eventApi.list({ year });
      setEvents(r.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [year]);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date || !form.end_date) {
      setToast({ type: "error", message: "Title and dates required." });
      return;
    }
    try {
      await eventApi.create(form);
      setToast({ type: "success", message: "Event added." });
      setForm({ title: "", description: "", event_type: "Holiday", start_date: "", end_date: "", is_holiday: false });
      setShowForm(false);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this event?")) return;
    try {
      await eventApi.remove(id);
      setToast({ type: "success", message: "Event deleted." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  const filtered = events.filter((e) => filterType === "All" || e.event_type === filterType);
  const grouped = {};
  filtered.forEach((e) => {
    const m = new Date(e.start_date).getMonth();
    if (!grouped[m]) grouped[m] = [];
    grouped[m].push(e);
  });

  const now = new Date();
  const upcoming = events
    .filter((e) => new Date(e.start_date) >= now)
    .slice(0, 5);

  return (
    <Sidebar title="Calendar">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          hero
          gradient="from-emerald-500 to-teal-600"
          title={`Academic Calendar ${year}`}
          subtitle="School events and holidays"
          action={
            isAdmin && (
              <button
                onClick={() => setShowForm((s) => !s)}
                className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25"
              >
                {showForm ? "Cancel" : "+ Event"}
              </button>
            )
          }
        />

        {upcoming.length > 0 && (
          <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-indigo-900">Upcoming Events</h3>
            <div className="space-y-1">
              {upcoming.map((e) => (
                <div key={e.id} className="flex items-center gap-3 text-sm">
                  <span className={`h-2 w-2 rounded-full ${EVENT_TYPES[e.event_type]?.dot || "bg-slate-500"}`} />
                  <span className="text-slate-600">{formatDate(e.start_date)}</span>
                  <span className="font-medium text-slate-900">{e.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && isAdmin && (
          <form onSubmit={submit} className="mb-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Event title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={2}
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              >
                {Object.keys(EVENT_TYPES).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_holiday}
                  onChange={(e) => setForm({ ...form, is_holiday: e.target.checked })}
                />
                School holiday
              </label>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Add Event
            </button>
          </form>
        )}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button
            onClick={() => setFilterType("All")}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              filterType === "All" ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
            }`}
          >
            All
          </button>
          {Object.keys(EVENT_TYPES).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                filterType === t ? "bg-indigo-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <SkeletonList count={3} />
        ) : Object.keys(grouped).length === 0 ? (
          <EmptyState title="No events" description="No calendar events match the current filter." />
        ) : (
          <div className="space-y-4">
            {MONTHS.map((monthName, m) => {
              const monthEvents = grouped[m];
              if (!monthEvents) return null;
              return (
                <div key={m} className="surface animate-fade-in">
                  <div className="border-b border-slate-100 px-5 py-3">
                    <h3 className="font-semibold text-slate-900">{monthName} {year}</h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {monthEvents.map((e) => {
                      const cfg = EVENT_TYPES[e.event_type] || EVENT_TYPES.Other;
                      return (
                        <div key={e.id} className="flex items-start gap-3 px-5 py-3">
                          <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">
                                {formatDate(e.start_date)}
                                {e.end_date && new Date(e.end_date).getTime() !== new Date(e.start_date).getTime()
                                  ? ` – ${formatDate(e.end_date)}`
                                  : ""}
                              </span>
                              <span className={`rounded-full border px-2 py-0.5 text-xs ${cfg.color}`}>
                                {e.event_type}
                              </span>
                              {e.is_holiday && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700">
                                  Holiday
                                </span>
                              )}
                            </div>
                            <h4 className="mt-1 text-sm font-semibold text-slate-900">{e.title}</h4>
                            {e.description && <p className="mt-0.5 text-xs text-slate-600">{e.description}</p>}
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => remove(e.id)}
                              className="text-xs text-rose-600 hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}
