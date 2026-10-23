"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];const GENOTYPES = ["AA", "AS", "AC", "SS", "SC", "CC"];

export default function NewPatientPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [genotype, setGenotype] = useState("");
  const [allergies, setAllergies] = useState("");
  const [notes, setNotes] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!dateOfBirth) errs.dateOfBirth = "Date of birth is required";
    if (!gender) errs.gender = "Gender is required";
    if (!phone.trim()) errs.phone = "Phone is required";
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      errs.email = "Enter a valid email address";
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
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
          gender,
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          bloodGroup,
          genotype,
          allergies: allergies.trim(),
          notes: notes.trim(),
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fe: Record<string, string> = {};
          for (const e of data.errors) {
            fe[e.field] = e.message;
          }
          setFieldErrors(fe);
        }
        setError(data.message || "Could not register patient.");
        setSubmitting(false);
        return;
      }

      // Success — go to the new patient's profile
      router.push(`/dashboard/patients/${data.patient.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4 flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Patients
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">
            Register New Patient
          </h2>
        </div>
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

          {/* BASIC INFO */}
          <Section title="Basic Information" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Field label="First Name" required error={fieldErrors.firstName}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input"
                placeholder="e.g. Amara"
              />
            </Field>

            <Field label="Last Name" required error={fieldErrors.lastName}>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input"
                placeholder="e.g. Okafor"
              />
            </Field>

            <Field
              label="Date of Birth"
              required
              error={fieldErrors.dateOfBirth}
            >
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="input"
                max={new Date().toISOString().split("T")[0]}
              />
            </Field>

            <Field label="Gender" required error={fieldErrors.gender}>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="input"
              >
                <option value="">Select gender…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>

            <Field label="Phone" required error={fieldErrors.phone}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder="+234 801 234 5678"
              />
            </Field>

            <Field label="Email" error={fieldErrors.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="patient@example.com"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Home Address">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input"
                  placeholder="Street, city, state"
                />
              </Field>
            </div>
          </div>

          {/* MEDICAL */}
          <Section title="Medical Information" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Field label="Blood Group">
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="input"
              >
                <option value="">Unknown / not tested</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Genotype">
              <select
                value={genotype}
                onChange={(e) => setGenotype(e.target.value)}
                className="input"
              >
                <option value="">Unknown / not tested</option>
                {GENOTYPES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Known Allergies">
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="input"
                placeholder="e.g. Penicillin, peanuts"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Medical Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input resize-none"
                  placeholder="Any relevant medical history, chronic conditions, or notes…"
                />
              </Field>
            </div>
          </div>

          {/* EMERGENCY CONTACT */}
          <Section title="Emergency Contact" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <Field label="Contact Name">
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                className="input"
                placeholder="Full name"
              />
            </Field>

            <Field label="Contact Phone">
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) =>
                  setEmergencyContactPhone(e.target.value)
                }
                className="input"
                placeholder="+234 …"
              />
            </Field>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-brand-cyan">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white font-semibold px-6 py-3 rounded-lg transition shadow-md shadow-brand-accent/30 disabled:opacity-60"
            >
              {submitting ? "Registering…" : "Register Patient"}
            </button>
            <Link
              href="/dashboard/patients"
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