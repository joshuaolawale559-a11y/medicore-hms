"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const FORMS = [
  { value: "TABLET", label: "Tablet" },
  { value: "CAPSULE", label: "Capsule" },
  { value: "SYRUP", label: "Syrup" },
  { value: "INJECTION", label: "Injection" },
  { value: "CREAM", label: "Cream" },
  { value: "OINTMENT", label: "Ointment" },
  { value: "DROPS", label: "Drops" },
  { value: "INHALER", label: "Inhaler" },
  { value: "SUPPOSITORY", label: "Suppository" },
  { value: "OTHER", label: "Other" },
];

export default function NewDrugPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [genericName, setGenericName] = useState("");
  const [form, setForm] = useState("TABLET");
  const [strength, setStrength] = useState("");
  const [category, setCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [reorderLevel, setReorderLevel] = useState("10");
  const [description, setDescription] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({ name: "Drug name is required" });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/drugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          genericName: genericName.trim() || undefined,
          form,
          strength: strength.trim() || undefined,
          category: category.trim() || undefined,
          manufacturer: manufacturer.trim() || undefined,
          sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
          costPrice: costPrice ? parseFloat(costPrice) : 0,
          reorderLevel: reorderLevel ? parseInt(reorderLevel, 10) : 10,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fe: Record<string, string> = {};
          for (const e of data.errors) fe[e.field] = e.message;
          setFieldErrors(fe);
        }
        setError(data.message || "Could not add drug.");
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/pharmacy/${data.drug.id}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/pharmacy"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
        >
          ← Back to Pharmacy
        </Link>
        <h2 className="text-lg font-bold text-brand-navy">Add New Drug</h2>
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

          <Section title="Drug Details" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <Field label="Drug Name" required error={fieldErrors.name}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g. Paracetamol"
              />
            </Field>

            <Field label="Generic Name">
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                className="input"
                placeholder="e.g. Acetaminophen"
              />
            </Field>

            <Field label="Form">
              <select
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="input"
              >
                {FORMS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Strength">
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="input"
                placeholder="e.g. 500mg, 5mg/ml"
              />
            </Field>

            <Field label="Category">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                placeholder="e.g. Analgesic, Antibiotic"
              />
            </Field>

            <Field label="Manufacturer">
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="input"
                placeholder="e.g. GSK, Emzor"
              />
            </Field>
          </div>

          <Section title="Pricing & Stock" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <Field label="Selling Price (₦)">
              <input
                type="number"
                step="0.01"
                min={0}
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="input"
                placeholder="0.00"
              />
            </Field>

            <Field label="Cost Price (₦)">
              <input
                type="number"
                step="0.01"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="input"
                placeholder="0.00"
              />
            </Field>

            <Field label="Reorder Level">
              <input
                type="number"
                min={0}
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="input"
                placeholder="10"
              />
            </Field>
          </div>

          <Section title="Notes" />

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Any additional information about this drug…"
            />
          </Field>

          <div className="bg-brand-cyan-light/60 border border-brand-sky/40 rounded-lg p-4 mt-6 mb-8">
            <p className="text-xs text-brand-navy/80 leading-relaxed">
              <strong className="text-brand-navy">Note:</strong> Adding a drug
              only creates the catalog entry. After saving, you'll add physical
              stock (batches with expiry dates) on the drug's detail page.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-brand-cyan">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white font-semibold px-6 py-3 rounded-lg transition shadow-md shadow-brand-accent/30 disabled:opacity-60"
            >
              {submitting ? "Adding…" : "Add Drug"}
            </button>
            <Link
              href="/dashboard/pharmacy"
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