import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@school.com", pass: "admin123", grad: "from-indigo-500 to-indigo-700" },
  { role: "Teacher", email: "teacher@school.com", pass: "teacher123", grad: "from-violet-500 to-purple-600" },
  { role: "Student", email: "student@school.com", pass: "student123", grad: "from-sky-500 to-blue-600" },
  { role: "Parent", email: "parent@school.com", pass: "parent123", grad: "from-amber-500 to-orange-600" },
];

const FEATURES = [
  { icon: "📊", title: "Real-time Analytics", desc: "Track attendance, grades, and progress" },
  { icon: "🎓", title: "Multi-Role Portal", desc: "Tailored experience for every user" },
  { icon: "📚", title: "Complete Suite", desc: "Fees, library, transport, syllabus & more" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === "student") navigate("/student");
    if (user.role === "teacher") navigate("/teacher/marks");
    if (user.role === "parent") navigate("/parent");
    if (user.role === "admin") navigate("/admin");
  }, [user, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError("Invalid credentials. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950">
      {/* Decorative gradient orbs (always visible) */}
      <div className="orb left-[-10%] top-[-10%] h-[400px] w-[400px] bg-indigo-600" />
      <div className="orb right-[-10%] top-[20%] h-[500px] w-[500px] bg-violet-600 opacity-40" />
      <div className="orb bottom-[-15%] left-[30%] h-[450px] w-[450px] bg-sky-600 opacity-30" />

      {/* ── Left hero (desktop) ─────────────────────────────────── */}
      <div className="relative z-10 hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-extrabold text-white shadow-xl shadow-indigo-500/40">
            E
          </div>
          <div>
            <p className="text-lg font-bold text-white">EduPortal</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">School Suite</p>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Trusted by modern schools
            </span>
            <h2 className="mt-5 text-5xl font-bold leading-[1.1] tracking-tight text-white xl:text-6xl">
              Next-gen
              <br />
              <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
                school management
              </span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300">
              Everything your school needs in one beautiful, modern platform. Attendance, grades, fees, library, transport and more.
            </p>
          </div>

          <div className="grid gap-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">© {new Date().getFullYear()} EduPortal · Built with care</p>
      </div>

      {/* ── Right form ──────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full items-center justify-center p-4 sm:p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-extrabold text-white shadow-xl shadow-indigo-500/40">
              E
            </div>
            <div>
              <p className="text-base font-bold text-white">EduPortal</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-400">School Suite</p>
            </div>
          </div>

          {/* Glass card */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-2xl shadow-2xl sm:p-7">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-400">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Email
                </label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 transition-all focus:border-indigo-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="you@school.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <div className="relative">
                  <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 transition-all focus:border-indigo-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                    aria-label="Toggle password"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                      {showPass ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 animate-slide-down">
                  <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {submitting ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Signing in…
                    </>
                  ) : (
                    <>
                      Sign in
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-sm text-slate-400">
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300">
                  Register now
                </Link>
              </p>
              <Link
                to="/school"
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
              >
                🌐 Visit Our School Website
              </Link>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl">
            <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Try a demo account
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.role}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                  className="group flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-2.5 py-2 text-left transition-all hover:border-white/15 hover:bg-white/[0.08]"
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${d.grad} text-[10px] font-bold text-white shadow-md`}>
                    {d.role[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-white">{d.role}</p>
                    <p className="truncate text-[10px] text-slate-500">{d.pass}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
