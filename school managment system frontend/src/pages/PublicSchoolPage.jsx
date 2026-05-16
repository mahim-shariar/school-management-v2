import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  animate as fmAnimate,
} from "framer-motion";
import { publicApi } from "../api";

/* ──────────────────────────────────────────────────────────
 *  Hooks / helpers
 * ────────────────────────────────────────────────────────── */
const SECTIONS = [
  { id: "about", label: "About" },
  { id: "principal", label: "Principal" },
  { id: "staff", label: "Faculty" },
  { id: "achievements", label: "Awards" },
  { id: "gallery", label: "Gallery" },
  { id: "news", label: "News" },
  { id: "contact", label: "Contact" },
];

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Animated number counter (counts up when in view) */
function Counter({ to, suffix = "+", duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = fmAnimate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setVal(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/** Magnetic button — subtle cursor-follow effect */
function MagneticButton({ children, className = "", as: As = "button", ...props }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        x.set(cx * 0.18);
        y.set(cy * 0.18);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ x: sx, y: sy }}
      className="inline-block"
    >
      <As className={className} {...props}>{children}</As>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Section components
 * ────────────────────────────────────────────────────────── */

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 32, mass: 0.4 });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500"
    />
  );
}

function Navbar({ school, activeSection }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-white/80 backdrop-blur-xl shadow-[0_1px_0_rgba(15,23,42,0.06)]" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Hamburger — fully left on mobile */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`-ml-1 rounded-lg p-2 transition-colors lg:hidden ${scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"}`}
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={open ? "M6 18L18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"} />
          </svg>
        </button>

        {/* Desktop nav links — left side on desktop */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {SECTIONS.map((s) => {
            const isActive = activeSection === s.id;
            return (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  scrolled
                    ? isActive ? "text-indigo-600" : "text-slate-600 hover:text-slate-900"
                    : isActive ? "text-white" : "text-indigo-100 hover:text-white"
                }`}
              >
                {s.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className={`absolute inset-x-2 -bottom-1 h-0.5 rounded-full ${scrolled ? "bg-indigo-600" : "bg-white"}`}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Brand + Sign In — both anchored to the right */}
        <Link to="/school" className="ml-auto flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className={`text-[13px] font-bold leading-tight transition-colors ${scrolled ? "text-slate-900" : "text-white"}`}>
              {school?.school_name || "EduPortal"}
            </p>
            <p className={`text-[10px] uppercase tracking-wider transition-colors ${scrolled ? "text-slate-500" : "text-indigo-200"}`}>
              Est. {school?.founded_year || "—"}
            </p>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-extrabold text-white shadow-md transition-transform hover:scale-110`}>
            E
          </div>
        </Link>

        <MagneticButton
          as={Link}
          to="/"
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2 sm:text-sm ${
            scrolled
              ? "bg-slate-900 text-white shadow-lg hover:bg-slate-800"
              : "bg-white text-slate-900 shadow-lg hover:shadow-xl"
          }`}
        >
          Sign In
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </MagneticButton>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                  {s.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

/* ── HERO ────────────────────────────────────────────────── */
function Hero({ school }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);

  // Mouse-tracked gradient orb
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.4);
  const smx = useSpring(mx, { stiffness: 100, damping: 25 });
  const smy = useSpring(my, { stiffness: 100, damping: 25 });
  const orbX = useTransform(smx, (v) => `${v * 100}%`);
  const orbY = useTransform(smy, (v) => `${v * 100}%`);

  return (
    <section
      ref={ref}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - rect.left) / rect.width);
        my.set((e.clientY - rect.top) / rect.height);
      }}
      className="relative isolate overflow-hidden bg-slate-950 text-white"
    >
      {/* Background image with parallax */}
      <motion.div style={{ scale, y }} className="absolute inset-0">
        {school?.hero_image_url ? (
          <img src={school.hero_image_url} alt="" className="h-full w-full object-cover opacity-40" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-indigo-900 via-violet-900 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/60 to-slate-950" />
      </motion.div>

      {/* Mouse-follow orb */}
      <motion.div
        style={{ left: orbX, top: orbY }}
        className="pointer-events-none absolute h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-500/40 blur-[120px]"
      />

      {/* Static gradient orbs */}
      <div className="orb left-[-10%] top-[20%] h-[400px] w-[400px] bg-violet-500" />
      <div className="orb right-[-5%] bottom-[10%] h-[500px] w-[500px] bg-indigo-500" />

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid opacity-[0.03]" />

      <motion.div style={{ opacity }} className="relative mx-auto flex min-h-[88dvh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6 sm:py-28 lg:min-h-[100dvh] lg:px-8 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {school?.motto && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 backdrop-blur-md sm:px-4"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.15em] text-white/90 sm:text-[11px] sm:tracking-[0.18em]">
                {school.motto}
              </span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 max-w-5xl text-[36px] font-bold leading-[0.95] tracking-[-0.03em] sm:mt-6 sm:text-5xl md:text-6xl lg:text-7xl xl:text-[88px] xl:tracking-[-0.04em]"
          >
            {school?.school_name?.split(" ").slice(0, -1).join(" ") || "Our"}{" "}
            <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
              {school?.school_name?.split(" ").slice(-1)[0] || "School"}.
            </span>
          </motion.h1>

          {school?.tagline && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:mt-6 sm:text-base md:text-lg lg:text-xl"
            >
              {school.tagline}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center"
          >
            <MagneticButton
              as="a"
              href="#about"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-xl transition-all hover:shadow-2xl sm:px-6 sm:py-3.5"
            >
              <span className="relative z-10">Explore Our School</span>
              <svg className="relative z-10 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </MagneticButton>
            <MagneticButton
              as="a"
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/15 sm:px-6 sm:py-3.5"
            >
              Get in Touch
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.a
          href="#about"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute bottom-12 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/60 lg:flex"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="h-8 w-[1px] bg-gradient-to-b from-white/40 to-transparent"
          />
        </motion.a>
      </motion.div>

      {/* Stats marquee at bottom */}
      <div className="relative border-t border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {[
              { label: "Students", value: school?.total_students },
              { label: "Faculty", value: school?.total_teachers },
              { label: "Awards", value: school?.awards_count },
              { label: "Years", value: school?.founded_year ? new Date().getFullYear() - school.founded_year : null },
            ].map((s) => s.value && (
              <div key={s.label} className="text-center">
                <p className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl md:text-4xl">
                  <Counter to={s.value} />
                </p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-[10px] sm:tracking-[0.15em]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── ABOUT ──────────────────────────────────────────────── */
function About({ school }) {
  return (
    <section id="about" className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <p className="h-eyebrow text-indigo-600">About Us</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl xl:text-6xl">
            Where excellence meets opportunity
          </h2>
          {school?.about && (
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 sm:mt-6 sm:text-base lg:text-lg">
              {school.about}
            </p>
          )}
        </motion.div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {[
            {
              key: "mission",
              eyebrow: "Mission",
              title: "Empowering minds",
              body: school?.mission,
              gradient: "from-indigo-500 to-violet-600",
              icon: "M12 2.25l-8.954 8.955c-.44.439-.44 1.152 0 1.591L12 21.75l8.954-8.955c.44-.439.44-1.152 0-1.591L12 2.25z",
            },
            {
              key: "vision",
              eyebrow: "Vision",
              title: "Shaping futures",
              body: school?.vision,
              gradient: "from-emerald-500 to-teal-600",
              icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
            },
            {
              key: "history",
              eyebrow: "History",
              title: "Decades of legacy",
              body: school?.history,
              gradient: "from-amber-500 to-orange-600",
              icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
            },
          ]
            .filter((c) => c.body)
            .map((c, i) => (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 transition-shadow hover:shadow-2xl"
              >
                <div className={`pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${c.gradient} opacity-10 blur-3xl transition-opacity group-hover:opacity-20`} />
                <div className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${c.gradient} text-white shadow-lg`}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                  </svg>
                </div>
                <p className="h-eyebrow text-slate-400">{c.eyebrow}</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{c.body}</p>
              </motion.div>
            ))}
        </div>

        {/* Facilities marquee */}
        {school?.facilities?.length > 0 && (
          <motion.div {...fadeUp} className="mt-20">
            <p className="h-eyebrow text-center text-indigo-600">Facilities</p>
            <h3 className="mt-2 text-center text-2xl font-bold text-slate-900 sm:text-3xl">Everything you need to thrive</h3>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {school.facilities.map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.04 }}
                  whileHover={{ y: -3, scale: 1.02 }}
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ── PRINCIPAL ──────────────────────────────────────────── */
function Principal({ school, principal }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], [-30, 30]);

  if (!principal) return null;

  return (
    <section ref={ref} id="principal" className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 py-24 text-white lg:py-32">
      <div className="orb left-[-15%] top-1/3 h-[500px] w-[500px] bg-indigo-500 opacity-30" />
      <div className="orb right-[-10%] bottom-1/4 h-[400px] w-[400px] bg-violet-500 opacity-30" />
      <div className="absolute inset-0 bg-grid opacity-[0.04]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:col-span-5"
          >
            <motion.div style={{ y: imgY }} className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 to-violet-800 shadow-2xl">
              {principal.photo_url ? (
                <img src={principal.photo_url} alt={principal.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-8xl font-bold">{principal.name[0]}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </motion.div>

            {/* Floating credential card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="absolute -bottom-6 -right-2 max-w-[260px] rounded-2xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Principal</p>
              <p className="mt-1 text-base font-bold">{principal.name}</p>
              {principal.qualifications?.length > 0 && (
                <p className="mt-1 text-[11px] text-slate-300">{principal.qualifications[0]}</p>
              )}
              {principal.years_of_experience > 0 && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold">
                  {principal.years_of_experience}+ yrs experience
                </p>
              )}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <p className="h-eyebrow text-indigo-300">Leadership</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              A message from our principal
            </h2>
            <div className="relative mt-8">
              <svg className="absolute -left-4 -top-6 h-16 w-16 text-indigo-500/30" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="relative text-lg leading-relaxed text-slate-200 lg:text-xl">
                {school?.principal_message || principal.bio}
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
              <div className="h-12 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-violet-400" />
              <div>
                <p className="text-sm font-bold">{principal.name}</p>
                <p className="text-xs text-indigo-300">{principal.designation}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── FACULTY (bento + 3D-tilt) ──────────────────────────── */
function useTilt() {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 220, damping: 22 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 220, damping: 22 });

  const onMove = (e) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  return { ref, rx, ry, onMove, onLeave, x, y };
}

function FacultyCard({ s, large = false, role = null }) {
  const tilt = useTilt();
  const glareX = useTransform(tilt.x, [-0.5, 0.5], ["20%", "80%"]);
  const glareY = useTransform(tilt.y, [-0.5, 0.5], ["20%", "80%"]);
  return (
    <motion.div
      ref={tilt.ref}
      onMouseMove={tilt.onMove}
      onMouseLeave={tilt.onLeave}
      style={{ rotateX: tilt.rx, rotateY: tilt.ry, transformPerspective: 1200 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`group relative overflow-hidden rounded-3xl bg-slate-900 shadow-lg ring-1 ring-slate-200/60 ${large ? "h-full" : ""}`}
    >
      <div className={`relative w-full overflow-hidden ${large ? "aspect-[4/5] lg:aspect-auto lg:h-full" : "aspect-[4/5]"}`}>
        {s.photo_url ? (
          <motion.img
            src={s.photo_url}
            alt={s.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700"
            style={{ transformOrigin: "center" }}
            whileHover={{ scale: 1.06 }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 text-7xl font-bold text-white">
            {s.name?.[0]}
          </div>
        )}

        {/* Cursor-following glare */}
        <motion.div
          style={{ background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.18), transparent 50%)`, opacity: 0 }}
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 group-hover:opacity-100"
        />

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Role chip (top-left) */}
        {role && (
          <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-900 shadow-md backdrop-blur-sm">
            {role === "Principal" && <span className="text-amber-500">★</span>}
            {role}
          </div>
        )}

        {/* Experience badge (top-right) */}
        {s.years_of_experience > 0 && (
          <div className="absolute right-4 top-4 inline-flex flex-col items-center justify-center rounded-2xl bg-white/10 px-3 py-1.5 text-white backdrop-blur-md ring-1 ring-white/20">
            <span className="text-[18px] font-bold leading-none">{s.years_of_experience}+</span>
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-80">years</span>
          </div>
        )}

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className={`font-bold text-white ${large ? "text-2xl" : "text-lg"} leading-tight`}>{s.name}</p>
          <p className="mt-1 text-sm font-medium text-indigo-200">{s.designation}</p>
          {s.department && (
            <p className="mt-1 text-[11px] uppercase tracking-wider text-white/50">{s.department}</p>
          )}
          {s.qualifications?.length > 0 && large && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.qualifications.slice(0, 3).map((q) => (
                <span key={q} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                  {q}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Faculty({ data }) {
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All");

  const allStaff = useMemo(() => [
    ...(data.principal ? [data.principal] : []),
    ...(data.vice_principal ? [data.vice_principal] : []),
    ...data.department_heads,
    ...data.staff,
  ], [data]);

  const departments = useMemo(() => {
    const set = new Set(allStaff.map((s) => s.department).filter(Boolean));
    return ["All", ...Array.from(set)];
  }, [allStaff]);

  const filtered = useMemo(() => {
    let list = allStaff;
    if (activeDept !== "All") list = list.filter((s) => s.department === activeDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [allStaff, activeDept, search]);

  const showFeatured = !search.trim() && activeDept === "All";
  const departmentHeads = useMemo(
    () => filtered.filter((s) => s.is_department_head),
    [filtered]
  );
  const others = useMemo(
    () => filtered.filter((s) => !s.is_principal && !s.is_vice_principal && !s.is_department_head),
    [filtered]
  );

  return (
    <section id="staff" className="relative bg-slate-50 py-16 sm:py-24 lg:py-32">
      {/* Decorative bg */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <p className="h-eyebrow text-indigo-600">Our People</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl xl:text-6xl">
            Educators shaping minds, every single day
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:mt-5 sm:text-base lg:text-lg">
            A diverse community of {allStaff.length}+ dedicated professionals from {departments.length - 1} departments.
          </p>
        </motion.div>

        {/* Featured leadership row — Principal big, VP next */}
        {showFeatured && (data.principal || data.vice_principal) && (
          <motion.div {...fadeUp} className="mt-14">
            <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
              {data.principal && (
                <div className="lg:col-span-7">
                  <div className="aspect-[4/5] lg:aspect-[10/9]">
                    <FacultyCard s={data.principal} large role="Principal" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-5 lg:col-span-5 lg:grid-cols-1 lg:gap-6">
                {data.vice_principal && <FacultyCard s={data.vice_principal} role="Vice Principal" />}
                {departmentHeads[0] && <FacultyCard s={departmentHeads[0]} role={`Head of ${departmentHeads[0].department}`} />}
              </div>
            </div>
          </motion.div>
        )}

        {/* Search bar */}
        <motion.div {...fadeUp} className="mt-16">
          <div className="mx-auto max-w-3xl">
            <div className="relative">
              <svg className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, role, or department…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-4 pl-14 pr-5 text-sm shadow-sm transition-all focus:border-indigo-300 focus:shadow-md focus:ring-2 focus:ring-indigo-500/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
                  aria-label="Clear"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 no-scrollbar sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0 sm:pb-0">
              {departments.map((d) => (
                <button
                  key={d}
                  onClick={() => setActiveDept(d)}
                  className={`relative shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                    activeDept === d
                      ? "text-white"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {activeDept === d && (
                    <motion.span
                      layoutId="dept-pill"
                      className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative">{d}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Department heads grid (only when no search/filter active) */}
        {showFeatured && departmentHeads.length > 1 && (
          <div className="mt-14">
            <div className="mb-5 flex items-end justify-between">
              <h3 className="text-xl font-bold text-slate-900 sm:text-2xl">Department Heads</h3>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{departmentHeads.length - 1} more</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {departmentHeads.slice(1).map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                >
                  <FacultyCard s={s} role={`Head of ${s.department}`} />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All other staff or filtered results */}
        <div className="mt-14">
          {showFeatured && others.length > 0 && (
            <h3 className="mb-5 text-xl font-bold text-slate-900 sm:text-2xl">Faculty & Staff</h3>
          )}
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {(showFeatured ? others : filtered).map((s, i) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.45, delay: (i % 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  <FacultyCard s={s} role={s.is_principal ? "Principal" : s.is_vice_principal ? "Vice Principal" : s.is_department_head ? `Head of ${s.department}` : null} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="mt-12 text-center">
            <p className="text-base font-semibold text-slate-700">No faculty match "{search}"</p>
            <p className="mt-1 text-sm text-slate-500">Try a different name or department</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── ACHIEVEMENTS (kinetic marquee wall) ─────────────── */
const CATEGORY_GRADIENTS = {
  Academic: "from-blue-500 to-indigo-600",
  Sports: "from-emerald-500 to-teal-600",
  Cultural: "from-pink-500 to-fuchsia-600",
  Science: "from-cyan-500 to-sky-600",
  Award: "from-amber-500 to-orange-600",
  Other: "from-slate-500 to-slate-700",
};

function MarqueeChip({ a }) {
  const grad = CATEGORY_GRADIENTS[a.category] || CATEGORY_GRADIENTS.Award;
  const year = new Date(a.achieved_on).getFullYear();
  return (
    <div className="group/chip mx-3 inline-flex shrink-0 cursor-default items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 pr-5 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg sm:gap-4 sm:p-4 sm:pr-6">
      {/* Trophy badge */}
      <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${grad} text-2xl shadow-md ring-1 ring-white/40 transition-transform group-hover/chip:scale-110 sm:h-14 sm:w-14 sm:text-3xl`}>
        <div className="absolute inset-0 rounded-xl bg-white/0 transition-colors group-hover/chip:bg-white/10" />
        <span className="relative">{a.icon_url || "🏆"}</span>
      </div>
      {/* Text */}
      <div className="min-w-0 max-w-[260px] sm:max-w-[320px]">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]">
          <span className={`bg-gradient-to-r ${grad} bg-clip-text text-transparent`}>{a.category}</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span className="text-slate-500">{year}</span>
        </div>
        <p className="mt-1 truncate text-sm font-bold text-slate-900 sm:text-base">{a.title}</p>
        {a.awarded_by && (
          <p className="mt-0.5 truncate text-[11px] italic text-slate-500">— {a.awarded_by}</p>
        )}
      </div>
    </div>
  );
}

function Marquee({ items, duration = 40, reverse = false }) {
  // Duplicate items so the loop is seamless
  const doubled = [...items, ...items];
  return (
    <div className="group relative overflow-hidden">
      {/* Edge fade masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 to-transparent sm:w-24" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 to-transparent sm:w-24" />

      <motion.div
        className="flex w-max"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
        style={{ animationPlayState: "running" }}
      >
        <div
          className="flex shrink-0 items-center py-3 group-hover:[animation-play-state:paused]"
          style={{ animationPlayState: "running" }}
        >
          {doubled.map((a, i) => (
            <MarqueeChip key={`${a.id}-${i}`} a={a} />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function Achievements({ items }) {
  if (!items.length) return null;

  const cats = useMemo(() => [...new Set(items.map((a) => a.category))], [items]);
  const years = useMemo(() => [...new Set(items.map((a) => new Date(a.achieved_on).getFullYear()))].sort((a, b) => b - a), [items]);

  // Split items across rows for marquees
  const rows = useMemo(() => {
    if (items.length <= 3) return [items];
    const n = Math.min(3, Math.ceil(items.length / 3));
    const buckets = Array.from({ length: n }, () => []);
    items.forEach((a, i) => buckets[i % n].push(a));
    // Ensure each row has at least 4 items so the loop feels continuous
    return buckets.map((row) => (row.length < 4 ? [...row, ...row] : row));
  }, [items]);

  // Background floating chips (decorative)
  const bgChips = items.slice(0, 6);

  return (
    <section id="achievements" className="relative overflow-hidden bg-slate-50 py-16 sm:py-24 lg:py-32">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.06),transparent_50%)]" />

      {/* Floating decorative trophy emojis */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {bgChips.map((a, i) => (
          <motion.span
            key={`bg-${a.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.04, y: [0, -20, 0] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
            className="absolute select-none text-7xl sm:text-8xl"
            style={{
              top: `${10 + i * 14}%`,
              left: `${(i % 2 === 0 ? 5 : 85) + (i * 3) % 10}%`,
            }}
          >
            {a.icon_url || "🏆"}
          </motion.span>
        ))}
      </div>

      <div className="relative">
        {/* Header */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5">
              <svg className="h-3.5 w-3.5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
              <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700">Recognition</span>
            </span>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl xl:text-6xl">
              A wall of moments,
              <br />
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                always in motion.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:mt-5 sm:text-base lg:text-lg">
              Every trophy tells a story. Hover any row to pause and read.
            </p>
          </motion.div>

          {/* Stat strip */}
          <motion.div
            {...fadeUp}
            className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-4"
          >
            {[
              { value: items.length, label: "Awards", grad: "from-amber-500 to-orange-600" },
              { value: cats.length, label: "Categories", grad: "from-rose-500 to-pink-600" },
              { value: years.length, label: "Years", grad: "from-indigo-500 to-violet-600" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className={`bg-gradient-to-br ${s.grad} bg-clip-text text-4xl font-bold text-transparent sm:text-5xl`}>
                  <Counter to={s.value} />
                </p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Marquee rows — full bleed */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mt-14 space-y-3 sm:mt-16 sm:space-y-4"
        >
          {rows.map((row, i) => (
            <Marquee key={i} items={row} duration={36 + i * 8} reverse={i % 2 === 1} />
          ))}
        </motion.div>

        {/* Category legend */}
        <div className="mx-auto mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Categories:</span>
            {cats.map((c) => (
              <div
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm"
              >
                <span className={`h-2 w-2 rounded-full bg-gradient-to-br ${CATEGORY_GRADIENTS[c] || CATEGORY_GRADIENTS.Award}`} />
                <span className="text-[11px] font-semibold text-slate-700">{c}</span>
                <span className="text-[10px] text-slate-400">{items.filter((a) => a.category === c).length}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── GALLERY ───────────────────────────────────────────── */
function Gallery({ items }) {
  const [activeCat, setActiveCat] = useState("All");
  const cats = useMemo(() => ["All", ...new Set(items.map((g) => g.category))], [items]);
  const filtered = activeCat === "All" ? items : items.filter((g) => g.category === activeCat);

  if (!items.length) return null;

  return (
    <section id="gallery" className="relative bg-slate-950 py-24 text-white lg:py-32">
      <div className="orb left-[5%] top-[20%] h-[400px] w-[400px] bg-indigo-500 opacity-20" />
      <div className="orb right-[5%] bottom-[10%] h-[400px] w-[400px] bg-violet-500 opacity-20" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <p className="h-eyebrow text-indigo-300">Moments</p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            Life at our campus
          </h2>
        </motion.div>

        <motion.div {...fadeUp} className="mt-10 flex flex-wrap justify-center gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`relative rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold transition-all ${
                activeCat === c ? "text-slate-900" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              {activeCat === c && (
                <motion.span
                  layoutId="gal-pill"
                  className="absolute inset-0 rounded-full bg-white shadow-md"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative">{c}</span>
            </button>
          ))}
        </motion.div>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((g, i) => {
              // Vary aspect ratios for a more dynamic masonry feel
              const aspect = i % 5 === 0 ? "aspect-[3/4]" : i % 4 === 0 ? "aspect-[4/3]" : "aspect-square";
              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.5, delay: (i % 8) * 0.04 }}
                  whileHover={{ y: -4 }}
                  className={`group relative overflow-hidden rounded-2xl bg-slate-800 ${aspect}`}
                >
                  <motion.img
                    src={g.image_url}
                    alt={g.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.7 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 translate-y-4 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    <p className="text-sm font-bold text-white">{g.title}</p>
                    {g.caption && <p className="mt-0.5 text-[11px] text-white/80 line-clamp-1">{g.caption}</p>}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── NEWS & EVENTS (magazine editorial) ────────────────── */
const CATEGORY_COLORS = {
  General: "from-slate-500 to-slate-700",
  Academic: "from-sky-500 to-blue-600",
  Exam: "from-violet-500 to-purple-600",
  Fee: "from-amber-500 to-orange-600",
  Holiday: "from-emerald-500 to-teal-600",
  Event: "from-pink-500 to-rose-600",
  Emergency: "from-rose-500 to-red-600",
};

function FeaturedStory({ notice }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_COLORS[notice.category] || "from-indigo-700 to-violet-800"}`} />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "32px 32px",
      }} />
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-black/20 blur-3xl" />

      <div className="relative p-8 sm:p-10 lg:p-12">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-900">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
            </span>
            Featured
          </span>
          {notice.is_pinned && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
              📌 Pinned
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
            {notice.category}
          </span>
        </div>

        <h3 className="mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          {notice.title}
        </h3>
        <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
          {notice.content.length > 240 ? notice.content.slice(0, 240) + "…" : notice.content}
        </p>

        <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Published</p>
              <p className="text-sm font-semibold">{fmtDate(notice.created_at)}</p>
            </div>
          </div>
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="inline-flex items-center gap-1.5 text-sm font-bold"
          >
            Read more
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.article>
  );
}

function NoticeCard({ n, index }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className="group relative flex gap-4 overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-lg"
    >
      {/* Side accent bar */}
      <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${CATEGORY_COLORS[n.category] || "from-indigo-500 to-violet-600"}`} />

      <div className="flex-1 pl-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {n.is_pinned && <span className="chip bg-amber-100 text-amber-700">📌</span>}
          <span className={`chip bg-gradient-to-r ${CATEGORY_COLORS[n.category] || "from-indigo-500 to-violet-600"} text-white`}>
            {n.category}
          </span>
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {fmtDate(n.created_at)}
          </span>
        </div>
        <h4 className="mt-2 text-base font-bold leading-tight text-slate-900 transition-colors group-hover:text-indigo-700">
          {n.title}
        </h4>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{n.content}</p>
      </div>
    </motion.article>
  );
}

function EventCard({ e, index }) {
  const date = new Date(e.start_date);
  const isToday = new Date().toDateString() === date.toDateString();
  const daysUntil = Math.ceil((date - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-xl"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-200/30 blur-2xl transition-opacity duration-500 group-hover:opacity-60" />

      <div className="relative flex items-start gap-4">
        {/* Date block */}
        <div className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
            {date.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="text-3xl font-bold leading-none">{date.getDate()}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">
            {date.toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="chip bg-emerald-100 text-emerald-700">{e.event_type}</span>
            {isToday && <span className="chip bg-rose-100 text-rose-700">Today</span>}
            {!isToday && daysUntil > 0 && daysUntil <= 7 && (
              <span className="chip bg-amber-100 text-amber-700">In {daysUntil}d</span>
            )}
          </div>
          <p className="mt-2 text-base font-bold leading-tight text-slate-900">{e.title}</p>
          {e.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{e.description}</p>}
          {e.end_date && new Date(e.end_date).toDateString() !== date.toDateString() && (
            <p className="mt-2 text-[11px] font-semibold text-slate-400">
              Until {fmtDate(e.end_date)}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function NewsSection({ notices, events }) {
  if (!notices.length && !events.length) return null;

  const featured = notices.find((n) => n.is_pinned) || notices[0];
  const restNotices = notices.filter((n) => n.id !== featured?.id).slice(0, 4);

  return (
    <section id="news" className="relative overflow-hidden bg-white py-16 sm:py-24 lg:py-32">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(99,102,241,0.06),transparent_60%)]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header — magazine style */}
        <motion.div {...fadeUp} className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="h-eyebrow text-indigo-600">News Desk</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl xl:text-6xl">
              The Daily Bulletin
            </h2>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Stay informed with the latest from our campus — announcements, events, and stories.
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Live updates</span>
          </div>
        </motion.div>

        {/* Editorial layout */}
        <div className="mt-12 grid gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Featured story (left col, large) */}
          {featured && (
            <div className="lg:col-span-7">
              <FeaturedStory notice={featured} />
            </div>
          )}

          {/* Side rail (right col) */}
          <div className="lg:col-span-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">More Notices</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {notices.length} total
              </span>
            </div>
            <div className="space-y-3">
              {restNotices.map((n, i) => <NoticeCard key={n.id} n={n} index={i} />)}
            </div>
          </div>
        </div>

        {/* Events ticker */}
        {events.length > 0 && (
          <div className="mt-20">
            <motion.div {...fadeUp} className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
                  </svg>
                </div>
                <div>
                  <p className="h-eyebrow text-emerald-600">Mark Your Calendar</p>
                  <h3 className="text-2xl font-bold text-slate-900 sm:text-3xl">Upcoming Events</h3>
                </div>
              </div>
              <span className="hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 sm:inline">
                Next {events.length}
              </span>
            </motion.div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((e, i) => <EventCard key={e.id} e={e} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── CONTACT (split layout + bento + map) ──────────────── */
function Contact({ school }) {
  const contacts = [
    {
      label: "Visit Campus",
      value: school?.address,
      sub: "Walk-ins welcome Sun–Thu",
      icon: "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
      gradient: "from-rose-500 to-pink-600",
      glow: "shadow-rose-500/30",
    },
    {
      label: "Call Anytime",
      value: school?.phone,
      sub: "9:00 AM – 5:00 PM",
      icon: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
      gradient: "from-emerald-500 to-teal-600",
      glow: "shadow-emerald-500/30",
    },
    {
      label: "Email Us",
      value: school?.email,
      sub: "We reply within 24h",
      icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
      gradient: "from-indigo-500 to-violet-600",
      glow: "shadow-indigo-500/30",
    },
  ].filter((c) => c.value);

  return (
    <section id="contact" className="relative overflow-hidden bg-slate-950 py-24 text-white lg:py-32">
      {/* Animated orbs */}
      <div className="orb left-[-10%] top-[20%] h-[500px] w-[500px] bg-indigo-600 opacity-30" />
      <div className="orb right-[-5%] bottom-[10%] h-[400px] w-[400px] bg-violet-600 opacity-30" />
      <div className="absolute inset-0 bg-grid opacity-[0.03]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="grid items-end gap-8 lg:grid-cols-12">
          <motion.div {...fadeUp} className="lg:col-span-7">
            <p className="h-eyebrow text-indigo-300">Let's Connect</p>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
              Start a conversation
              <span className="block bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent">
                with our team.
              </span>
            </h2>
          </motion.div>
          <motion.p
            {...fadeUp}
            className="text-base text-slate-300 sm:text-lg lg:col-span-5"
          >
            Whether you're a prospective parent, current student, or curious community member — we're here to help. Reach out anytime.
          </motion.p>
        </div>

        {/* Bento grid: contacts + map */}
        <div className="mt-12 grid gap-4 lg:grid-cols-12 lg:gap-5">
          {/* Map — large featured */}
          {school?.map_embed_url ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/10 lg:col-span-7 lg:aspect-auto"
            >
              <iframe
                src={school.map_embed_url}
                title="School Location"
                className="absolute inset-0 h-full w-full border-0 grayscale-[40%] transition-all duration-500 group-hover:grayscale-0"
                loading="lazy"
              />
              {/* Floating address card */}
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute bottom-4 left-4 max-w-xs rounded-2xl border border-white/15 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Find Us Here</p>
                    <p className="mt-1 text-sm font-semibold text-white">{school?.school_name}</p>
                    {school?.address && (
                      <p className="mt-0.5 text-[11px] text-slate-300">{school.address}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <div className="hidden lg:col-span-7 lg:block" />
          )}

          {/* Contact methods — stacked right column */}
          <div className="grid gap-4 lg:col-span-5">
            {contacts.map((c, i) => (
              <motion.a
                key={c.label}
                href={c.label.includes("Call") ? `tel:${c.value}` : c.label.includes("Email") ? `mailto:${c.value}` : "#"}
                initial={{ opacity: 0, x: 32 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ x: -4 }}
                className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.08]"
              >
                <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${c.gradient} opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60`} />

                {/* Icon */}
                <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${c.gradient} text-white shadow-lg ${c.glow}`}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.icon} />
                  </svg>
                </div>

                <div className="relative min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">{c.label}</p>
                  <p className="mt-1 truncate text-base font-semibold text-white">{c.value}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{c.sub}</p>
                </div>

                {/* Arrow */}
                <motion.svg
                  className="relative h-5 w-5 shrink-0 text-slate-500 transition-colors group-hover:text-white"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </motion.svg>
              </motion.a>
            ))}

            {/* Office hours card */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600 to-violet-700 p-5 shadow-xl"
            >
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-md">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-200">Office Hours</p>
                  <p className="mt-1 text-base font-bold text-white">
                    {school?.class_start_time || "08:00"} – {school?.class_end_time || "16:00"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-indigo-200">
                    Sunday to Thursday · Closed Friday & Saturday
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-3">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-semibold text-white">Currently open</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA strip */}
        <motion.div
          {...fadeUp}
          className="mt-16 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-8 backdrop-blur-md sm:p-12"
        >
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to join our community?
              </h3>
              <p className="mt-2 text-sm text-slate-300 sm:text-base">
                Schedule a campus tour or admissions meeting. We'd love to show you around.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <MagneticButton
                as="a"
                href={school?.phone ? `tel:${school.phone}` : "#"}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-xl transition-all hover:shadow-2xl"
              >
                Schedule a Visit
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </MagneticButton>
              <MagneticButton
                as={Link}
                to="/register"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/15"
              >
                Apply Online
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ── FOOTER ────────────────────────────────────────────── */
function Footer({ school }) {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-slate-400">
      <div className="orb left-[-10%] top-1/2 h-[400px] w-[400px] bg-indigo-600 opacity-10" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/school" className="inline-flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-extrabold text-white shadow-lg">E</div>
              <div>
                <p className="text-lg font-bold text-white">{school?.school_name}</p>
                {school?.tagline && <p className="text-xs">{school.tagline}</p>}
              </div>
            </Link>
            {school?.about && (
              <p className="mt-5 max-w-md text-sm leading-relaxed">
                {school.about.slice(0, 200)}{school.about.length > 200 ? "…" : ""}
              </p>
            )}
            {(school?.facebook_url || school?.twitter_url || school?.youtube_url) && (
              <div className="mt-6 flex gap-3">
                {school.facebook_url && (
                  <a href={school.facebook_url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-base transition-all hover:bg-white/10 hover:scale-110" aria-label="Facebook">𝕗</a>
                )}
                {school.twitter_url && (
                  <a href={school.twitter_url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-base transition-all hover:bg-white/10 hover:scale-110" aria-label="Twitter">𝕏</a>
                )}
                {school.youtube_url && (
                  <a href={school.youtube_url} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-base transition-all hover:bg-white/10 hover:scale-110" aria-label="YouTube">▶</a>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            <p className="text-sm font-bold uppercase tracking-wider text-white">Explore</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="transition-colors hover:text-white">{s.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="text-sm font-bold uppercase tracking-wider text-white">Contact</p>
            <ul className="mt-5 space-y-2.5 text-sm">
              {school?.address && <li className="flex gap-2"><span>📍</span><span>{school.address}</span></li>}
              {school?.phone && <li className="flex gap-2"><span>📞</span><span>{school.phone}</span></li>}
              {school?.email && <li className="flex gap-2"><span>✉️</span><span>{school.email}</span></li>}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link to="/" className="rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 transition-all hover:scale-105">
                Sign In
              </Link>
              <Link to="/register" className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/10">
                Register
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/5 pt-6 text-center text-xs">
          © {new Date().getFullYear()} {school?.school_name || "EduPortal"} · All rights reserved
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────
 *  Main page
 * ────────────────────────────────────────────────────────── */
export default function PublicSchoolPage() {
  const [data, setData] = useState(null);
  const [news, setNews] = useState({ notices: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    Promise.all([publicApi.school(), publicApi.news()])
      .then(([s, n]) => { setData(s.data); setNews(n.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Observe sections to highlight active nav link
  useEffect(() => {
    if (!data) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-400"
        />
      </div>
    );
  }

  if (!data) return null;
  const school = data.school || {};

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <ScrollProgress />
      <Navbar school={school} activeSection={activeSection} />
      <Hero school={school} />
      <About school={school} />
      <Principal school={school} principal={data.principal} />
      <Faculty data={data} />
      <Achievements items={data.achievements} />
      <Gallery items={data.gallery} />
      <NewsSection notices={news.notices} events={news.events} />
      <Contact school={school} />
      <Footer school={school} />
    </div>
  );
}
