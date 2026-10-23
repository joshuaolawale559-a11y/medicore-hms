"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Appointment = {
  id: string;
  appointmentCode: string;
  department: string;
  scheduledAt: string;
  duration: number;
  reason: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  patient: {
    id: string;
    patientCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  doctor: {
    id: string;
    fullName: string;
    role: string;
  };
};

const STATUS_STYLES: Record<Appointment["status"], string> = {
  SCHEDULED: "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
  COMPLETED: "bg-brand-success/15 text-brand-success border-brand-success/30",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  NO_SHOW: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_LABELS: Record<Appointment["status"], string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

export default function AppointmentsListPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDoctorId, setFilterDoctorId] = useState("");

  const [doctors, setDoctors] = useState<
    { id: string; fullName: string }[]
  >([]);

  // Load doctors for the filter dropdown
  useEffect(() => {
    fetch("/api/doctors")
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors ?? []))
      .catch(() => setDoctors([]));
  }, []);

  // Fetch appointments whenever filters change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (filterDate) params.set("date", filterDate);
    if (filterStatus) params.set("status", filterStatus);
    if (filterDoctorId) params.set("doctorId", filterDoctorId);

    const url = `/api/appointments${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load appointments");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setAppointments(data.data ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load appointments.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterDate, filterStatus, filterDoctorId]);

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  function clearFilters() {
    setFilterDate("");
    setFilterStatus("");
    setFilterDoctorId("");
  }

  const hasFilters = filterDate || filterStatus || filterDoctorId;

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-brand-cyan px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Appointments</h2>
          <p className="text-xs text-brand-navy/60">
            {total} {total === 1 ? "appointment" : "appointments"}
            {hasFilters && " matching your filters"}
          </p>
        </div>
        <Link
          href="/dashboard/appointments/new"
          className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
        >
          <span className="text-base leading-none">+</span>
          <span>Book Appointment</span>
        </Link>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input"
              >
                <option value="">All statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No-show</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-1.5">
                Doctor
              </label>
              <select
                value={filterDoctorId}
                onChange={(e) => setFilterDoctorId(e.target.value)}
                className="input"
              >
                <option value="">All doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasFilters}
                className="w-full bg-brand-cyan-light hover:bg-brand-cyan text-brand-navy text-sm font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 overflow-hidden">
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-brand-cyan-light/60 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-14 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-1">
              {hasFilters ? "No appointments match" : "No appointments yet"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6 max-w-sm mx-auto">
              {hasFilters
                ? "Try adjusting your filters, or book a new appointment."
                : "Book your first appointment to get started."}
            </p>
            {!hasFilters && (
              <Link
                href="/dashboard/appointments/new"
                className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
              >
                <span className="text-base leading-none">+</span>
                <span>Book First Appointment</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-sky/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                    <th className="px-6 py-3">When</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((a) => {
                    const { date, time } = formatDateTime(a.scheduledAt);
                    return (
                      <tr
                        key={a.id}
                        className="border-t border-brand-cyan/50 hover:bg-brand-cyan-light/40 transition"
                      >
                        <td className="px-6 py-4">
                          <p className="font-semibold text-brand-navy">
                            {date}
                          </p>
                          <p className="text-xs text-brand-navy/60">
                            {time} · {a.duration}min
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-brand-cyan flex items-center justify-center text-[10px] font-bold text-brand-navy flex-shrink-0">
                              {a.patient.firstName[0]}
                              {a.patient.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-brand-navy truncate">
                                {a.patient.firstName} {a.patient.lastName}
                              </p>
                              <p className="text-xs font-mono text-brand-navy/60 truncate">
                                {a.patient.patientCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-brand-navy/80">
                          {a.doctor.fullName}
                        </td>
                        <td className="px-6 py-4 text-brand-navy/80">
                          {a.department}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              STATUS_STYLES[a.status]
                            }`}
                          >
                            {STATUS_LABELS[a.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/appointments/${a.id}`}
                            className="text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #9dd1ff;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
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
      `}</style>
    </>
  );
}