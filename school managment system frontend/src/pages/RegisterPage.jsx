import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const roles = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "parent", label: "Parent" },
];
const classLevels = [6, 7, 8, 9, 10];
const sections = ["A", "B", "C", "D"];
const departments = ["Science", "Arts", "Commerce", "Mathematics", "English", "Bengali"];
const designations = ["Assistant Teacher", "Senior Teacher", "Head Teacher", "Lecturer"];

const inputBase =
  "w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-slate-900 placeholder-slate-400 outline-none transition-colors hover:border-slate-300 focus:bg-white focus:ring-2";
const inputNormal = `${inputBase} border-slate-200 focus:border-sky-400 focus:ring-sky-500/20`;
const inputError  = `${inputBase} border-rose-400 focus:border-rose-500 focus:ring-rose-500/20`;

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState("student");

  // Common fields
  const [username, setUsername]           = useState("");
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPass] = useState("");
  const [firstName, setFirstName]         = useState("");
  const [lastName, setLastName]           = useState("");

  // Student-specific
  const [rollNumber, setRollNumber] = useState("");
  const [classLevel, setClassLevel] = useState(9);
  const [section, setSection]       = useState("A");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [address, setAddress]       = useState("");

  // Common — phone
  const [phone, setPhone] = useState("");

  // Teacher-specific
  const [employeeId, setEmployeeId]   = useState("");
  const [department, setDepartment]   = useState(departments[0]);
  const [designation, setDesignation] = useState(designations[0]);

  const [fieldErrors, setFieldErrors] = useState({}); // { fieldName: "error message" }
  const [globalError, setGlobalError] = useState(null);
  const [success, setSuccess]         = useState(null);
  const [submitting, setSubmitting]   = useState(false);

  const fe = (field) => fieldErrors[field];
  const ic = (field) => (fe(field) ? inputError : inputNormal);

  const resetErrors = () => { setFieldErrors({}); setGlobalError(null); };

  const handleRoleChange = (v) => { setRole(v); resetErrors(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetErrors();
    setSuccess(null);

    if (password !== confirmPassword) {
      setFieldErrors({ confirm_password: "Passwords do not match." });
      return;
    }

    const base = {
      username,
      email,
      password,
      role,
      first_name: firstName,
      last_name: lastName,
      phone,
    };

    let payload;
    if (role === "student") {
      payload = {
        ...base,
        roll_number: Number(rollNumber),
        class_level: classLevel,
        section,
        father_name: fatherName,
        mother_name: motherName,
        address,
      };
    } else if (role === "teacher") {
      payload = { ...base, employee_id: employeeId, department, designation };
    } else {
      payload = base;
    }

    setSubmitting(true);
    try {
      const res = await register(payload);
      setSuccess(res?.message || "Registration successful. You can now sign in.");
      setTimeout(() => navigate("/"), 1800);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.details && typeof resp.details === "object") {
        setFieldErrors(resp.details);
      } else {
        setGlobalError(resp?.error || "Unable to register. Please check your input and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-600 p-12 text-white">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white font-bold text-lg backdrop-blur-sm">S</div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">Join<br />School Portal</h2>
          <p className="mt-4 text-indigo-100 text-lg leading-relaxed max-w-xs">
            Create your account and get instant access to grades, attendance, and school updates.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            {["Students track grades & attendance", "Teachers manage marks & rosters", "Parents monitor child progress"].map((t) => (
              <div key={t} className="flex items-center gap-3 text-indigo-100">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-indigo-200 text-xs">© 2026 School Management System</p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-3/5 items-start justify-center bg-white px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-sm font-bold">S</div>
            <span className="font-semibold text-slate-900">School Portal</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
            <p className="mt-1 text-sm text-slate-500">Fill in your details to register.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role selector */}
            <Field label="Role" error={fe("role")}>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleRoleChange(r.value)}
                    className={`rounded-xl border py-2.5 text-sm font-semibold transition-colors ${
                      role === r.value
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </Field>

            {/* Common fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name" error={fe("first_name")}>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={ic("first_name")} placeholder="First name" />
              </Field>
              <Field label="Last Name" error={fe("last_name")}>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={ic("last_name")} placeholder="Last name" />
              </Field>
            </div>

            <Field label="Username" error={fe("username")}>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className={ic("username")} placeholder="Choose a username" />
            </Field>

            <Field label="Email" error={fe("email")}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={ic("email")} placeholder="you@example.com" />
            </Field>

            <Field label="Phone Number" error={fe("phone")}>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={ic("phone")} placeholder="e.g. 01712345678" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Password" error={fe("password")}>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={ic("password")} placeholder="••••••••" />
              </Field>
              <Field label="Confirm Password" error={fe("confirm_password")}>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPass(e.target.value)} className={ic("confirm_password")} placeholder="••••••••" />
              </Field>
            </div>

            {/* ── Student fields ── */}
            {role === "student" && (
              <>
                <div className="pt-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Student Details</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Roll Number" error={fe("roll_number")}>
                      <input type="number" required min={1} value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className={ic("roll_number")} placeholder="e.g. 20" />
                    </Field>
                    <Field label="Class Level" error={fe("class_level")}>
                      <select value={classLevel} onChange={(e) => setClassLevel(Number(e.target.value))} className={ic("class_level")}>
                        {classLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </Field>
                    <Field label="Section" error={fe("section")}>
                      <select value={section} onChange={(e) => setSection(e.target.value)} className={ic("section")}>
                        {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Father's Name" error={fe("father_name")}>
                      <input type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className={ic("father_name")} placeholder="Father's name" />
                    </Field>
                    <Field label="Mother's Name" error={fe("mother_name")}>
                      <input type="text" value={motherName} onChange={(e) => setMotherName(e.target.value)} className={ic("mother_name")} placeholder="Mother's name" />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Field label="Address" error={fe("address")}>
                      <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={ic("address")} placeholder="Home address" />
                    </Field>
                  </div>
                </div>
              </>
            )}

            {/* ── Teacher fields ── */}
            {role === "teacher" && (
              <div className="pt-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Teacher Details</p>
                <Field label="Employee ID" error={fe("employee_id")}>
                  <input type="text" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={ic("employee_id")} placeholder="e.g. EMP100" />
                </Field>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field label="Department" error={fe("department")}>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className={ic("department")}>
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Designation" error={fe("designation")}>
                    <select value={designation} onChange={(e) => setDesignation(e.target.value)} className={ic("designation")}>
                      {designations.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {/* ── Parent fields — only common fields needed ── */}
            {role === "parent" && (
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No extra details required for parent accounts.
              </div>
            )}

            {/* Global error */}
            {globalError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {globalError}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <svg className="mt-0.5 h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sky-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Registering..." : "Create account"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/" className="font-semibold text-sky-600 hover:text-sky-700">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
