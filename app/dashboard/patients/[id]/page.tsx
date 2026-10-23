"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Patient = {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string | null;
  address: string | null;
  bloodGroup: string | null;
  allergies: string | null;
  notes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
  createdBy: {
    id: string;
    fullName: string;
    role: string;
  } | null;
};

export default function PatientDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetch(`/api/patients/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to load patient");
        }
        return data;
      })
      .then((data) => {
        if (!cancelled) setPatient(data.patient);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load patient.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function ageFrom(dobIso: string) {
    const dob = new Date(dobIso);
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <div className="h-4 w-32 bg-brand-cyan rounded animate-pulse mb-2" />
          <div className="h-5 w-48 bg-brand-cyan rounded animate-pulse" />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
              <div className="h-48 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
            </div>
            <div className="h-72 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  if (error || !patient) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/patients"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Patients
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">Patient</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 p-12 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              {error || "Patient not found"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6">
              The patient you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Link
              href="/dashboard/patients"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
            >
              Back to Patients
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-2"
        >
          ← Back to Patients
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-cyan flex items-center justify-center text-lg font-bold text-brand-navy flex-shrink-0">
              {patient.firstName[0]}
              {patient.lastName[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-navy">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-xs text-brand-navy/60 font-mono">
                {patient.patientCode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-success bg-brand-success/10 px-3 py-1.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-success" />
              Active
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-brand-accent" />
                Basic Information
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Row label="Full Name" value={`${patient.firstName} ${patient.lastName}`} />
                <Row label="Patient Code" value={patient.patientCode} mono />
                <Row label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
                <Row label="Age" value={`${ageFrom(patient.dateOfBirth)} years`} />
                <Row label="Gender" value={patient.gender} />
                <Row label="Blood Group" value={patient.bloodGroup || "—"} />
                <Row label="Phone" value={patient.phone} />
                <Row label="Email" value={patient.email || "—"} />
                <div className="md:col-span-2">
                  <Row label="Address" value={patient.address || "—"} />
                </div>
              </dl>
            </div>

            {/* Medical */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-rose-500" />
                Medical Information
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide mb-1.5">
                    Known Allergies
                  </p>
                  {patient.allergies ? (
                    <p className="text-sm text-brand-navy bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 inline-block">
                      ⚠ {patient.allergies}
                    </p>
                  ) : (
                    <p className="text-sm text-brand-navy/50">
                      No known allergies
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide mb-1.5">
                    Medical Notes
                  </p>
                  <p className="text-sm text-brand-navy/80 leading-relaxed whitespace-pre-wrap">
                    {patient.notes || "No notes recorded."}
                  </p>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-amber-400" />
                Emergency Contact
              </h3>
              {patient.emergencyContactName || patient.emergencyContactPhone ? (
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <Row
                    label="Contact Name"
                    value={patient.emergencyContactName || "—"}
                  />
                  <Row
                    label="Contact Phone"
                    value={patient.emergencyContactPhone || "—"}
                  />
                </dl>
              ) : (
                <p className="text-sm text-brand-navy/50">
                  No emergency contact recorded.
                </p>
              )}
            </div>

            {/* Coming soon tabs */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-purple-500" />
                Patient History
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: "Appointments", note: "Coming soon" },
                  { label: "Prescriptions", note: "Coming soon" },
                  { label: "Invoices", note: "Coming soon" },
                ].map((tab) => (
                  <div
                    key={tab.label}
                    className="border border-brand-cyan rounded-xl p-4 text-center bg-brand-cyan-light/40"
                  >
                    <p className="text-sm font-semibold text-brand-navy">
                      {tab.label}
                    </p>
                    <p className="text-[10px] text-brand-navy/50 uppercase tracking-wide mt-1">
                      {tab.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Quick facts */}
            <div className="bg-brand-navy text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10" />
              <div className="relative">
                <p className="text-xs font-bold text-brand-sky uppercase tracking-widest mb-4">
                  Quick Facts
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-brand-cyan-light/70">Status</span>
                    <span className="font-semibold">Active</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-brand-cyan-light/70">
                      Registered
                    </span>
                    <span className="font-semibold text-right">
                      {formatDate(patient.createdAt)}
                    </span>
                  </div>
                  {patient.createdBy && (
                    <div className="flex justify-between gap-4">
                      <span className="text-brand-cyan-light/70">
                        Registered by
                      </span>
                      <span className="font-semibold text-right">
                        {patient.createdBy.fullName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Book appointment", disabled: true },
                  { label: "Create prescription", disabled: true },
                  { label: "Generate invoice", disabled: true },
                  { label: "Edit patient", disabled: true },
                ].map((action) => (
                  <button
                    key={action.label}
                    disabled={action.disabled}
                    className="w-full text-left text-sm font-medium px-4 py-2.5 rounded-lg border border-brand-cyan text-brand-navy/40 cursor-not-allowed bg-brand-cyan-light/30"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-brand-navy/50 mt-3 text-center uppercase tracking-wide">
                Available as modules are built
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd
        className={`text-sm text-brand-navy ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}