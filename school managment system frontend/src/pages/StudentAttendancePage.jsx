import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { STATUS_STYLES } from "../constants";
import { attendanceApi } from "../api";

const today = new Date();
const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
const defaultTo = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

const inputCls =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors hover:border-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20";

export default function StudentAttendancePage() {
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);
  const [allRecords, setAllRecords] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    attendanceApi.myAttendance()
      .then((res) => {
        const sorted = [...(res.data.records || [])].sort((a, b) => b.date.localeCompare(a.date));
        setAllRecords(sorted);
        const filtered = sorted.filter((r) => r.date >= defaultFrom && r.date <= defaultTo);
        setRecords(filtered);
      })
      .catch(() => setError("Failed to load attendance records."))
      .finally(() => setLoading(false));
  }, []);

  const fetchAttendance = () => {
    const filtered = allRecords
      .filter((r) => r.date >= fromDate && r.date <= toDate)
      .sort((a, b) => b.date.localeCompare(a.date));
    setRecords(filtered);
  };

  const present = records.filter((r) => r.status === "Present").length;
  const absent = records.filter((r) => r.status === "Absent").length;
  const late = records.filter((r) => r.status === "Late").length;
  const total = records.length;
  const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

  return (
    <Sidebar>
      <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-200">Student Portal</p>
          <h1 className="mt-0.5 text-xl font-bold">My Attendance</h1>
          <p className="mt-0.5 text-sm text-sky-200">View your attendance over a custom date range.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} className={inputCls} />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={fetchAttendance}
            disabled={loading}
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Summary</p>
            <div className="mt-4">
              <div className="mb-4 flex items-end gap-2">
                <span className="text-4xl font-bold text-sky-600">{percentage}%</span>
                <span className="mb-1 text-sm text-slate-400">present rate</span>
              </div>
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${percentage >= 75 ? "bg-emerald-500" : percentage >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Total Days", value: total, color: "text-slate-700" },
                  { label: "Present", value: present, color: "text-emerald-600 font-semibold" },
                  { label: "Absent", value: absent, color: "text-rose-600 font-semibold" },
                  { label: "Late", value: late, color: "text-amber-600 font-semibold" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className={color}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {fromDate} — {toDate}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <p className="font-semibold text-slate-900">Daily Records</p>
              {records.length > 0 && <p className="mt-0.5 text-xs text-slate-400">{records.length} record{records.length !== 1 ? "s" : ""}</p>}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
              </div>
            ) : records.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">No records found for this period.</p>
            ) : (
              <>
                {/* Mobile: card-list */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {records.map((record) => {
                    const d = new Date(record.date + "T00:00:00");
                    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
                    const monthDay = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <div key={record.date} className="flex items-center gap-3 px-5 py-3">
                        <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{dayName.slice(0, 3)}</span>
                          <span className="text-sm font-bold text-slate-900">{d.getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">{monthDay}</p>
                          <p className="text-[11px] text-slate-500">{dayName}</p>
                        </div>
                        <span className={`chip ${STATUS_STYLES[record.status]?.badge ?? "bg-slate-100 text-slate-600"}`}>
                          {record.status}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Date", "Day", "Status"].map((h) => (
                          <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((record) => {
                        const d = new Date(record.date + "T00:00:00");
                        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                        return (
                          <tr key={record.date} className="transition-colors hover:bg-slate-50">
                            <td className="px-5 py-3 font-mono text-sm text-slate-700">{record.date}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">{dayName}</td>
                            <td className="px-5 py-3">
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[record.status]?.badge ?? "bg-slate-100 text-slate-600"}`}>
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </Sidebar>
  );
}
