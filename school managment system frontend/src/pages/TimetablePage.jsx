import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { PageLoader } from "../components/Skeleton";
import { StaggerList, Item, motion, AnimatePresence } from "../components/Motion";
import { timetableApi } from "../api";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu"];

const PALETTES = [
  { bg: "from-sky-500 to-blue-600", soft: "bg-sky-50 text-sky-900 border-sky-200" },
  { bg: "from-violet-500 to-purple-600", soft: "bg-violet-50 text-violet-900 border-violet-200" },
  { bg: "from-emerald-500 to-teal-600", soft: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  { bg: "from-amber-500 to-orange-600", soft: "bg-amber-50 text-amber-900 border-amber-200" },
  { bg: "from-pink-500 to-rose-600", soft: "bg-pink-50 text-pink-900 border-pink-200" },
  { bg: "from-indigo-500 to-indigo-700", soft: "bg-indigo-50 text-indigo-900 border-indigo-200" },
  { bg: "from-rose-500 to-red-600", soft: "bg-rose-50 text-rose-900 border-rose-200" },
];

function paletteFor(label) {
  if (!label) return { bg: "from-slate-400 to-slate-500", soft: "bg-slate-50 text-slate-700 border-slate-200" };
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = (hash << 5) - hash + label.charCodeAt(i);
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function todayDayIdx() {
  // 0=Sun … 6=Sat. We only show Sun(0)…Thu(4).
  const d = new Date().getDay();
  return d <= 4 ? d : 0;
}

export default function TimetablePage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeDay, setActiveDay] = useState(todayDayIdx());

  const isTeacher = user?.role === "teacher";

  async function load() {
    try {
      setLoading(true);
      const r = isTeacher ? await timetableApi.mySchedule() : await timetableApi.list();
      setSlots(r.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.role]);

  const { grid, periods, periodTimes } = useMemo(() => {
    const g = {};
    const periodSet = new Set();
    const times = {};
    slots.forEach((s) => {
      if (s.is_break) return;
      if (!g[s.day_of_week]) g[s.day_of_week] = {};
      g[s.day_of_week][s.period_number] = s;
      periodSet.add(s.period_number);
      times[s.period_number] = `${s.start_time}–${s.end_time}`;
    });
    return {
      grid: g,
      periods: Array.from(periodSet).sort((a, b) => a - b),
      periodTimes: times,
    };
  }, [slots]);

  const daySlots = useMemo(() => {
    const list = periods.map((p) => ({ period: p, time: periodTimes[p], slot: grid[activeDay]?.[p] }));
    return list;
  }, [activeDay, periods, periodTimes, grid]);

  const todayCount = daySlots.filter((d) => d.slot).length;
  const isToday = activeDay === todayDayIdx();

  return (
    <Sidebar title="Schedule">
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-4 sm:py-6 lg:px-8">
        <PageHeader
          hero
          gradient={isTeacher ? "from-violet-500 to-purple-600" : "from-sky-500 to-blue-600"}
          title={isTeacher ? "My Teaching Schedule" : "Class Timetable"}
          subtitle={
            isTeacher
              ? "All your classes through the week"
              : user?.class_level
              ? `Class ${user.class_level}-${user.section} · Weekly schedule`
              : "Weekly schedule"
          }
        />

        {loading ? (
          <PageLoader />
        ) : slots.length === 0 ? (
          <EmptyState
            title="No timetable yet"
            description="Please contact your admin to set up the schedule."
          />
        ) : (
          <>
            {/* ── Mobile / Tablet: Day-tab + card list ──────────────── */}
            <div className="lg:hidden">
              {/* Day tabs — horizontally scrollable pills */}
              <div className="surface -mx-1 mb-3 flex gap-1.5 overflow-x-auto p-1.5 no-scrollbar sm:mx-0 sm:gap-2 sm:p-2">
                {DAYS.map((day, i) => {
                  const active = activeDay === i;
                  const isCurrent = i === todayDayIdx();
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveDay(i)}
                      className={`relative flex shrink-0 flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition-all sm:flex-1 ${
                        active
                          ? "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`text-[10px] uppercase tracking-wider ${active ? "text-sky-100" : "text-slate-400"}`}>
                        {SHORT_DAYS[i]}
                      </span>
                      <span className="mt-0.5 text-sm font-bold">{day.slice(0, 3)}</span>
                      {isCurrent && !active && (
                        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Day summary */}
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-sm font-bold text-slate-900">
                  {DAYS[activeDay]} {isToday && <span className="ml-1.5 chip bg-emerald-100 text-emerald-700">Today</span>}
                </p>
                <p className="text-xs text-slate-500">{todayCount} periods</p>
              </div>

              {/* Period cards */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDay}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                  {todayCount === 0 ? (
                    <EmptyState title={`No classes on ${DAYS[activeDay]}`} description="Looks like a free day!" />
                  ) : (
                    <StaggerList className="space-y-2.5">
                      {daySlots.map(({ period, time, slot }) => {
                        if (!slot) {
                          return (
                            <Item key={period}>
                              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 px-4 py-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-400">
                                  {period}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-slate-400">Free</p>
                                  <p className="text-[11px] text-slate-400">{time}</p>
                                </div>
                              </div>
                            </Item>
                          );
                        }
                        const label = isTeacher ? `Class ${slot.class_level}-${slot.section}` : slot.subject_label;
                        const sub = isTeacher ? slot.subject_label : slot.teacher_name;
                        const palette = paletteFor(label);
                        return (
                          <Item key={period}>
                            <div className="surface surface-hover relative flex items-center gap-3 overflow-hidden p-3 sm:p-4">
                              {/* Period badge with gradient */}
                              <div className={`flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-gradient-to-br ${palette.bg} text-white shadow-md`}>
                                <span className="text-[9px] font-semibold uppercase tracking-wider opacity-80">P</span>
                                <span className="-mt-0.5 text-base font-bold leading-none">{period}</span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">{label || "—"}</p>
                                    {sub && <p className="truncate text-[11px] text-slate-500">{sub}</p>}
                                  </div>
                                  {slot.room_number && (
                                    <span className="chip shrink-0 bg-slate-100 text-slate-700">
                                      🚪 {slot.room_number}
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="font-medium tabular-nums">{time}</span>
                                </div>
                              </div>
                            </div>
                          </Item>
                        );
                      })}
                    </StaggerList>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── Desktop: classic grid ────────────────────────────── */}
            <div className="surface hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead className="bg-slate-50/70">
                  <tr>
                    <th className="px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600">Day</th>
                    {periods.map((p) => (
                      <th key={p} className="px-3 py-3 text-center font-bold text-slate-700">
                        <div className="text-xs">Period {p}</div>
                        <div className="text-[10px] font-medium text-slate-500">{periodTimes[p]}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DAYS.map((dayName, dayIdx) => (
                    <tr key={dayIdx} className={dayIdx === todayDayIdx() ? "bg-sky-50/30" : ""}>
                      <td className="px-3 py-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{dayName}</span>
                          {dayIdx === todayDayIdx() && (
                            <span className="chip bg-emerald-100 text-emerald-700">Today</span>
                          )}
                        </div>
                      </td>
                      {periods.map((p) => {
                        const slot = grid[dayIdx]?.[p];
                        if (!slot) {
                          return (
                            <td key={p} className="px-2 py-2 text-center text-xs text-slate-300">—</td>
                          );
                        }
                        const label = isTeacher ? `Class ${slot.class_level}-${slot.section}` : slot.subject_label;
                        const sub = isTeacher ? slot.subject_label : slot.teacher_name;
                        const palette = paletteFor(label);
                        return (
                          <td key={p} className="px-2 py-2">
                            <div className={`rounded-xl border p-2 text-xs transition-all hover:shadow-md ${palette.soft}`}>
                              <div className="truncate font-bold">{label || "—"}</div>
                              {sub && <div className="truncate text-[10px] opacity-80">{sub}</div>}
                              {slot.room_number && (
                                <div className="mt-0.5 text-[10px] opacity-70">🚪 {slot.room_number}</div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <p className="px-1 text-[11px] text-slate-500">
          Working days: Sunday – Thursday. Tiffin break between Period 3 and Period 4.
        </p>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}
