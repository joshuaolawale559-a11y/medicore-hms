"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Appointment = {
  id: string;
  appointmentCode: string;
  department: string;
  scheduledAt: string;
  duration: number;
  reason: string | null;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  createdAt: string;
  patient: {
    id: string;
    patientCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
  doctor: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  };
  createdBy: {
    id: string;
    fullName: string;
  } | null;
};

const STATUS_LABELS: Record<Appointment["status"], string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

const STATUS_STYLES: Record<Appointment["status"], string> = {
  SCHEDULED: "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
  COMPLETED: "bg-brand-success/15 text-brand-success border-brand-success/30",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  NO_SHOW: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function AppointmentDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetch(`/api/appointments/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");
        return data;
      })
      .then((data) => {
        if (!cancelled) setAppointment(data.appointment);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load appointment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function updateStatus(newStatus: Appointment["status"]) {
    if (!appointment) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not update status.");
        return;
      }
      setAppointment((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
    } catch {
      setError("Could not reach the server.");
    } finally {
      setUpdating(false);
    }
  }

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  if (loading) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <div className="h-4 w-40 bg-brand-cyan rounded animate-pulse mb-2" />
          <div className="h-6 w-64 bg-brand-cyan rounded animate-pulse" />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
            <div className="h-72 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  if (error || !appointment) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/appointments"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Appointments
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">Appointment</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 p-12 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              {error || "Appointment not found"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6">
              The appointment you're looking for doesn't exist or you don't
              have access to it.
            </p>
            <Link
              href="/dashboard/appointments"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
            >
              Back to Appointments
            </Link>
          </div>
        </main>
      </>
    );
  }

  const { date, time } = formatDateTime(appointment.scheduledAt);

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-2"
        >
          ← Back to Appointments
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">
              {appointment.patient.firstName} {appointment.patient.lastName}
            </h2>
            <p className="text-xs text-brand-navy/60 font-mono mt-0.5">
              {appointment.appointmentCode}
            </p>
          </div>

          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
              STATUS_STYLES[appointment.status]
            }`}
          >
            {STATUS_LABELS[appointment.status]}
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* When */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-brand-accent" />
                Schedule
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Row label="Date" value={date} />
                <Row label="Time" value={`${time} (${appointment.duration} min)`} />
                <Row label="Department" value={appointment.department} />
                <Row
                  label="Reason"
                  value={appointment.reason || "—"}
                />
              </dl>
            </div>

            {/* People */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-brand-success" />
                People
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient */}
                <div>
                  <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide mb-2">
                    Patient
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-cyan flex items-center justify-center text-xs font-bold text-brand-navy flex-shrink-0">
                      {appointment.patient.firstName[0]}
                      {appointment.patient.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-navy truncate">
                        {appointment.patient.firstName}{" "}
                        {appointment.patient.lastName}
                      </p>
                      <p className="text-xs font-mono text-brand-navy/60">
                        {appointment.patient.patientCode}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-brand-navy/80">
                      📞 {appointment.patient.phone}
                    </p>
                    {appointment.patient.email && (
                      <p className="text-brand-navy/80 truncate">
                        ✉ {appointment.patient.email}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/patients/${appointment.patient.id}`}
                    className="inline-block mt-3 text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
                  >
                    View patient profile →
                  </Link>
                </div>

                {/* Doctor */}
                <div>
                  <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide mb-2">
                    Doctor
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-accent text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {appointment.doctor.fullName
                        .replace(/^Dr\.?\s+/i, "")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-navy truncate">
                        {appointment.doctor.fullName}
                      </p>
                      <p className="text-xs text-brand-navy/60">Doctor</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    {appointment.doctor.phone && (
                      <p className="text-brand-navy/80">
                        📞 {appointment.doctor.phone}
                      </p>
                    )}
                    {appointment.doctor.email && (
                      <p className="text-brand-navy/80 truncate">
                        ✉ {appointment.doctor.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-amber-400" />
                  Clinical Notes
                </h3>
                <p className="text-sm text-brand-navy/80 leading-relaxed whitespace-pre-wrap">
                  {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Status actions */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
                Update Status
              </h3>
              <div className="space-y-2">
                <StatusButton
                  label="Mark as Completed"
                  current={appointment.status}
                  target="COMPLETED"
                  onClick={updateStatus}
                  disabled={updating}
                  accent="bg-brand-success hover:bg-emerald-700"
                />
                <StatusButton
                  label="Mark as No-show"
                  current={appointment.status}
                  target="NO_SHOW"
                  onClick={updateStatus}
                  disabled={updating}
                  accent="bg-amber-500 hover:bg-amber-600"
                />
                <StatusButton
                  label="Cancel appointment"
                  current={appointment.status}
                  target="CANCELLED"
                  onClick={updateStatus}
                  disabled={updating}
                  accent="bg-rose-500 hover:bg-rose-600"
                />
                <StatusButton
                  label="Revert to Scheduled"
                  current={appointment.status}
                  target="SCHEDULED"
                  onClick={updateStatus}
                  disabled={updating}
                  accent="bg-brand-accent hover:bg-brand-navy"
                />
              </div>
              {updating && (
                <p className="text-xs text-brand-navy/60 mt-3 text-center">
                  Updating…
                </p>
              )}
            </div>

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
                    <span className="font-semibold">
                      {STATUS_LABELS[appointment.status]}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-brand-cyan-light/70">Booked on</span>
                    <span className="font-semibold text-right">
                      {new Date(appointment.createdAt).toLocaleDateString(
                        "en-GB",
                        { day: "2-digit", month: "short", year: "numeric" }
                      )}
                    </span>
                  </div>
                  {appointment.createdBy && (
                    <div className="flex justify-between gap-4">
                      <span className="text-brand-cyan-light/70">
                        Booked by
                      </span>
                      <span className="font-semibold text-right">
                        {appointment.createdBy.fullName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className="text-sm text-brand-navy">{value}</dd>
    </div>
  );
}

function StatusButton({
  label,
  current,
  target,
  onClick,
  disabled,
  accent,
}: {
  label: string;
  current: Appointment["status"];
  target: Appointment["status"];
  onClick: (s: Appointment["status"]) => void;
  disabled: boolean;
  accent: string;
}) {
  const isCurrent = current === target;
  return (
    <button
      type="button"
      disabled={disabled || isCurrent}
      onClick={() => onClick(target)}
      className={`w-full text-left text-sm font-semibold px-4 py-2.5 rounded-lg transition ${
        isCurrent
          ? "bg-brand-cyan-light text-brand-navy/40 cursor-not-allowed border border-brand-cyan"
          : `${accent} text-white shadow-md`
      } disabled:opacity-60`}
    >
      {isCurrent ? `${label} (current)` : label}
    </button>
  );
}