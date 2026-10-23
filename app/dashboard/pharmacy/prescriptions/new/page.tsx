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

type Drug = {
  id: string;
  name: string;
  genericName: string | null;
  form: string;
  strength: string | null;
  totalStock: number;
};

type LineItem = {
  key: string;
  drugId: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
};

function makeKey() {
  return Math.random().toString(36).substring(2, 10);
}

function newItem(): LineItem {
  return {
    key: makeKey(),
    drugId: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: 1,
    instructions: "",
  };
}

const FORM_LABELS: Record<string, string> = {
  TABLET: "Tablet",
  CAPSULE: "Capsule",
  SYRUP: "Syrup",
  INJECTION: "Injection",
  CREAM: "Cream",
  OINTMENT: "Ointment",
  DROPS: "Drops",
  INHALER: "Inhaler",
  SUPPOSITORY: "Suppository",
  OTHER: "Other",
};

export default function NewPrescriptionPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [patientId, setPatientId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([newItem()]);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Load patients + drugs in parallel
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/patients").then((r) => (r.ok ? r.json() : { data: [] })),
      fetch("/api/drugs").then((r) => (r.ok ? r.json() : { drugs: [] })),
    ])
      .then(([patientsRes, drugsRes]) => {
        if (cancelled) return;
        setPatients(patientsRes.data ?? []);
        setDrugs(drugsRes.drugs ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load patients or drugs.");
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
      if (!item.drugId) errs[`item-${idx}-drugId`] = "Select a drug";
      if (!item.dosage.trim())
        errs[`item-${idx}-dosage`] = "Dosage is required";
      if (!item.frequency.trim())
        errs[`item-${idx}-frequency`] = "Frequency is required";
      if (!item.duration.trim())
        errs[`item-${idx}-duration`] = "Duration is required";
      if (item.quantity <= 0)
        errs[`item-${idx}-quantity`] = "Quantity must be at least 1";
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
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          diagnosis: diagnosis.trim() || undefined,
          notes: notes.trim() || undefined,
          items: items.map((i) => ({
            drugId: i.drugId,
            dosage: i.dosage.trim(),
            frequency: i.frequency.trim(),
            duration: i.duration.trim(),
            quantity: i.quantity,
            instructions: i.instructions.trim() || undefined,
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
        setError(data.message || "Could not create prescription.");
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/pharmacy/prescriptions/${data.prescription.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  // Block if no patients or no drugs
  if (!loadingData && patients.length === 0) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/pharmacy/prescriptions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Prescriptions
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">New Prescription</h2>
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
              You need at least one registered patient before writing a
              prescription.
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

  if (!loadingData && drugs.length === 0) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/pharmacy/prescriptions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Prescriptions
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">New Prescription</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-10 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-amber-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">💊</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              No drugs in catalog
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6">
              Add drugs to the pharmacy catalog before writing prescriptions.
            </p>
            <Link
              href="/dashboard/pharmacy/new"
              className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
            >
              <span className="text-base leading-none">+</span>
              <span>Add First Drug</span>
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
          href="/dashboard/pharmacy/prescriptions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
        >
          ← Back to Prescriptions
        </Link>
        <h2 className="text-lg font-bold text-brand-navy">
          Write New Prescription
        </h2>
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

          {/* PATIENT + DIAGNOSIS */}
          <Section title="Patient & Diagnosis" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Field label="Patient" required error={fieldErrors.patientId}>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="input"
                disabled={loadingData}
              >
                <option value="">
                  {loadingData ? "Loading patients…" : "Select patient…"}
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.patientCode}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Diagnosis / Indication">
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="input"
                placeholder="e.g. Headache, Malaria, Cough"
              />
            </Field>
          </div>

          {/* LINE ITEMS */}
          <Section title="Prescribed Drugs" />

          <div className="space-y-4 mb-4">
            {items.map((item, idx) => {
              const selectedDrug = drugs.find((d) => d.id === item.drugId);

              return (
                <div
                  key={item.key}
                  className="border border-brand-cyan rounded-lg p-4 bg-brand-cyan-light/30"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-xs font-bold text-brand-navy/70 uppercase tracking-wide">
                      Drug #{idx + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      disabled={items.length === 1}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Remove drug"
                    >
                      ✕ Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Drug selector */}
                    <div className="md:col-span-12">
                      <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                        Drug <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={item.drugId}
                        onChange={(e) =>
                          updateItem(item.key, { drugId: e.target.value })
                        }
                        className="input"
                      >
                        <option value="">Select drug…</option>
                        {drugs.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                            {d.strength ? ` ${d.strength}` : ""} (
                            {FORM_LABELS[d.form] || d.form}) — {d.totalStock} in
                            stock
                          </option>
                        ))}
                      </select>
                      {fieldErrors[`item-${idx}-drugId`] && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {fieldErrors[`item-${idx}-drugId`]}
                        </p>
                      )}
                      {selectedDrug && selectedDrug.totalStock === 0 && (
                        <p className="text-xs text-amber-700 mt-1 font-medium">
                          ⚠ This drug has no stock. It can be prescribed, but
                          can't be dispensed until stock is added.
                        </p>
                      )}
                    </div>

                    {/* Dosage */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                        Dosage <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={(e) =>
                          updateItem(item.key, { dosage: e.target.value })
                        }
                        className="input"
                        placeholder="1 tablet, 5ml"
                      />
                      {fieldErrors[`item-${idx}-dosage`] && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {fieldErrors[`item-${idx}-dosage`]}
                        </p>
                      )}
                    </div>

                    {/* Frequency */}
                    <div className="md:col-span-4">
                      <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                        Frequency <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={(e) =>
                          updateItem(item.key, { frequency: e.target.value })
                        }
                        className="input"
                        placeholder="3 times daily"
                      />
                      {fieldErrors[`item-${idx}-frequency`] && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {fieldErrors[`item-${idx}-frequency`]}
                        </p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                        Duration <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) =>
                          updateItem(item.key, { duration: e.target.value })
                        }
                        className="input"
                        placeholder="5 days"
                      />
                      {fieldErrors[`item-${idx}-duration`] && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {fieldErrors[`item-${idx}-duration`]}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                        Qty <span className="text-red-500">*</span>
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
                      {fieldErrors[`item-${idx}-quantity`] && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          {fieldErrors[`item-${idx}-quantity`]}
                        </p>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="md:col-span-12">
                      <label className="block text-xs font-semibold text-brand-navy/70 mb-1">
                        Special Instructions (optional)
                      </label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) =>
                          updateItem(item.key, {
                            instructions: e.target.value,
                          })
                        }
                        className="input"
                        placeholder="e.g. Take after meals, Avoid alcohol"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-accent hover:text-brand-navy transition mb-6"
          >
            <span className="text-base leading-none">+</span>
            <span>Add another drug</span>
          </button>

          {/* NOTES */}
          <Section title="Additional Notes (optional)" />

          <Field label="Notes for the Pharmacist">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Any special instructions for the pharmacist…"
            />
          </Field>

          {/* ACTIONS */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-brand-cyan">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white font-semibold px-6 py-3 rounded-lg transition shadow-md shadow-brand-accent/30 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Save Prescription"}
            </button>
            <Link
              href="/dashboard/pharmacy/prescriptions"
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