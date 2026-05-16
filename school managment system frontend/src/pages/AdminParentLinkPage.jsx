import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { authApi } from "../api";

export default function AdminParentLinkPage() {
  const [links, setLinks] = useState([]);
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ parent_id: "", child_id: "" });

  async function load() {
    try {
      setLoading(true);
      const [linksR, parentsR, studentsR] = await Promise.all([
        authApi.parentChildLinks(),
        authApi.users({ role: "parent" }),
        authApi.users({ role: "student" }),
      ]);
      setLinks(linksR.data);
      setParents(parentsR.data);
      setStudents(studentsR.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!form.parent_id || !form.child_id) {
      setToast({ type: "error", message: "Pick both parent and student." });
      return;
    }
    try {
      await authApi.adminLinkParent(form);
      setToast({ type: "success", message: "Linked." });
      setForm({ parent_id: "", child_id: "" });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function unlink(id) {
    if (!window.confirm("Remove this link?")) return;
    try {
      await authApi.adminUnlinkParent(id);
      setToast({ type: "success", message: "Unlinked." });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  return (
    <Sidebar>
      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Parent-Child Linking</h1>
        <p className="mb-6 text-sm text-slate-500">Connect parent accounts to their children</p>

        <form onSubmit={submit} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.parent_id}
            onChange={(e) => setForm({ ...form, parent_id: e.target.value })}
            required
          >
            <option value="">— Select Parent —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.child_id}
            onChange={(e) => setForm({ ...form, child_id: e.target.value })}
            required
          >
            <option value="">— Select Student —</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.first_name} {s.last_name} (Class {s.class_level}-{s.section}, Roll {s.roll_number})
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Link
          </button>
        </form>

        {loading ? (
          <p className="text-center text-slate-500">Loading…</p>
        ) : links.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No links yet.</p>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="space-y-2 md:hidden">
              {links.map((l) => (
                <div key={l.id} className="surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white shadow-md">
                        {l.parent_name?.[0] || "P"}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{l.parent_name}</p>
                        <p className="truncate text-[11px] text-slate-500">{l.parent_email}</p>
                      </div>
                    </div>
                    <button onClick={() => unlink(l.id)} className="shrink-0 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                      Unlink
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{l.child_name}</p>
                      <p className="text-[11px] text-slate-500">Class {l.class_level}-{l.section} · Roll {l.roll_number}</p>
                    </div>
                  </div>
                  {l.parent_phone && (
                    <p className="mt-2 text-[11px] text-slate-500">📞 {l.parent_phone}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden tbl-wrap md:block">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Parent</th>
                    <th>Contact</th>
                    <th>Child</th>
                    <th>Class</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-bold text-white shadow-md">
                            {l.parent_name?.[0] || "P"}
                          </div>
                          <span>{l.parent_name}</span>
                        </div>
                      </td>
                      <td className="text-slate-600">
                        <div>{l.parent_email}</div>
                        <div className="text-xs text-slate-400">{l.parent_phone}</div>
                      </td>
                      <td>{l.child_name}</td>
                      <td><span className="chip bg-slate-100 text-slate-700">Class {l.class_level}-{l.section} · Roll {l.roll_number}</span></td>
                      <td>
                        <button onClick={() => unlink(l.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                          Unlink
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
