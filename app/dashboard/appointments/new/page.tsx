"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type Patient = {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  phone: string;
};

type Doctor = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
};

const DEPARTMENTS = [
  "General",
  "Cardiology",
  "Pediatrics",
  "Orthopedics",
  "Dermatology",
  "Neurology",
  "Obstetrics & Gynecology",
  "Ophthalmology",
  "ENT",
  "Dentistry",
  "Psychiatry",
  "Radiology",
  "Other",
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatientId = searchParams.get("patientId") || "";

  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [patientId, setPatientId] = useState(preselectedPatientId);
  const [doctorId, setDoctorId] = useState("");
  const [department, setDepartment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load patients + doctors in parallel
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/patients").then((r) => r.json()),
      fetch("/api/doctors").then((r) => r.json()),
    ])
      .then(([patientsRes, doctorsRes]) => {
        if (cancelled) return;
        setPatients(patientsRes.data ?? []);
        setDoctors(doctorsRes.doctors ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load patients or doctors.");
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function validate() {
    const errs: Record<string, string> = {};
    if (!patientId) errs.patientId = "Please select a patient";
    if (!doctorId) errs.doctorId = "Please select a doctor";
    if (!department) errs.department = "Please select a department";
    if (!scheduledAt)
      errs.scheduledAt = "Please choose a date and time";
    else if (new Date(scheduledAt).getTime() < Date.now() - 60_000)
      errs.scheduledAt = "Appointment time must be in the future";
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
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          doctorId,
          department,
          scheduledAt,
          duration,
          reason: reason.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fe: Record<string, string> = {};
          for (const e of data.errors) fe[e.field] = e.message;
          setFieldErrors(fe);
        }
        setError(data.message || "Could not book appointment.");
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/appointments/${data.appointment.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  // If no patients exist, prompt to register one first
  if (!loadingData && patients.length === 0) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Appointments
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">
            Book Appointment
          </h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-10 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              No patients registered yet
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6">
              You need at least one patient before you can book an
              appointment.
            </p>
            <Link
              href="/dashboard/patients/new"
              className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
            >
              <span className="text-base leading-none">+</span>
              <span>Register First Patient</span>
            </Link>
          </div>
        </main>
      </>
    );
  }

  // If no doctors exist, that's also a blocker
  if (!loadingData && doctors.length === 0) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Appointments
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">
            Book Appointment
          </h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-10 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-amber-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🩺</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              No doctors available
            </h3>
            <p className="text-sm text-brand-navy/70">
              Add at least one doctor to your hospital before booking
              appointments.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
        >
          ← Back to Appointments
        </Link>
        <h2 className="text-lg font-bold text-brand-navy">
          Book New Appointment
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

          {loadingData ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-brand-cyan-light/60 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <Section title="Who & When" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <Field label="Patient" required error={fieldErrors.patientId}>
                  <select
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="input"
                  >
                    <option value="">Select patient…</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} — {p.patientCode}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Doctor" required error={fieldErrors.doctorId}>
                  <select
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                    className="input"
                  >
                    <option value="">Select doctor…</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Department"
                  required
                  error={fieldErrors.department}
                >
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="input"
                  >
                    <option value="">Select department…</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Date & Time"
                  required
                  error={fieldErrors.scheduledAt}
                >
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Duration (minutes)">
                  <select
                    value={duration}
                    onChange={(e) =>
                      setDuration(parseInt(e.target.value, 10))
                    }
                    className="input"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </Field>
              </div>

              <Section title="Details" />

              <div className="space-y-5 mb-8">
                <Field label="Reason for Visit">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input"
                    placeholder="e.g. Chest pain, routine check-up, follow-up"
                  />
                </Field>

                <Field label="Clinical Notes (optional)">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="input resize-none"
                    placeholder="Any pre-visit notes for the doctor…"
                  />
                </Field>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-brand-cyan">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white font-semibold px-6 py-3 rounded-lg transition shadow-md shadow-brand-accent/30 disabled:opacity-60"
                >
                  {submitting ? "Booking…" : "Book Appointment"}
                </button>
                <Link
                  href="/dashboard/appointments"
                  className="inline-flex items-center justify-center bg-brand-cyan-light hover:bg-brand-cyan text-brand-navy font-semibold px-6 py-3 rounded-lg transition"
                >
                  Cancel
                </Link>
              </div>
            </>
          )}
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