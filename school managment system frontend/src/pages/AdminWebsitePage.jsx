import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { schoolSettingsApi, staffApi, galleryApi, achievementApi } from "../api";

const TABS = [
  { id: "about", label: "School Profile", icon: "🏫" },
  { id: "staff", label: "Staff & Faculty", icon: "👥" },
  { id: "gallery", label: "Gallery", icon: "🖼️" },
  { id: "achievements", label: "Achievements", icon: "🏆" },
];

export default function AdminWebsitePage() {
  const [tab, setTab] = useState("about");
  const [toast, setToast] = useState(null);

  return (
    <Sidebar title="Website">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          hero
          gradient="from-indigo-600 to-violet-600"
          title="Public Website"
          subtitle="Manage what visitors see on your school's public landing page"
          action={
            <a
              href="/school"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/25"
            >
              ↗ Preview Site
            </a>
          }
        />

        {/* Tab nav */}
        <div className="surface flex gap-1 overflow-x-auto p-1.5 no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {tab === "about" && <SchoolProfileTab onToast={setToast} />}
            {tab === "staff" && <StaffTab onToast={setToast} />}
            {tab === "gallery" && <GalleryTab onToast={setToast} />}
            {tab === "achievements" && <AchievementsTab onToast={setToast} />}
          </motion.div>
        </AnimatePresence>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}

/* ─────────────────────────────────────────────────────── */
function SchoolProfileTab({ onToast }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    schoolSettingsApi.get().then((r) => setSettings(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...settings };
      delete payload.id;
      const r = await schoolSettingsApi.update(payload);
      setSettings(r.data);
      onToast({ type: "success", message: "Website content saved." });
    } catch (err) {
      onToast({ type: "error", message: err.response?.data?.error || "Failed." });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) return <SkeletonList count={3} />;

  return (
    <form onSubmit={save} className="space-y-4">
      <Section title="Basic Info">
        <Field label="School Name" value={settings.school_name} onChange={(v) => setSettings({ ...settings, school_name: v })} />
        <Field label="Tagline" value={settings.tagline} onChange={(v) => setSettings({ ...settings, tagline: v })} placeholder="e.g., Inspiring minds, shaping futures" />
        <Field label="Motto" value={settings.motto} onChange={(v) => setSettings({ ...settings, motto: v })} placeholder="e.g., Knowledge · Discipline · Service" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Founded Year" type="number" value={settings.founded_year} onChange={(v) => setSettings({ ...settings, founded_year: v ? Number(v) : null })} />
          <Field label="Hero Image URL" value={settings.hero_image_url} onChange={(v) => setSettings({ ...settings, hero_image_url: v })} placeholder="https://…" />
        </div>
      </Section>

      <Section title="Statistics (shown in hero)">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Total Students" type="number" value={settings.total_students} onChange={(v) => setSettings({ ...settings, total_students: v ? Number(v) : null })} />
          <Field label="Total Teachers" type="number" value={settings.total_teachers} onChange={(v) => setSettings({ ...settings, total_teachers: v ? Number(v) : null })} />
          <Field label="Awards Won" type="number" value={settings.awards_count} onChange={(v) => setSettings({ ...settings, awards_count: v ? Number(v) : null })} />
        </div>
      </Section>

      <Section title="About / Mission / Vision">
        <Field label="About" textarea value={settings.about} onChange={(v) => setSettings({ ...settings, about: v })} rows={4} />
        <Field label="Mission" textarea value={settings.mission} onChange={(v) => setSettings({ ...settings, mission: v })} rows={3} />
        <Field label="Vision" textarea value={settings.vision} onChange={(v) => setSettings({ ...settings, vision: v })} rows={3} />
        <Field label="History" textarea value={settings.history} onChange={(v) => setSettings({ ...settings, history: v })} rows={3} />
      </Section>

      <Section title="Principal's Message">
        <Field label="Principal Name" value={settings.principal_name} onChange={(v) => setSettings({ ...settings, principal_name: v })} />
        <Field label="Principal Photo URL" value={settings.principal_photo_url} onChange={(v) => setSettings({ ...settings, principal_photo_url: v })} placeholder="https://…" />
        <Field label="Principal's Message" textarea value={settings.principal_message} onChange={(v) => setSettings({ ...settings, principal_message: v })} rows={5} />
      </Section>

      <Section title="Facilities">
        <FacilitiesList value={settings.facilities || []} onChange={(arr) => setSettings({ ...settings, facilities: arr })} />
      </Section>

      <Section title="Contact & Social">
        <Field label="Address" value={settings.address} onChange={(v) => setSettings({ ...settings, address: v })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone" value={settings.phone} onChange={(v) => setSettings({ ...settings, phone: v })} />
          <Field label="Email" value={settings.email} onChange={(v) => setSettings({ ...settings, email: v })} />
          <Field label="Website" value={settings.website} onChange={(v) => setSettings({ ...settings, website: v })} />
          <Field label="Country" value={settings.country} onChange={(v) => setSettings({ ...settings, country: v })} />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Facebook URL" value={settings.facebook_url} onChange={(v) => setSettings({ ...settings, facebook_url: v })} />
          <Field label="Twitter URL" value={settings.twitter_url} onChange={(v) => setSettings({ ...settings, twitter_url: v })} />
          <Field label="YouTube URL" value={settings.youtube_url} onChange={(v) => setSettings({ ...settings, youtube_url: v })} />
        </div>
        <Field label="Map Embed URL" value={settings.map_embed_url} onChange={(v) => setSettings({ ...settings, map_embed_url: v })} placeholder="OpenStreetMap embed URL" />
      </Section>

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Saving…" : "Save Website Content"}
        </button>
      </div>
    </form>
  );
}

function FacilitiesList({ value, onChange }) {
  const [text, setText] = useState("");
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((f, i) => (
          <span key={i} className="chip bg-slate-100 text-slate-700">
            {f}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="ml-1 text-slate-400 hover:text-rose-500">×</button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Add a facility (e.g., Library)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (text.trim()) { onChange([...value, text.trim()]); setText(""); }
            }
          }}
        />
        <button
          type="button"
          onClick={() => { if (text.trim()) { onChange([...value, text.trim()]); setText(""); } }}
          className="btn-secondary"
        >
          Add
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
function StaffTab({ onToast }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const blank = {
    name: "", designation: "", department: "", email: "", phone: "", bio: "",
    photo_url: "", qualifications: [], years_of_experience: 0,
    is_principal: false, is_vice_principal: false, is_department_head: false,
    display_order: 100, is_public: true,
  };

  async function load() {
    setLoading(true);
    try {
      const r = await staffApi.list();
      setList(r.data);
    } catch (e) {
      onToast({ type: "error", message: "Failed to load staff." });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    try {
      if (editing.id) {
        await staffApi.update(editing.id, editing);
        onToast({ type: "success", message: "Staff updated." });
      } else {
        await staffApi.create(editing);
        onToast({ type: "success", message: "Staff added." });
      }
      setEditing(null);
      load();
    } catch (err) {
      onToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this staff member?")) return;
    try {
      await staffApi.remove(id);
      load();
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...blank })} className="btn-primary">+ Add Staff</button>
      </div>
      {loading ? <SkeletonList count={3} /> : list.length === 0 ? <EmptyState title="No staff yet" /> : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <div key={s.id} className="surface surface-hover p-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">
                      {s.name[0]}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{s.name}</p>
                  <p className="text-xs text-indigo-600">{s.designation}</p>
                  <p className="text-[11px] text-slate-500">{s.department}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {s.is_principal && <span className="chip bg-amber-100 text-amber-700">Principal</span>}
                    {s.is_vice_principal && <span className="chip bg-violet-100 text-violet-700">VP</span>}
                    {s.is_department_head && <span className="chip bg-indigo-100 text-indigo-700">Dept Head</span>}
                    {!s.is_public && <span className="chip bg-slate-100 text-slate-500">Hidden</span>}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(s)} className="flex-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100">Edit</button>
                <button onClick={() => remove(s.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <Modal title={editing.id ? "Edit Staff" : "Add Staff"} onClose={() => setEditing(null)}>
            <form onSubmit={save} className="space-y-3">
              <Field label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} required />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Designation" value={editing.designation} onChange={(v) => setEditing({ ...editing, designation: v })} required />
                <Field label="Department" value={editing.department} onChange={(v) => setEditing({ ...editing, department: v })} />
              </div>
              <Field label="Photo URL" value={editing.photo_url} onChange={(v) => setEditing({ ...editing, photo_url: v })} placeholder="https://…" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Email" value={editing.email} onChange={(v) => setEditing({ ...editing, email: v })} />
                <Field label="Phone" value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} />
              </div>
              <Field label="Bio" textarea rows={3} value={editing.bio} onChange={(v) => setEditing({ ...editing, bio: v })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Years of Experience" type="number" value={editing.years_of_experience} onChange={(v) => setEditing({ ...editing, years_of_experience: Number(v) })} />
                <Field label="Display Order (lower = first)" type="number" value={editing.display_order} onChange={(v) => setEditing({ ...editing, display_order: Number(v) })} />
              </div>
              <div className="space-y-1.5 rounded-xl bg-slate-50 p-3">
                <Toggle label="Principal" checked={editing.is_principal} onChange={(v) => setEditing({ ...editing, is_principal: v })} />
                <Toggle label="Vice Principal" checked={editing.is_vice_principal} onChange={(v) => setEditing({ ...editing, is_vice_principal: v })} />
                <Toggle label="Department Head" checked={editing.is_department_head} onChange={(v) => setEditing({ ...editing, is_department_head: v })} />
                <Toggle label="Show on public website" checked={editing.is_public} onChange={(v) => setEditing({ ...editing, is_public: v })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Save</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
function GalleryTab({ onToast }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", caption: "", image_url: "", category: "Campus", display_order: 100, is_public: true });

  async function load() {
    setLoading(true);
    try {
      const r = await galleryApi.list();
      setList(r.data);
    } catch { onToast({ type: "error", message: "Failed to load." }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    try {
      await galleryApi.create(form);
      onToast({ type: "success", message: "Image added." });
      setAdding(false);
      setForm({ title: "", caption: "", image_url: "", category: "Campus", display_order: 100, is_public: true });
      load();
    } catch (err) {
      onToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this image?")) return;
    try { await galleryApi.remove(id); load(); } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)} className="btn-primary">+ Add Image</button>
      </div>
      {loading ? <SkeletonList count={3} /> : list.length === 0 ? <EmptyState title="No images yet" /> : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((g) => (
            <div key={g.id} className="surface group relative overflow-hidden">
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img src={g.image_url} alt={g.title} className="h-full w-full object-cover" />
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-semibold">{g.title}</p>
                <span className="chip bg-slate-100 text-slate-600">{g.category}</span>
              </div>
              <button onClick={() => remove(g.id)} className="absolute right-1.5 top-1.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <Modal title="Add Gallery Image" onClose={() => setAdding(false)}>
            <form onSubmit={add} className="space-y-3">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
              <Field label="Image URL" value={form.image_url} onChange={(v) => setForm({ ...form, image_url: v })} placeholder="https://…" required />
              <Field label="Caption" value={form.caption} onChange={(v) => setForm({ ...form, caption: v })} />
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {["Campus", "Events", "Sports", "Cultural", "Academic", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────── */
function AchievementsTab({ onToast }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Academic", achieved_on: "", awarded_by: "", icon_url: "🏆", is_public: true });

  async function load() {
    setLoading(true);
    try {
      const r = await achievementApi.list();
      setList(r.data);
    } catch { onToast({ type: "error", message: "Failed to load." }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    try {
      await achievementApi.create(form);
      onToast({ type: "success", message: "Achievement added." });
      setAdding(false);
      setForm({ title: "", description: "", category: "Academic", achieved_on: "", awarded_by: "", icon_url: "🏆", is_public: true });
      load();
    } catch (err) {
      onToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this achievement?")) return;
    try { await achievementApi.remove(id); load(); } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAdding(true)} className="btn-primary">+ Add Achievement</button>
      </div>
      {loading ? <SkeletonList count={3} /> : list.length === 0 ? <EmptyState title="No achievements yet" /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((a) => (
            <div key={a.id} className="surface p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-2xl shadow-md">
                  {a.icon_url || "🏆"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="text-[11px] text-slate-500">{new Date(a.achieved_on).toLocaleDateString()} · {a.category}</p>
                </div>
                <button onClick={() => remove(a.id)} className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs text-rose-700">Delete</button>
              </div>
              {a.description && <p className="mt-2 text-xs text-slate-600">{a.description}</p>}
              {a.awarded_by && <p className="mt-1 text-[11px] italic text-slate-500">— {a.awarded_by}</p>}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <Modal title="Add Achievement" onClose={() => setAdding(false)}>
            <form onSubmit={add} className="space-y-3">
              <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
              <Field label="Description" textarea rows={3} value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {["Academic", "Sports", "Cultural", "Science", "Award", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Date" type="date" value={form.achieved_on} onChange={(v) => setForm({ ...form, achieved_on: v })} required />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Awarded By" value={form.awarded_by} onChange={(v) => setForm({ ...form, awarded_by: v })} />
                <Field label="Icon (emoji)" value={form.icon_url} onChange={(v) => setForm({ ...form, icon_url: v })} placeholder="🏆" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setAdding(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Add</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Helpers ─── */
function Section({ title, children }) {
  return (
    <div className="surface p-4 sm:p-5">
      <h3 className="mb-3 text-sm font-bold text-slate-900">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea = false, rows = 2, placeholder = "", required = false }) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea className="input" rows={rows} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} />
      ) : (
        <input className="input" type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-slate-300"}`}
      >
        <motion.span
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        />
      </button>
    </label>
  );
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div className="fixed inset-0 z-50">
      <motion.button
        type="button"
        aria-label="Close"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%", opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className="fixed inset-x-0 bottom-0 max-h-[92vh] sm:inset-0 sm:m-auto sm:max-h-[90vh] sm:max-w-lg sm:p-4"
      >
        <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-t-3xl bg-white sm:max-h-[90vh] sm:rounded-3xl">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
            <h3 className="text-base font-bold">{title}</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}
