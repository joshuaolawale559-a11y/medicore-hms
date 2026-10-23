"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Invoice = {
  id: string;
  invoiceNo: string;
  status: "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  createdAt: string;
  dueDate: string | null;
  patient: {
    id: string;
    patientCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  _count: { items: number; payments: number };
};

const STATUS_STYLES: Record<Invoice["status"], string> = {
  UNPAID: "bg-rose-50 text-rose-700 border-rose-200",
  PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
  PAID: "bg-brand-success/15 text-brand-success border-brand-success/30",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS: Record<Invoice["status"], string> = {
  UNPAID: "Unpaid",
  PARTIAL: "Partial",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BillingListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterPatientId) params.set("patientId", filterPatientId);

    const url = `/api/invoices${params.toString() ? `?${params}` : ""}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load invoices");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setInvoices(data.data ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load invoices.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterStatus, filterPatientId]);

  // Sum of all outstanding for a nice header stat
  const totalOutstanding = invoices.reduce(
    (sum, inv) => sum + inv.outstanding,
    0
  );

  const hasFilters = filterStatus || filterPatientId;

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-brand-cyan px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Billing</h2>
          <p className="text-xs text-brand-navy/60">
            {total} {total === 1 ? "invoice" : "invoices"}
            {hasFilters && " matching your filters"}
          </p>
        </div>
        <Link
          href="/dashboard/billing/new"
          className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
        >
          <span className="text-base leading-none">+</span>
          <span>New Invoice</span>
        </Link>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {/* Outstanding summary */}
        {!loading && invoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5">
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                Outstanding (on this page)
              </p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {formatNaira(totalOutstanding)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5">
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                Invoices on this page
              </p>
              <p className="text-2xl font-bold text-brand-navy mt-1">
                {invoices.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5">
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                Collected (on this page)
              </p>
              <p className="text-2xl font-bold text-brand-success mt-1">
                {formatNaira(
                  invoices.reduce((s, i) => s + i.paidAmount, 0)
                )}
              </p>
            </div>
          </div>
        )}

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
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
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
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-14 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-1">
              {hasFilters ? "No invoices match" : "No invoices yet"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6 max-w-sm mx-auto">
              {hasFilters
                ? "Try adjusting your filters, or create a new invoice."
                : "Create your first invoice to start tracking payments."}
            </p>
            {!hasFilters && (
              <Link
                href="/dashboard/billing/new"
                className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
              >
                <span className="text-base leading-none">+</span>
                <span>Create First Invoice</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-sky/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                    <th className="px-6 py-3">Invoice</th>
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Issued</th>
                    <th className="px-6 py-3">Due</th>
                    <th className="px-6 py-3 text-right">Total</th>
                    <th className="px-6 py-3 text-right">Outstanding</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-t border-brand-cyan/50 hover:bg-brand-cyan-light/40 transition"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-brand-navy/80">
                        {inv.invoiceNo}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-brand-cyan flex items-center justify-center text-[10px] font-bold text-brand-navy flex-shrink-0">
                            {inv.patient.firstName[0]}
                            {inv.patient.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-navy truncate">
                              {inv.patient.firstName} {inv.patient.lastName}
                            </p>
                            <p className="text-xs font-mono text-brand-navy/60 truncate">
                              {inv.patient.patientCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/70">
                        {formatDate(inv.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/70">
                        {formatDate(inv.dueDate)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-brand-navy">
                        {formatNaira(inv.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={
                            inv.outstanding > 0
                              ? "font-semibold text-rose-600"
                              : "font-semibold text-brand-success"
                          }
                        >
                          {formatNaira(inv.outstanding)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            STATUS_STYLES[inv.status]
                          }`}
                        >
                          {STATUS_LABELS[inv.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/billing/${inv.id}`}
                          className="text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
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