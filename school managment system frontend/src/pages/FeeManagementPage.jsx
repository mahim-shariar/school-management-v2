import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { authApi, feeApi } from "../api";
import { ClassLevelSelect, SectionSelect } from "../components/ClassSectionPicker";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { SkeletonList } from "../components/Skeleton";

const FEE_TYPES = ["Tuition", "Exam", "Library", "Transport", "Sports", "Lab", "Other"];
const STATUS_BADGE = {
  Paid: "bg-emerald-100 text-emerald-700",
  Unpaid: "bg-amber-100 text-amber-700",
  Overdue: "bg-rose-100 text-rose-700",
  Waived: "bg-slate-100 text-slate-700",
};

function fmtMoney(n) {
  return `৳ ${(Number(n) || 0).toLocaleString()}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function FeeManagementPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";
  const isParent = user?.role === "parent";

  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState({ status: "", fee_type: "", class_level: "" });

  const [showSingleForm, setShowSingleForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [singleForm, setSingleForm] = useState({
    student_id: "",
    fee_type: "Tuition",
    amount: 2500,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: "",
    remarks: "",
  });
  const [bulkForm, setBulkForm] = useState({
    class_level: 9,
    section: "",
    fee_type: "Tuition",
    amount: 2500,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: "",
  });
  const [payingId, setPayingId] = useState(null);
  const [payForm, setPayForm] = useState({ paid_amount: 0, payment_method: "Cash", transaction_id: "", remarks: "" });

  async function loadAdmin() {
    try {
      setLoading(true);
      const [feesR, statsR, studR] = await Promise.all([
        feeApi.list(filter),
        feeApi.stats(),
        authApi.users({ role: "student" }),
      ]);
      setFees(feesR.data);
      setStats(statsR.data);
      setStudents(studR.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  async function loadStudent() {
    try {
      setLoading(true);
      const r = await feeApi.my();
      setFees(r.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  async function loadParent() {
    try {
      setLoading(true);
      const r = await authApi.myChildren();
      setChildren(r.data);
      if (r.data.length > 0) {
        const child = selectedChild || r.data[0];
        setSelectedChild(child);
        const f = await feeApi.childFees(child.id);
        setFees(f.data);
      }
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) loadAdmin();
    else if (isStudent) loadStudent();
    else if (isParent) loadParent();
  }, [user?.role, JSON.stringify(filter)]);

  useEffect(() => {
    if (isParent && selectedChild) {
      feeApi.childFees(selectedChild.id).then((r) => setFees(r.data));
    }
  }, [selectedChild?.id]);

  async function createSingle(e) {
    e.preventDefault();
    if (!singleForm.student_id || !singleForm.due_date) {
      setToast({ type: "error", message: "Student and due date required." });
      return;
    }
    try {
      await feeApi.create(singleForm);
      setToast({ type: "success", message: "Fee created." });
      setShowSingleForm(false);
      loadAdmin();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function createBulk(e) {
    e.preventDefault();
    if (!bulkForm.due_date) {
      setToast({ type: "error", message: "Due date required." });
      return;
    }
    try {
      const r = await feeApi.bulk(bulkForm);
      setToast({ type: "success", message: `Created ${r.data.created} fee records.` });
      setShowBulkForm(false);
      loadAdmin();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  function startPay(fee) {
    setPayingId(fee.id);
    setPayForm({ paid_amount: fee.amount, payment_method: "Cash", transaction_id: "", remarks: "" });
  }

  async function submitPay() {
    try {
      await feeApi.pay(payingId, payForm);
      setToast({ type: "success", message: "Fee marked paid." });
      setPayingId(null);
      loadAdmin();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function remove(id) {
    if (!window.confirm("Delete this fee record?")) return;
    try {
      await feeApi.remove(id);
      loadAdmin();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  const myTotals = useMemo(() => {
    let total = 0, paid = 0, due = 0;
    fees.forEach((f) => {
      total += f.amount;
      if (f.status === "Paid") paid += f.paid_amount || 0;
      else due += f.amount;
    });
    return { total, paid, due };
  }, [fees]);

  return (
    <Sidebar title="Fees">
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          hero
          gradient="from-amber-500 to-orange-600"
          title="Fee Management"
          subtitle={isAdmin ? "Manage fees for all students" : isStudent ? "Your fee records" : "Your children's fees"}
          action={
            isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowSingleForm(true); setShowBulkForm(false); }}
                  className="rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25"
                >
                  + Single
                </button>
                <button
                  onClick={() => { setShowBulkForm(true); setShowSingleForm(false); }}
                  className="rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/25"
                >
                  + Bulk
                </button>
              </div>
            )
          }
        />

        {isAdmin && stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Total Records" value={stats.total_records} />
            <StatCard label="Total Paid" value={fmtMoney(stats.total_paid)} color="text-emerald-700" />
            <StatCard label="Outstanding" value={fmtMoney(stats.total_outstanding)} color="text-rose-700" />
            <StatCard label="Overdue Count" value={stats.overdue_count} color="text-amber-700" />
          </div>
        )}

        {(isStudent || isParent) && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            <StatCard label="Total Due" value={fmtMoney(myTotals.total)} />
            <StatCard label="Paid" value={fmtMoney(myTotals.paid)} color="text-emerald-700" />
            <StatCard label="Outstanding" value={fmtMoney(myTotals.due)} color="text-rose-700" />
          </div>
        )}

        {isParent && children.length > 1 && (
          <div className="mb-4 flex gap-2">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChild(c)}
                className={`rounded-full px-3 py-1 text-sm ${
                  selectedChild?.id === c.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                {c.first_name} {c.last_name}
              </button>
            ))}
          </div>
        )}

        {showSingleForm && isAdmin && (
          <form onSubmit={createSingle} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-3"
              value={singleForm.student_id}
              onChange={(e) => setSingleForm({ ...singleForm, student_id: e.target.value })}
              required
            >
              <option value="">— Select Student —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name} (Class {s.class_level}-{s.section}, Roll {s.roll_number})
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={singleForm.fee_type}
              onChange={(e) => setSingleForm({ ...singleForm, fee_type: e.target.value })}
            >
              {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="number"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Amount"
              value={singleForm.amount}
              onChange={(e) => setSingleForm({ ...singleForm, amount: Number(e.target.value) })}
            />
            <input
              type="number"
              min="1"
              max="12"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Month (optional)"
              value={singleForm.month || ""}
              onChange={(e) => setSingleForm({ ...singleForm, month: e.target.value ? Number(e.target.value) : null })}
            />
            <input
              type="number"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Year"
              value={singleForm.year}
              onChange={(e) => setSingleForm({ ...singleForm, year: Number(e.target.value) })}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={singleForm.due_date}
              onChange={(e) => setSingleForm({ ...singleForm, due_date: e.target.value })}
              required
            />
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Create</button>
              <button type="button" onClick={() => setShowSingleForm(false)} className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium">Cancel</button>
            </div>
          </form>
        )}

        {showBulkForm && isAdmin && (
          <form onSubmit={createBulk} className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
            <ClassLevelSelect
              value={bulkForm.class_level}
              onChange={(v) => setBulkForm({ ...bulkForm, class_level: v || 9 })}
            />
            <SectionSelect
              value={bulkForm.section}
              onChange={(v) => setBulkForm({ ...bulkForm, section: v })}
              allowAll
            />
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={bulkForm.fee_type}
              onChange={(e) => setBulkForm({ ...bulkForm, fee_type: e.target.value })}
            >
              {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              type="number"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Amount"
              value={bulkForm.amount}
              onChange={(e) => setBulkForm({ ...bulkForm, amount: Number(e.target.value) })}
            />
            <input
              type="number"
              min="1"
              max="12"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Month"
              value={bulkForm.month || ""}
              onChange={(e) => setBulkForm({ ...bulkForm, month: e.target.value ? Number(e.target.value) : null })}
            />
            <input
              type="date"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={bulkForm.due_date}
              onChange={(e) => setBulkForm({ ...bulkForm, due_date: e.target.value })}
              required
            />
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Apply to all</button>
              <button type="button" onClick={() => setShowBulkForm(false)} className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium">Cancel</button>
            </div>
          </form>
        )}

        {isAdmin && (
          <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-4">
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All status</option>
              {Object.keys(STATUS_BADGE).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={filter.fee_type}
              onChange={(e) => setFilter({ ...filter, fee_type: e.target.value })}
            >
              <option value="">All types</option>
              {FEE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ClassLevelSelect
              value={filter.class_level}
              onChange={(v) => setFilter({ ...filter, class_level: v })}
            />
          </div>
        )}

        {loading ? (
          <SkeletonList count={4} />
        ) : fees.length === 0 ? (
          <EmptyState title="No fee records" description="Fee entries will appear here once added." />
        ) : (
          <>
            {/* Mobile: card list */}
            <div className="space-y-2 md:hidden">
              {fees.map((f) => (
                <div key={f.id} className="surface animate-fade-in p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {isAdmin && (
                        <div className="mb-1">
                          <p className="text-sm font-semibold text-slate-900">{f.student_name}</p>
                          <p className="text-[11px] text-slate-500">Class {f.class_level}-{f.section} · Roll {f.roll_number}</p>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="chip bg-slate-100 text-slate-700">{f.fee_type}</span>
                        <span className="chip bg-indigo-50 text-indigo-700">{f.month ? `${f.month}/${f.year}` : f.year}</span>
                        <span className={`chip ${STATUS_BADGE[f.status]}`}>{f.status}</span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">Due {fmtDate(f.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-900">{fmtMoney(f.amount)}</p>
                      {f.status === "Paid" && <p className="text-[10px] text-emerald-600">✓ {fmtDate(f.paid_at)}</p>}
                    </div>
                  </div>
                  {isAdmin && f.status !== "Paid" && (
                    <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                      {payingId !== f.id ? (
                        <>
                          <button onClick={() => startPay(f)} className="flex-1 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Mark Paid</button>
                          <button onClick={() => remove(f.id)} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">Delete</button>
                        </>
                      ) : (
                        <div className="flex w-full flex-col gap-2">
                          <input type="number" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Amount" value={payForm.paid_amount} onChange={(e) => setPayForm({ ...payForm, paid_amount: Number(e.target.value) })} />
                          <select className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm" value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}>
                            <option>Cash</option><option>Bkash</option><option>Nagad</option><option>Bank Transfer</option>
                          </select>
                          <div className="flex gap-2">
                            <button onClick={submitPay} className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Confirm</button>
                            <button onClick={() => setPayingId(null)} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="surface hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  {isAdmin && <th className="px-4 py-3 font-medium text-slate-700">Student</th>}
                  <th className="px-4 py-3 font-medium text-slate-700">Type</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Period</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Due Date</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Amount</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fees.map((f) => (
                  <tr key={f.id}>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{f.student_name}</div>
                        <div className="text-xs text-slate-500">Class {f.class_level}-{f.section} · Roll {f.roll_number}</div>
                      </td>
                    )}
                    <td className="px-4 py-3 text-slate-700">{f.fee_type}</td>
                    <td className="px-4 py-3 text-slate-700">{f.month ? `${f.month}/${f.year}` : f.year}</td>
                    <td className="px-4 py-3 text-slate-700">{fmtDate(f.due_date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{fmtMoney(f.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[f.status]}`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && f.status !== "Paid" && payingId !== f.id && (
                        <button onClick={() => startPay(f)} className="text-xs font-medium text-emerald-600 hover:underline">
                          Mark Paid
                        </button>
                      )}
                      {isAdmin && payingId === f.id && (
                        <div className="flex flex-col gap-1">
                          <input
                            type="number"
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            placeholder="Amount"
                            value={payForm.paid_amount}
                            onChange={(e) => setPayForm({ ...payForm, paid_amount: Number(e.target.value) })}
                          />
                          <select
                            className="rounded border border-slate-300 px-2 py-1 text-xs"
                            value={payForm.payment_method}
                            onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                          >
                            <option>Cash</option><option>Bkash</option><option>Nagad</option><option>Bank Transfer</option>
                          </select>
                          <div className="flex gap-1">
                            <button onClick={submitPay} className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">OK</button>
                            <button onClick={() => setPayingId(null)} className="rounded bg-slate-200 px-2 py-1 text-xs">×</button>
                          </div>
                        </div>
                      )}
                      {isAdmin && (
                        <button onClick={() => remove(f.id)} className="ml-2 text-xs text-rose-600 hover:underline">
                          Delete
                        </button>
                      )}
                      {f.status === "Paid" && !isAdmin && (
                        <span className="text-xs text-emerald-600">✓ {fmtDate(f.paid_at)}</span>
                      )}
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

function StatCard({ label, value, color = "text-slate-900" }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
