import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { schoolSettingsApi } from "../api";

export default function AdminSchoolSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const r = await schoolSettingsApi.get();
      setSettings(r.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...settings };
      delete payload.id;
      const r = await schoolSettingsApi.update(payload);
      setSettings(r.data);
      setToast({ type: "success", message: "Settings saved." });
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <Sidebar>
        <div className="p-8 text-center text-slate-500">Loading…</div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">School Settings</h1>
        <p className="mb-6 text-sm text-slate-500">Configure your school's profile and academic year</p>

        <form onSubmit={save} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <SettingField label="School Name" value={settings.school_name} onChange={(v) => setSettings({ ...settings, school_name: v })} />
          <SettingField label="School Code" value={settings.school_code} onChange={(v) => setSettings({ ...settings, school_code: v })} />
          <SettingField label="Address" value={settings.address} onChange={(v) => setSettings({ ...settings, address: v })} textarea />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SettingField label="Phone" value={settings.phone} onChange={(v) => setSettings({ ...settings, phone: v })} />
            <SettingField label="Email" value={settings.email} onChange={(v) => setSettings({ ...settings, email: v })} />
            <SettingField label="Website" value={settings.website} onChange={(v) => setSettings({ ...settings, website: v })} />
            <SettingField label="Country" value={settings.country} onChange={(v) => setSettings({ ...settings, country: v })} />
            <SettingField label="Academic Year" value={settings.current_academic_year} onChange={(v) => setSettings({ ...settings, current_academic_year: v })} />
            <SettingField label="Currency Symbol" value={settings.currency} onChange={(v) => setSettings({ ...settings, currency: v })} />
            <SettingField label="Class Start Time" value={settings.class_start_time} onChange={(v) => setSettings({ ...settings, class_start_time: v })} />
            <SettingField label="Class End Time" value={settings.class_end_time} onChange={(v) => setSettings({ ...settings, class_end_time: v })} />
            <SettingField label="Periods Per Day" type="number" value={settings.periods_per_day} onChange={(v) => setSettings({ ...settings, periods_per_day: Number(v) })} />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}

function SettingField({ label, value, onChange, type = "text", textarea = false }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {textarea ? (
        <textarea
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          rows={2}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={type}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
