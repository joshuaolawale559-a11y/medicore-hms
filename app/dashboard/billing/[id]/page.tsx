"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type InvoiceItem = {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Payment = {
  id: string;
  amount: number;
  method: "CASH" | "CARD" | "TRANSFER" | "OTHER";
  reference: string | null;
  notes: string | null;
  paidAt: string;
  receivedBy: { id: string; fullName: string } | null;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  status: "UNPAID" | "PARTIAL" | "PAID" | "CANCELLED";
  totalAmount: number;
  paidAmount: number;
  outstanding: number;
  createdAt: string;
  dueDate: string | null;
  notes: string | null;
  patient: {
    id: string;
    patientCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
  items: InvoiceItem[];
  payments: Payment[];
  createdBy: { id: string; fullName: string } | null;
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

const CATEGORY_LABELS: Record<string, string> = {
  CONSULTATION: "Consultation",
  TEST: "Lab / Test",
  ADMISSION: "Admission",
  PHARMACY: "Pharmacy",
  PROCEDURE: "Procedure",
  OTHER: "Other",
};

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "TRANSFER", label: "Bank Transfer" },
  { value: "OTHER", label: "Other" },
];

function formatNaira(amount: number) {
  return `₦${Number(amount).toLocaleString("en-NG", {
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment form state
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"CASH" | "CARD" | "TRANSFER" | "OTHER">(
    "CASH"
  );
  const [reference, setReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cancellation state
  const [cancelling, setCancelling] = useState(false);

  async function loadInvoice() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setInvoice(data.invoice);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openPaymentForm() {
    if (!invoice) return;
    setAmount(invoice.outstanding.toFixed(2));
    setMethod("CASH");
    setReference("");
    setPaymentNotes("");
    setPaymentError("");
    setShowPaymentForm(true);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setPaymentError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setPaymentError("Enter a valid amount greater than 0.");
      return;
    }
    if (invoice && numAmount > invoice.outstanding + 0.001) {
      setPaymentError(
        `Payment cannot exceed the outstanding amount of ${formatNaira(
          invoice.outstanding
        )}.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/invoices/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          method,
          reference: reference.trim() || undefined,
          notes: paymentNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPaymentError(data.message || "Could not record payment.");
        setSubmitting(false);
        return;
      }

      setShowPaymentForm(false);
      setSubmitting(false);
      await loadInvoice();
    } catch {
      setPaymentError("Could not reach the server.");
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (
      !window.confirm(
        "Cancel this invoice? This cannot be undone. You can only cancel an invoice that has no payments."
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Could not cancel invoice.");
        return;
      }
      await loadInvoice();
    } catch {
      alert("Could not reach the server.");
    } finally {
      setCancelling(false);
    }
  }

  // ---- Loading state ----
  if (loading) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <div className="h-4 w-40 bg-brand-cyan rounded animate-pulse mb-2" />
          <div className="h-6 w-64 bg-brand-cyan rounded animate-pulse" />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
            <div className="h-80 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  // ---- Error / not found ----
  if (error || !invoice) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Billing
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">Invoice</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 p-12 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              {error || "Invoice not found"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6">
              The invoice you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
            >
              Back to Billing
            </Link>
          </div>
        </main>
      </>
    );
  }

  const canRecordPayment =
    invoice.status !== "CANCELLED" && invoice.outstanding > 0;

  const canCancel =
    invoice.status === "UNPAID" && invoice.paidAmount === 0;

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-2"
        >
          ← Back to Billing
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">
              Invoice {invoice.invoiceNo}
            </h2>
            <p className="text-xs text-brand-navy/60 mt-0.5">
              Issued {formatDate(invoice.createdAt)}
              {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
            </p>
          </div>

          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
              STATUS_STYLES[invoice.status]
            }`}
          >
            {STATUS_LABELS[invoice.status]}
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient card */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-brand-accent" />
                Billed To
              </h3>

              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-brand-cyan flex items-center justify-center text-sm font-bold text-brand-navy flex-shrink-0">
                  {invoice.patient.firstName[0]}
                  {invoice.patient.lastName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-brand-navy truncate">
                    {invoice.patient.firstName} {invoice.patient.lastName}
                  </p>
                  <p className="text-xs font-mono text-brand-navy/60">
                    {invoice.patient.patientCode}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm mt-4">
                <div>
                  <span className="text-brand-navy/60">📞 </span>
                  <span className="text-brand-navy">
                    {invoice.patient.phone}
                  </span>
                </div>
                {invoice.patient.email && (
                  <div>
                    <span className="text-brand-navy/60">✉ </span>
                    <span className="text-brand-navy">
                      {invoice.patient.email}
                    </span>
                  </div>
                )}
              </div>

              <Link
                href={`/dashboard/patients/${invoice.patient.id}`}
                className="inline-block mt-4 text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
              >
                View patient profile →
              </Link>
            </div>

            {/* Line items */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm overflow-hidden">
              <div className="p-6 pb-0">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-brand-success" />
                  Line Items
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Category</th>
                      <th className="px-6 py-3 text-right">Qty</th>
                      <th className="px-6 py-3 text-right">Unit Price</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-brand-cyan/50"
                      >
                        <td className="px-6 py-3 font-medium text-brand-navy">
                          {item.description}
                        </td>
                        <td className="px-6 py-3 text-brand-navy/70 text-xs">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </td>
                        <td className="px-6 py-3 text-right text-brand-navy/80">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-3 text-right text-brand-navy/80">
                          {formatNaira(Number(item.unitPrice))}
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-brand-navy">
                          {formatNaira(Number(item.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-brand-navy/20">
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-right text-xs font-bold text-brand-navy uppercase tracking-wide"
                      >
                        Total
                      </td>
                      <td className="px-6 py-4 text-right text-lg font-bold text-brand-navy">
                        {formatNaira(invoice.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-amber-400" />
                  Notes
                </h3>
                <p className="text-sm text-brand-navy/80 leading-relaxed whitespace-pre-wrap">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* Payment history */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-purple-500" />
                Payment History
              </h3>

              {invoice.payments.length === 0 ? (
                <p className="text-sm text-brand-navy/60 py-4">
                  No payments recorded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {invoice.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start justify-between py-3 border-b border-brand-cyan/60 last:border-0 gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand-success/15 text-brand-success border border-brand-success/30">
                            {formatNaira(Number(p.amount))}
                          </span>
                          <span className="text-xs font-semibold text-brand-navy/80">
                            via {p.method}
                          </span>
                          {p.reference && (
                            <span className="text-xs font-mono text-brand-navy/60">
                              · {p.reference}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-brand-navy/60 mt-1">
                          {formatDateTime(p.paidAt)}
                          {p.receivedBy && ` · by ${p.receivedBy.fullName}`}
                        </p>
                        {p.notes && (
                          <p className="text-xs text-brand-navy/60 mt-1 italic">
                            "{p.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Balance summary */}
            <div className="bg-brand-navy text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10" />
              <div className="relative space-y-4">
                <div>
                  <p className="text-xs font-bold text-brand-sky uppercase tracking-widest">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold mt-1">
                    {formatNaira(invoice.totalAmount)}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs font-bold text-brand-sky uppercase tracking-widest">
                    Paid
                  </p>
                  <p className="text-xl font-semibold mt-1 text-brand-success">
                    {formatNaira(invoice.paidAmount)}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs font-bold text-brand-sky uppercase tracking-widest">
                    Outstanding
                  </p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      invoice.outstanding > 0
                        ? "text-rose-400"
                        : "text-brand-cyan-light"
                    }`}
                  >
                    {formatNaira(invoice.outstanding)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                {canRecordPayment && !showPaymentForm && (
                  <button
                    onClick={openPaymentForm}
                    className="w-full bg-brand-success hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-success/30"
                  >
                    Record Payment
                  </button>
                )}

                {invoice.status === "PAID" && (
                  <div className="w-full text-center bg-brand-success/10 text-brand-success text-sm font-semibold px-4 py-2.5 rounded-lg">
                    ✓ Fully Paid
                  </div>
                )}

                {invoice.status === "CANCELLED" && (
                  <div className="w-full text-center bg-slate-100 text-slate-500 text-sm font-semibold px-4 py-2.5 rounded-lg">
                    Invoice Cancelled
                  </div>
                )}

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full text-sm font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling…" : "Cancel Invoice"}
                  </button>
                )}

                {invoice.paidAmount > 0 && invoice.status !== "PAID" && (
                  <p className="text-xs text-brand-navy/50 text-center pt-2 leading-relaxed">
                    Cannot cancel: payments already recorded
                  </p>
                )}
              </div>
            </div>

            {/* Payment form */}
            {showPaymentForm && (
              <div className="bg-white rounded-2xl border-2 border-brand-success/40 shadow-md p-6">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-brand-success" />
                  Record Payment
                </h3>

                <form onSubmit={handleRecordPayment} className="space-y-4">
                  {paymentError && (
                    <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                      {paymentError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Amount (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input"
                    />
                    <p className="text-[10px] text-brand-navy/60 mt-1">
                      Max: {formatNaira(invoice.outstanding)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={method}
                      onChange={(e) =>
                        setMethod(
                          e.target.value as
                            | "CASH"
                            | "CARD"
                            | "TRANSFER"
                            | "OTHER"
                        )
                      }
                      className="input"
                    >
                      {PAYMENT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Reference (optional)
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="input"
                      placeholder="e.g. card txn ID"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      className="input"
                      placeholder="Any notes about this payment"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-brand-success hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-success/30 disabled:opacity-60"
                    >
                      {submitting ? "Recording…" : "Confirm Payment"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPaymentForm(false)}
                      disabled={submitting}
                      className="w-full text-xs font-semibold text-brand-navy/60 hover:text-brand-navy transition py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-3">
                Details
              </h3>
              <dl className="space-y-2 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-navy/60">Invoice No.</dt>
                  <dd className="font-mono font-semibold text-brand-navy">
                    {invoice.invoiceNo}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-navy/60">Issued</dt>
                  <dd className="font-semibold text-brand-navy">
                    {formatDate(invoice.createdAt)}
                  </dd>
                </div>
                {invoice.dueDate && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-brand-navy/60">Due</dt>
                    <dd className="font-semibold text-brand-navy">
                      {formatDate(invoice.dueDate)}
                    </dd>
                  </div>
                )}
                {invoice.createdBy && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-brand-navy/60">Created by</dt>
                    <dd className="font-semibold text-brand-navy text-right">
                      {invoice.createdBy.fullName}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
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