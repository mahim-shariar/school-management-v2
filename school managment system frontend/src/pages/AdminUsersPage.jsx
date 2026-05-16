import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { dashboardApi } from "../api";

const ROLE_SECTIONS = [
  { role: "Students", key: "totalStudents", description: "enrolled in the system", colorClass: "text-sky-600", bgClass: "bg-sky-50", borderClass: "border-sky-200", icon: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" },
  { role: "Teachers", key: "totalTeachers", description: "active teaching staff", colorClass: "text-violet-600", bgClass: "bg-violet-50", borderClass: "border-violet-200", icon: "M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" },
  { role: "Parents", key: "totalParents", description: "linked to student accounts", colorClass: "text-amber-600", bgClass: "bg-amber-50", borderClass: "border-amber-200", icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" },
  { role: "Admins", key: "totalAdmins", description: "system administrators", colorClass: "text-indigo-600", bgClass: "bg-indigo-50", borderClass: "border-indigo-200", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
];

const QUICK_ACTIONS = [
  { label: "View Attendance Report", desc: "Monthly report by class level", to: "/attendance/report", color: "text-slate-700" },
  { label: "Dashboard Overview", desc: "Stats, charts & merit list", to: "/admin", color: "text-indigo-700" },
];

function RoleCard({ role, count, description, icon, colorClass, bgClass, borderClass }) {
  return (
    <div className={`rounded-2xl border ${borderClass} ${bgClass} p-6 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{role}</p>
          <p className={`mt-2 text-4xl font-bold ${colorClass}`}>{count ?? "—"}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className={`rounded-xl p-3 ${bgClass}`}>
          <svg className={`h-6 w-6 ${colorClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    dashboardApi.stats()
      .then((res) => setStats(res.data))
      .catch(() => {});
  }, []);

  const total = stats
    ? ROLE_SECTIONS.reduce((s, r) => s + (stats[r.key] ?? 0), 0)
    : null;

  return (
    <Sidebar>
      <div className="mx-auto max-w-[1100px] space-y-6 p-4 sm:p-6 lg:p-8">

        <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 px-6 py-5 text-white shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Admin Portal</p>
          <h1 className="mt-0.5 text-xl font-bold text-white">User Management</h1>
          <p className="mt-0.5 text-sm text-slate-400">Overview of all users registered in the system.</p>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
            <svg className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total System Users</p>
            <p className="text-3xl font-bold text-slate-900">{total ?? "—"}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLE_SECTIONS.map((s) => (
            <RoleCard key={s.role} role={s.role} count={stats?.[s.key]} description={s.description}
              icon={s.icon} colorClass={s.colorClass} bgClass={s.bgClass} borderClass={s.borderClass} />
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">User Registration</h2>
          <p className="mt-1 text-sm text-slate-500">
            Users register via the self-service portal at{" "}
            <span className="font-mono text-indigo-600">/register</span>.
            Students, teachers, and parents provide role-specific information during signup.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { role: "Student", fields: "Roll No., Class, Section, Guardian names, Address" },
              { role: "Teacher", fields: "Employee ID, Department, Designation" },
              { role: "Parent", fields: "Basic info only — link children after login" },
            ].map((r) => (
              <div key={r.role} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">{r.role}</p>
                <p className="mt-1 text-xs text-slate-500">{r.fields}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-slate-900">Quick Navigation</h2>
          <div className="mt-4 space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.to} to={action.to}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100">
                <div>
                  <p className={`text-sm font-semibold ${action.color}`}>{action.label}</p>
                  <p className="text-xs text-slate-400">{action.desc}</p>
                </div>
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </Sidebar>
  );
}
