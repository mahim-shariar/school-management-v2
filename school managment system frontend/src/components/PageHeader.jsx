/**
 * Consistent page header with title, subtitle, and action slot.
 * Optional gradient hero variant for dashboards.
 */
export default function PageHeader({ title, subtitle, action, hero = false, gradient = "from-indigo-500 to-indigo-700", icon = null }) {
  if (hero) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} px-5 py-5 text-white shadow-soft sm:px-6 sm:py-6`}>
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight sm:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-xs text-white/80 sm:text-sm">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {icon && (
          <div className="pointer-events-none absolute -right-6 -top-6 text-white/10">
            {icon}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
