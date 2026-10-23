"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Prescription = {
  id: string;
  prescriptionNo: string;
  status: "PENDING" | "PARTIALLY_DISPENSED" | "DISPENSED" | "CANCELLED";
  diagnosis: string | null;
  createdAt: string;
  dispensedAt: string | null;
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
  };
  _count: { items: number };
};

const STATUS_STYLES: Record<Prescription["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIALLY_DISPENSED: "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
  DISPENSED: "bg-brand-success/15 text-brand-success border-brand-success/30",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS: Record<Prescription["status"], string> = {
  PENDING: "Pending",
  PARTIALLY_DISPENSED: "Partial",
  DISPENSED: "Dispensed",
  CANCELLED: "Cancelled",
};

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

export default function PrescriptionsListPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterStatus, setFilterStatus] = useState("");
  const [filterPatientId, setFilterPatientId] = useState("");
  const [patients, setPatients] = useState<
    { id: string; firstName: string; lastName: string; patientCode: string }[]
  >([]);

  // Load patients for filter dropdown
  useEffect(() => {
    fetch("/api/patients")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setPatients(d.data ?? []))
      .catch(() => setPatients([]));
  }, []);

  // Load prescriptions
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterPatientId) params.set("patientId", filterPatientId);

    const url = `/api/prescriptions${
      params.toString() ? `?${params}` : ""
    }`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load prescriptions");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setPrescriptions(data.data ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load prescriptions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterStatus, filterPatientId]);

  const pendingCount = prescriptions.filter(
    (p) => p.status === "PENDING"
  ).length;

  const hasFilters = filterStatus || filterPatientId;

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4 flex justify-between items-center">
        <div>
          <Link
            href="/dashboard/pharmacy"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Pharmacy
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">
            Prescriptions
          </h2>
          <p className="text-xs text-brand-navy/60">
            {total} {total === 1 ? "prescription" : "prescriptions"}
            {pendingCount > 0 && !hasFilters && (
              <span className="ml-2 text-amber-600 font-semibold">
                · {pendingCount} pending
              </span>
            )}
            {hasFilters && " matching your filters"}
          </p>
        </div>
        <Link
          href="/dashboard/pharmacy/prescriptions/new"
          className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
        >
          <span className="text-base leading-none">+</span>
          <span>New Prescription</span>
        </Link>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <option value="PENDING">Pending</option>
                <option value="PARTIALLY_DISPENSED">Partially Dispensed</option>
                <option value="DISPENSED">Dispensed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-1.5">
                Patient
              </label>
              <select
                value={filterPatientId}
                onChange={(e) => setFilterPatientId(e.target.value)}
                className="input"
              >
                <option value="">All patients</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.patientCode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={() => {
                setFilterStatus("");
                setFilterPatientId("");
              }}
              className="mt-3 text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-brand-cyan-light/60 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-14 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-1">
              {hasFilters ? "No prescriptions match" : "No prescriptions yet"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6 max-w-md mx-auto">
              {hasFilters
                ? "Try adjusting your filters, or write a new prescription."
                : "Prescriptions written by doctors will appear here."}
            </p>
            {!hasFilters && (
              <Link
                href="/dashboard/pharmacy/prescriptions/new"
                className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
              >
                <span className="text-base leading-none">+</span>
                <span>Write First Prescription</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-sky/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                    <th className="px-6 py-3">Rx No.</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Doctor</th>
                    <th className="px-6 py-3">Diagnosis</th>
                    <th className="px-6 py-3 text-center">Drugs</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((rx) => {
                    const { date, time } = formatDateTime(rx.createdAt);
                    return (
                      <tr
                        key={rx.id}
                        className="border-t border-brand-cyan/50 hover:bg-brand-cyan-light/40 transition"
                      >
                        <td className="px-6 py-4 font-mono text-xs text-brand-navy/80">
                          {rx.prescriptionNo}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-brand-cyan flex items-center justify-center text-[10px] font-bold text-brand-navy flex-shrink-0">
                              {rx.patient.firstName[0]}
                              {rx.patient.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-brand-navy truncate">
                                {rx.patient.firstName} {rx.patient.lastName}
                              </p>
                              <p className="text-xs font-mono text-brand-navy/60 truncate">
                                {rx.patient.patientCode}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-brand-navy/80 text-xs">
                          {rx.doctor.fullName}
                        </td>
                        <td className="px-6 py-4 text-brand-navy/70 text-xs truncate max-w-[180px]">
                          {rx.diagnosis || "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-brand-cyan-light text-brand-navy text-xs font-bold">
                            {rx._count.items}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                              STATUS_STYLES[rx.status]
                            }`}
                          >
                            {STATUS_LABELS[rx.status]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-brand-navy/60">
                          {date}
                          <br />
                          {time}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/pharmacy/prescriptions/${rx.id}`}
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