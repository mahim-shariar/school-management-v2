import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roleBadgeColors = {
  student: "bg-sky-100 text-sky-700",
  teacher: "bg-violet-100 text-violet-700",
  parent: "bg-amber-100 text-amber-700",
  admin: "bg-rose-100 text-rose-700",
};

export default function NavBar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (path) =>
    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
      location.pathname === path
        ? "bg-sky-50 text-sky-600"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const navLinks = () => {
    if (!user) return [];
    if (user.role === "student")
      return [
        { to: "/student", label: "Dashboard" },
        { to: "/student/attendance", label: "Attendance" },
      ];
    if (user.role === "teacher")
      return [
        { to: "/teacher/marks", label: "Marks Entry" },
        { to: "/teacher/attendance", label: "Attendance" },
      ];
    if (user.role === "parent") return [{ to: "/parent", label: "My Children" }];
    if (user.role === "admin")
      return [
        { to: "/admin", label: "Dashboard" },
        { to: "/attendance/report", label: "Attendance Report" },
      ];
    return [];
  };

  const links = navLinks();

  const homeHref =
    user?.role === "teacher"
      ? "/teacher/marks"
      : user?.role === "admin"
        ? "/admin"
        : user?.role === "parent"
          ? "/parent"
          : "/student";

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <Link to={homeHref} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
              S
            </div>
            <span className="font-semibold text-slate-900 text-sm">School Portal</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-slate-500">{user.username}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[user.role] ?? "bg-slate-100 text-slate-700"}`}>
                {user.role}
              </span>
              <button
                onClick={logout}
                className="ml-1 rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          ) : null}

          {/* Mobile hamburger */}
          {user ? (
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && user ? (
        <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 md:hidden">
          <div className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={linkClass(link.to)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeColors[user.role] ?? "bg-slate-100 text-slate-700"}`}>
                {user.role}
              </span>
              <span className="text-sm text-slate-600">{user.username}</span>
            </div>
            <button
              onClick={() => { setMobileOpen(false); logout(); }}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
