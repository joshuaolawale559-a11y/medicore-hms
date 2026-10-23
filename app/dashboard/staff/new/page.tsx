"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ROLES = [
  { value: "DOCTOR", label: "Doctor" },
  { value: "NURSE", label: "Nurse" },
  { value: "RECEPTIONIST", label: "Receptionist" },
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "ADMIN", label: "Administrator" },
];

export default function NewStaffPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      errs.email = "Enter a valid email address";
    if (!role) errs.role = "Role is required";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8)
      errs.password = "Password must be at least 8 characters";
    if (password !== confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!validate()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          role,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fe: Record<string, string> = {};
          for (const e of data.errors) fe[e.field] = e.message;
          setFieldErrors(fe);
        }
        setError(data.message || "Could not create staff member.");
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/staff/${data.user.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/staff"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
        >
          ← Back to Staff
        </Link>
        <h2 className="text-lg font-bold text-brand-navy">
          Add New Staff Member
        </h2>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-8"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
              {error}
            </div>
          )}

          <Section title="Personal Information" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Field label="Full Name" required error={fieldErrors.fullName}>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder="e.g. Dr. Amara Okafor"
              />
            </Field>

            <Field label="Role" required error={fieldErrors.role}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="input"
              >
                <option value="">Select role…</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Email" required error={fieldErrors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="staff@hospital.com"
              />
            </Field>

            <Field label="Phone">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="+234 801 234 5678"
              />
            </Field>
          </div>

          <Section title="Set Password" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <Field label="Password" required error={fieldErrors.password}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="At least 8 characters"
              />
            </Field>

            <Field
              label="Confirm Password"
              required
              error={fieldErrors.confirmPassword}
            >
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
                placeholder="Repeat password"
              />
            </Field>
          </div>

          <div className="bg-brand-cyan-light/60 border border-brand-sky/40 rounded-lg p-4 mb-8">
            <p className="text-xs text-brand-navy/80 leading-relaxed">
              <strong className="text-brand-navy">Note:</strong> Share this
              password with the staff member so they can sign in. They can
              change it later from their profile.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-brand-cyan">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white font-semibold px-6 py-3 rounded-lg transition shadow-md shadow-brand-accent/30 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Staff Member"}
            </button>
            <Link
              href="/dashboard/staff"
              className="inline-flex items-center justify-center bg-brand-cyan-light hover:bg-brand-cyan text-brand-navy font-semibold px-6 py-3 rounded-lg transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #9dd1ff;
          border-radius: 0.5rem;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          background: white;
          color: #01233f;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input:focus {
          border-color: #4aa9e8;
          box-shadow: 0 0 0 3px rgba(74, 169, 232, 0.2);
        }
        .input::placeholder {
          color: rgba(1, 35, 63, 0.4);
        }
      `}</style>
    </>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-5 w-1 rounded-full bg-brand-accent" />
      <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-navy mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}