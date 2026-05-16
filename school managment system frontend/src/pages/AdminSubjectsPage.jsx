import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { CLASS_LEVELS } from "../constants";
import { subjectApi } from "../api";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/20";

export default function AdminSubjectsPage() {
  const [classLevel, setClassLevel] = useState(9);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toast, setToast] = useState(null);

  const [deletingId, setDeletingId] = useState(null);

  const fetchSubjects = async (level) => {
    setLoading(true);
    try {
      const res = await subjectApi.list(level);
      setSubjects(res.data || []);
    } catch {
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects(classLevel);
  }, [classLevel]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!code.trim() || !label.trim()) {
      setFormError("Code and label are both required.");
      return;
    }
    setAdding(true);
    try {
      const res = await subjectApi.create({ code: code.trim().toUpperCase(), label: label.trim(), classLevel });
      setSubjects((prev) => [...prev, res.data].sort((a, b) => a.label.localeCompare(b.label)));
      setCode("");
      setLabel("");
      setToast({ type: "success", text: `Subject "${res.data.label}" added to Class ${classLevel}.` });
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add subject.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`Delete "${subject.label}" from Class ${classLevel}? Existing marks referencing this subject will still exist but won't show a name.`)) return;
    setDeletingId(subject.id);
    try {
      await subjectApi.remove(subject.id);
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
      setToast({ type: "success", text: `"${subject.label}" deleted.` });
    } catch (err) {
      setToast({ type: "error", text: err.response?.data?.error || "Failed to delete subject." });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Sidebar>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <div className="mx-auto max-w-[900px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Admin Portal</p>
          <h1 className="mt-0.5 text-xl font-bold text-white">Subject Management</h1>
          <p className="mt-0.5 text-sm text-slate-400">Add or remove subjects for each class level.</p>
        </div>

        {/* Class level selector */}
        <div className="flex flex-wrap gap-2">
          {CLASS_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setClassLevel(lvl)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${classLevel === lvl ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              Class {lvl}
            </button>
          ))}
        </div>

        {/* Add subject form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Add Subject to Class {classLevel}</h2>
          <form onSubmit={handleAdd} className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subject Code</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. PHY901"
                className={`mt-2 ${inputCls}`}
                maxLength={20}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subject Name</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Physics"
                className={`mt-2 ${inputCls}`}
                maxLength={100}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={adding}
                className="w-full rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
              >
                {adding ? "Adding…" : "Add Subject"}
              </button>
            </div>
          </form>
          {formError && (
            <p className="mt-3 text-sm text-rose-600">{formError}</p>
          )}
        </div>

        {/* Subjects list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Class {classLevel} Subjects</h2>
              {!loading && (
                <p className="mt-0.5 text-xs text-slate-400">{subjects.length} subject{subjects.length !== 1 ? "s" : ""}</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="mt-3 text-sm text-slate-400">No subjects added for Class {classLevel} yet.</p>
              <p className="mt-1 text-xs text-slate-300">Use the form above to add the first subject.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-semibold text-indigo-600">
                      {subject.code}
                    </span>
                    <span className="font-medium text-slate-900">{subject.label}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(subject)}
                    disabled={deletingId === subject.id}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-500 transition-colors hover:border-rose-300 hover:bg-rose-50 disabled:opacity-40"
                  >
                    {deletingId === subject.id ? "Deleting…" : "Delete"}
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
