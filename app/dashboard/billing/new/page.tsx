"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  phone: string;
};

type LineItem = {
  key: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
};

const CATEGORIES = [
  { value: "CONSULTATION", label: "Consultation" },
  { value: "TEST", label: "Lab / Test" },
  { value: "ADMISSION", label: "Admission" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "PROCEDURE", label: "Procedure" },
  { value: "OTHER", label: "Other" },
];

function makeKey() {
  return Math.random().toString(36).substring(2, 10);
}

function newItem(): LineItem {
  return {
    key: makeKey(),
    description: "",
    category: "CONSULTATION",
    quantity: 1,
    unitPrice: 0,
  };
}

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [patientId, setPatientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([newItem()]);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load patients
  useEffect(() => {
    fetch("/api/patients")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setPatients(d.data ?? []))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, []);

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  function removeItem(key: string) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((i) => i.key !== key)
    );
  }

  function addItem() {
    setItems((prev) => [...prev, newItem()]);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!patientId) errs.patientId = "Please select a patient";

    items.forEach((item, idx) => {
      if (!item.description.trim()) {
        errs[`item-${idx}-description`] = "Description is required";
      }
      if (item.quantity <= 0) {
        errs[`item-${idx}-quantity`] = "Quantity must be at least 1";
      }
      if (item.unitPrice < 0) {
        errs[`item-${idx}-unitPrice`] = "Price cannot be negative";
      }
    });

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
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
          items: items.map((i) => ({
            description: i.description.trim(),
            category: i.category,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fe: Record<string, string> = {};
          for (const e of data.errors) fe[e.field] = e.message;
          setFieldErrors(fe);
        }
        setError(data.message || "Could not create invoice.");
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/billing/${data.invoice.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  // If no patients exist, block with a friendly message
  if (!loadingPatients && patients.length === 0) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/billing"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Billing
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">New Invoice</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-10 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              No patients yet
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6">
              You need at least one patient before you can create an invoice.
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

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
        >
          ← Back to Billing
        </Link>
        <h2 className="text-lg font-bold text-brand-navy">Create New Invoice</h2>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-8"
        >
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
              {error}
            </div>
          )}

          {/* PATIENT + DUE DATE */}
          <Section title="Invoice Details" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Field label="Patient" required error={fieldErrors.patientId}>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="input"
                disabled={loadingPatients}
              >
                <option value="">
                  {loadingPatients ? "Loading patients…" : "Select patient…"}
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.patientCode}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Due Date (optional)">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input"
              />
            </Field>
          </div>

          {/* LINE ITEMS */}
          <Section title="Line Items" />

          <div className="space-y-3 mb-4">
            {items.map((item, idx) => (
              <div
                key={item.key}
                className="border border-brand-cyan rounded-lg p-4 bg-brand-cyan-light/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Description */}
                  <div className="md:col-span-5">
                    <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.key, {
                          description: e.target.value,
                        })
                      }
                      className="input"
                      placeholder="e.g. Consultation, CBC test, etc."
                    />
                    {fieldErrors[`item-${idx}-description`] && (
                      <p className="text-xs text-red-600 mt-1 font-medium">
                        {fieldErrors[`item-${idx}-description`]}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                      Category
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) =>
                        updateItem(item.key, { category: e.target.value })
                      }
                      className="input"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                      Qty
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.key, {
                          quantity: Math.max(
                            1,
                            parseInt(e.target.value, 10) || 1
                          ),
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                      Unit Price (₦)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateItem(item.key, {
                          unitPrice: Math.max(
                            0,
                            parseFloat(e.target.value) || 0
                          ),
                        })
                      }
                      className="input"
                    />
                  </div>

                  {/* Remove */}
                  <div className="md:col-span-1 flex md:items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      disabled={items.length === 1}
                      className="w-full md:w-auto text-xs font-semibold text-rose-600 hover:text-rose-700 transition disabled:opacity-30 disabled:cursor-not-allowed py-2.5"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-right text-xs text-brand-navy/70">
                  Subtotal:{" "}
                  <span className="font-semibold text-brand-navy">
                    {formatNaira(item.quantity * item.unitPrice)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:text-brand-navy transition mb-6"
          >
            <span className="text-base leading-none">+</span>
            <span>Add another item</span>
          </button>

          {/* NOTES */}
          <Section title="Notes (optional)" />

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Any additional information about this invoice…"
            />
          </Field>

          {/* TOTAL */}
          <div className="mt-8 bg-brand-navy text-white rounded-xl p-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-brand-cyan-light/90 uppercase tracking-widest">
              Total Amount
            </span>
            <span className="text-3xl font-bold">{formatNaira(total)}</span>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-brand-cyan">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white font-semibold px-6 py-3 rounded-lg transition shadow-md shadow-brand-accent/30 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Invoice"}
            </button>
            <Link
              href="/dashboard/billing"
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
        .input:disabled {
          background: #f1f5f9;
          cursor: not-allowed;
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