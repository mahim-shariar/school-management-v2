import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Toast from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { authApi, transportApi } from "../api";

export default function TransportPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [tab, setTab] = useState(isAdmin ? "routes" : "my");
  const [routes, setRoutes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [myTransport, setMyTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [showRouteForm, setShowRouteForm] = useState(false);
  const [routeForm, setRouteForm] = useState({
    route_name: "",
    vehicle_number: "",
    driver_name: "",
    driver_phone: "",
    capacity: 30,
    stops: [{ stop_name: "", pickup_time: "", drop_time: "", fare: 0 }],
  });

  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ student_id: "", route_id: "", stop_name: "" });

  async function load() {
    try {
      setLoading(true);
      if (isAdmin) {
        const [routesR, assignR, studR] = await Promise.all([
          transportApi.routes(),
          transportApi.assignments(),
          authApi.users({ role: "student" }),
        ]);
        setRoutes(routesR.data);
        setAssignments(assignR.data);
        setStudents(studR.data);
      } else if (user?.role === "student") {
        const r = await transportApi.my();
        setMyTransport(r.data);
      }
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user?.role]);

  async function createRoute(e) {
    e.preventDefault();
    try {
      await transportApi.createRoute(routeForm);
      setToast({ type: "success", message: "Route created." });
      setShowRouteForm(false);
      setRouteForm({ route_name: "", vehicle_number: "", driver_name: "", driver_phone: "", capacity: 30, stops: [{ stop_name: "", pickup_time: "", drop_time: "", fare: 0 }] });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function removeRoute(id) {
    if (!window.confirm("Delete this route?")) return;
    try {
      await transportApi.removeRoute(id);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function assign(e) {
    e.preventDefault();
    try {
      await transportApi.assign(assignForm);
      setToast({ type: "success", message: "Student assigned." });
      setShowAssignForm(false);
      setAssignForm({ student_id: "", route_id: "", stop_name: "" });
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  async function unassign(id) {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await transportApi.unassign(id);
      load();
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed." });
    }
  }

  function addStop() {
    setRouteForm({ ...routeForm, stops: [...routeForm.stops, { stop_name: "", pickup_time: "", drop_time: "", fare: 0 }] });
  }

  function updateStop(idx, field, value) {
    const stops = [...routeForm.stops];
    stops[idx] = { ...stops[idx], [field]: value };
    setRouteForm({ ...routeForm, stops });
  }

  function removeStop(idx) {
    setRouteForm({ ...routeForm, stops: routeForm.stops.filter((_, i) => i !== idx) });
  }

  return (
    <Sidebar>
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Transport Management</h1>
        <p className="mb-6 text-sm text-slate-500">
          {isAdmin ? "Manage routes and student assignments" : "Your transport details"}
        </p>

        {isAdmin && (
          <div className="mb-4 flex gap-2 border-b border-slate-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${tab === "routes" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}
              onClick={() => setTab("routes")}
            >
              Routes ({routes.length})
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${tab === "assignments" ? "border-b-2 border-indigo-600 text-indigo-700" : "text-slate-500"}`}
              onClick={() => setTab("assignments")}
            >
              Student Assignments ({assignments.length})
            </button>
          </div>
        )}

        {!isAdmin && user?.role === "student" && (
          <>
            {loading ? (
              <p className="text-center text-slate-500">Loading…</p>
            ) : !myTransport ? (
              <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                You are not assigned to any transport route. Please contact the office.
              </p>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="mb-3 text-lg font-semibold text-slate-900">{myTransport.route_name}</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Vehicle</p>
                    <p className="font-medium">{myTransport.route_details?.vehicle_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Driver</p>
                    <p className="font-medium">{myTransport.route_details?.driver_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Driver Phone</p>
                    <p className="font-medium">{myTransport.route_details?.driver_phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Your Stop</p>
                    <p className="font-medium text-indigo-700">{myTransport.stop_name}</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-medium uppercase text-slate-500">All Stops</p>
                  <div className="space-y-1">
                    {myTransport.route_details?.stops?.map((s, i) => (
                      <div key={i} className={`flex items-center justify-between rounded p-2 text-sm ${s.stop_name === myTransport.stop_name ? "bg-indigo-50" : ""}`}>
                        <span className="font-medium">{s.stop_name}</span>
                        <span className="text-xs text-slate-600">
                          Pickup: {s.pickup_time} · Drop: {s.drop_time} · ৳{s.fare}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {isAdmin && tab === "routes" && (
          <>
            <div className="mb-4 flex justify-end">
              <button onClick={() => setShowRouteForm((s) => !s)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                {showRouteForm ? "Cancel" : "+ Add Route"}
              </button>
            </div>

            {showRouteForm && (
              <form onSubmit={createRoute} className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Route name" required value={routeForm.route_name} onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })} />
                  <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Vehicle number" value={routeForm.vehicle_number} onChange={(e) => setRouteForm({ ...routeForm, vehicle_number: e.target.value })} />
                  <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Driver name" value={routeForm.driver_name} onChange={(e) => setRouteForm({ ...routeForm, driver_name: e.target.value })} />
                  <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Driver phone" value={routeForm.driver_phone} onChange={(e) => setRouteForm({ ...routeForm, driver_phone: e.target.value })} />
                  <input type="number" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Capacity" value={routeForm.capacity} onChange={(e) => setRouteForm({ ...routeForm, capacity: Number(e.target.value) })} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">Stops</p>
                  {routeForm.stops.map((s, i) => (
                    <div key={i} className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-5">
                      <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm md:col-span-2" placeholder="Stop name" value={s.stop_name} onChange={(e) => updateStop(i, "stop_name", e.target.value)} />
                      <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Pickup HH:MM" value={s.pickup_time} onChange={(e) => updateStop(i, "pickup_time", e.target.value)} />
                      <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Drop HH:MM" value={s.drop_time} onChange={(e) => updateStop(i, "drop_time", e.target.value)} />
                      <div className="flex gap-2">
                        <input type="number" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Fare" value={s.fare} onChange={(e) => updateStop(i, "fare", Number(e.target.value))} />
                        <button type="button" onClick={() => removeStop(i)} className="rounded bg-rose-100 px-2 text-xs text-rose-700">×</button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addStop} className="rounded-lg bg-slate-100 px-3 py-1 text-xs">+ Add stop</button>
                </div>
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Create Route</button>
              </form>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {routes.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{r.route_name}</h3>
                      <p className="text-xs text-slate-500">{r.vehicle_number}</p>
                    </div>
                    <button onClick={() => removeRoute(r.id)} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">Driver:</span> {r.driver_name} ({r.driver_phone})</p>
                    <p><span className="text-slate-500">Capacity:</span> {r.capacity}</p>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-2">
                    <p className="mb-1 text-xs font-medium uppercase text-slate-500">Stops</p>
                    {r.stops.map((s, i) => (
                      <div key={i} className="flex justify-between text-xs text-slate-600">
                        <span>{s.stop_name}</span>
                        <span>{s.pickup_time} · ৳{s.fare}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {isAdmin && tab === "assignments" && (
          <>
            <div className="mb-4 flex justify-end">
              <button onClick={() => setShowAssignForm((s) => !s)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                {showAssignForm ? "Cancel" : "+ Assign Student"}
              </button>
            </div>

            {showAssignForm && (
              <form onSubmit={assign} className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-5 md:grid-cols-3">
                <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required value={assignForm.student_id} onChange={(e) => setAssignForm({ ...assignForm, student_id: e.target.value })}>
                  <option value="">— Student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name} (Class {s.class_level}-{s.section})</option>
                  ))}
                </select>
                <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" required value={assignForm.route_id} onChange={(e) => setAssignForm({ ...assignForm, route_id: e.target.value })}>
                  <option value="">— Route —</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>{r.route_name}</option>
                  ))}
                </select>
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Stop name" value={assignForm.stop_name} onChange={(e) => setAssignForm({ ...assignForm, stop_name: e.target.value })} />
                <button type="submit" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white md:col-span-3">Assign</button>
              </form>
            )}

            {assignments.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">No assignments yet.</p>
            ) : (
              <>
                {/* Mobile: cards */}
                <div className="space-y-2 md:hidden">
                  {assignments.map((a) => (
                    <div key={a.id} className="surface p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900">{a.student_name}</p>
                          <p className="mt-1 truncate text-[11px] text-slate-500">{a.route_name}</p>
                          <p className="text-[11px] text-slate-500">Stop: <span className="font-semibold">{a.stop_name}</span></p>
                        </div>
                        <button onClick={() => unassign(a.id)} className="shrink-0 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop: table */}
                <div className="hidden tbl-wrap md:block">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Route</th>
                        <th>Stop</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((a) => (
                        <tr key={a.id}>
                          <td>{a.student_name}</td>
                          <td><span className="chip bg-indigo-100 text-indigo-700">{a.route_name}</span></td>
                          <td>{a.stop_name}</td>
                          <td>
                            <button onClick={() => unassign(a.id)} className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </Sidebar>
  );
}
