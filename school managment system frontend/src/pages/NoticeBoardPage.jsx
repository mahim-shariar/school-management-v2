import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { noticeApi } from "../api";

const CATEGORIES = ["All", "General", "Academic", "Exam", "Fee", "Holiday", "Event", "Emergency"];
const PRIORITIES = ["normal", "important", "urgent"];
const ROLES = ["student", "teacher", "parent", "admin"];

const PRIORITY_BADGE = {
  normal: "bg-slate-100 text-slate-600",
  important: "bg-amber-100 text-amber-700",
  urgent: "bg-rose-100 text-rose-700",
};

const CATEGORY_BADGE = {
  General: "bg-slate-100 text-slate-600",
  Academic: "bg-sky-100 text-sky-700",
  Exam: "bg-violet-100 text-violet-700",
  Fee: "bg-amber-100 text-amber-700",
  Holiday: "bg-emerald-100 text-emerald-700",
  Event: "bg-pink-100 text-pink-700",
  Emergency: "bg-rose-100 text-rose-700",
};

function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function NoticeBoardPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const canPost = user?.role === "admin" || user?.role === "teacher";
  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "General",
    priority: "normal",
    is_pinned: false,
    target_roles: ["student", "teacher", "parent", "admin"],
  });

  async function load() {
    try {
      setLoading(true);
      const r = await noticeApi.list();
      setNotices(r.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load notices." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setToast({ type: "error", message: "Title and content are required." });
      return;
    }
    try {
      await noticeApi.create(form);
      setToast({ type: "success", message: "Notice posted." });
      setForm({
        title: "",
        content: "",
        category: "General",
        priority: "normal",
        is_pinned: false,
        target_roles: ["student", "teacher", "parent", "admin"],
      });
      setShowForm(false);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to post notice." });
    }
  }

  async function togglePin(id) {
    try {
      await noticeApi.togglePin(id);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await noticeApi.remove(id);
      setToast({ type: "success", message: "Notice deleted." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  function toggleRole(role) {
    setForm((f) => ({
      ...f,
      target_roles: f.target_roles.includes(role)
        ? f.target_roles.filter((r) => r !== role)
        : [...f.target_roles, role],
    }));
  }

  const filtered = notices.filter((n) => {
    if (filterCategory !== "All" && n.category !== filterCategory) return false;
    if (search && !`${n.title} ${n.content}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Sidebar title="Notice Board">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          hero
          gradient="from-rose-500 to-orange-500"
          title="Notice Board"
          subtitle="Announcements and updates from the school"
          action={
            canPost && (
              <button
                onClick={() => setShowForm((s) => !s)}
                className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25"
              >
                {showForm ? "Cancel" : "+ New"}
              </button>
            )
          }
        />

        {showForm && canPost && (
          <form onSubmit={submit} className="surface animate-slide-down space-y-3 p-4 sm:p-5">
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Notice title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              rows={4}
              placeholder="Notice content"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_pinned}
                  onChange={(e) => setForm({ ...form, is_pinned: e.target.checked })}
                />
                Pin to top
              </label>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="font-semibold text-slate-600">Visible to:</span>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleRole(r)}
                  className={`rounded-full px-3 py-1 capitalize ${
                    form.target_roles.includes(r)
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Post Notice
            </button>
          </form>
        )}

        <div className="surface flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:p-3">
          <input
            type="text"
            placeholder="Search notices…"
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <SkeletonList count={3} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No notices found" description="Try a different category or search term." />
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`surface surface-hover animate-fade-in p-4 sm:p-5 ${
                  n.is_pinned ? "border-indigo-300 ring-1 ring-indigo-100" : ""
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  {n.is_pinned && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      📌 Pinned
                    </span>
                  )}
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_BADGE[n.category]}`}>
                    {n.category}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_BADGE[n.priority]}`}>
                    {n.priority}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">{formatDate(n.created_at)}</span>
                </div>
                <h3 className="mb-1 text-lg font-semibold text-slate-900">{n.title}</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{n.content}</p>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-500">— {n.created_by_name || "Staff"}</span>
                  {(isAdmin || n.created_by === user?.id) && (
                    <div className="flex gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => togglePin(n.id)}
                          className="text-xs font-medium text-indigo-600 hover:underline"
                        >
                          {n.is_pinned ? "Unpin" : "Pin"}
                        </button>
                      )}
                      <button
                        onClick={() => remove(n.id)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
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
