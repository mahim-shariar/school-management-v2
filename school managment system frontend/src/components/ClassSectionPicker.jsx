import { CLASS_LEVELS, SECTIONS_LIST } from "../constants";

export function ClassLevelSelect({ value, onChange, className = "", required = false, disabled = false, label = "Class" }) {
  return (
    <select
      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
      required={required}
      disabled={disabled}
    >
      <option value="">— {label} —</option>
      {CLASS_LEVELS.map((c) => (
        <option key={c} value={c}>Class {c}</option>
      ))}
    </select>
  );
}

export function SectionSelect({ value, onChange, className = "", required = false, disabled = false, allowAll = false, label = "Section" }) {
  return (
    <select
      className={`rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
    >
      <option value="">— {allowAll ? "All Sections" : label} —</option>
      {SECTIONS_LIST.map((s) => (
        <option key={s} value={s}>Section {s}</option>
      ))}
    </select>
  );
}

export default function ClassSectionPicker({
  classLevel,
  section,
  onClassChange,
  onSectionChange,
  className = "",
  allowAllSections = false,
  required = false,
  disabled = false,
}) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <ClassLevelSelect value={classLevel} onChange={onClassChange} required={required} disabled={disabled} />
      <SectionSelect
        value={section}
        onChange={onSectionChange}
        required={required}
        disabled={disabled}
        allowAll={allowAllSections}
      />
    </div>
  );
}
