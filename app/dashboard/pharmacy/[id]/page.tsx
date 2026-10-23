 "use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Batch = {
  id: string;
  batchNumber: string;
  quantity: number;
  initialQty: number;
  expiryDate: string;
  receivedAt: string;
  supplierName: string | null;
  notes: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
};

type Drug = {
  id: string;
  name: string;
  genericName: string | null;
  form: string;
  strength: string | null;
  category: string | null;
  manufacturer: string | null;
  sellingPrice: number;
  costPrice: number;
  reorderLevel: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  batches: Batch[];
  totalStock: number;
  isLowStock: boolean;
};

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

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DrugDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [drug, setDrug] = useState<Drug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add batch form
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [batchNumber, setBatchNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [batchNotes, setBatchNotes] = useState("");
  const [batchError, setBatchError] = useState("");
  const [addingBatch, setAddingBatch] = useState(false);

  async function loadDrug() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/drugs/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setDrug(data.drug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load drug.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrug();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault();
    setBatchError("");

    if (!batchNumber.trim()) {
      setBatchError("Batch number is required.");
      return;
    }
    if (!quantity || parseInt(quantity, 10) <= 0) {
      setBatchError("Quantity must be a positive number.");
      return;
    }
    if (!expiryDate) {
      setBatchError("Expiry date is required.");
      return;
    }

    setAddingBatch(true);

    try {
      const res = await fetch(`/api/drugs/${id}/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchNumber: batchNumber.trim(),
          quantity: parseInt(quantity, 10),
          expiryDate,
          supplierName: supplierName.trim() || undefined,
          notes: batchNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBatchError(data.message || "Could not add batch.");
        setAddingBatch(false);
        return;
      }

      // Reset form and reload
      setBatchNumber("");
      setQuantity("");
      setExpiryDate("");
      setSupplierName("");
      setBatchNotes("");
      setShowAddBatch(false);
      setAddingBatch(false);
      await loadDrug();
    } catch {
      setBatchError("Could not reach the server.");
      setAddingBatch(false);
    }
  }

  // ---- Loading ----
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
  if (error || !drug) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/pharmacy"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Pharmacy
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">Drug</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 p-12 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              {error || "Drug not found"}
            </h3>
            <Link
              href="/dashboard/pharmacy"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30 mt-4"
            >
              Back to Pharmacy
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
          href="/dashboard/pharmacy"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-2"
        >
          ← Back to Pharmacy
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">
              {drug.name}
              {drug.strength && (
                <span className="text-brand-navy/60 font-normal">
                  {" "}
                  {drug.strength}
                </span>
              )}
            </h2>
            <p className="text-xs text-brand-navy/60 mt-0.5">
              {drug.genericName && `${drug.genericName} · `}
              {FORM_LABELS[drug.form] || drug.form}
              {drug.category && ` · ${drug.category}`}
            </p>
          </div>
          <button
            onClick={() => setShowAddBatch((s) => !s)}
            className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Stock</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Add batch form */}
            {showAddBatch && (
              <form
                onSubmit={handleAddBatch}
                className="bg-white rounded-2xl border-2 border-brand-accent/40 shadow-md p-6"
              >
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-brand-accent" />
                  Add New Stock Batch
                </h3>

                {batchError && (
                  <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-4">
                    {batchError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Batch Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="input"
                      placeholder="e.g. LOT-2026-001"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="input"
                      placeholder="e.g. 100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="input"
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Supplier (optional)
                    </label>
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="input"
                      placeholder="e.g. MedSupply Co."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-brand-navy mb-1.5">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      value={batchNotes}
                      onChange={(e) => setBatchNotes(e.target.value)}
                      className="input"
                      placeholder="Any notes about this batch"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-brand-cyan">
                  <button
                    type="submit"
                    disabled={addingBatch}
                    className="inline-flex items-center justify-center bg-brand-success hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-success/30 disabled:opacity-60"
                  >
                    {addingBatch ? "Adding…" : "Add to Stock"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBatch(false);
                      setBatchError("");
                    }}
                    disabled={addingBatch}
                    className="inline-flex items-center justify-center bg-brand-cyan-light hover:bg-brand-cyan text-brand-navy text-sm font-semibold px-5 py-2.5 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Batches */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm overflow-hidden">
              <div className="p-6 pb-0">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-brand-success" />
                  Stock Batches ({drug.batches.length})
                </h3>
                <p className="text-xs text-brand-navy/60 mb-4">
                  Listed in FEFO order — earliest expiry first. This is the
                  order stock is used when dispensing.
                </p>
              </div>

              {drug.batches.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-brand-cyan-light mx-auto mb-3 flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                  <p className="text-sm text-brand-navy/70 mb-4">
                    No stock batches yet.
                  </p>
                  <button
                    onClick={() => setShowAddBatch(true)}
                    className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2 rounded-lg transition shadow-md shadow-brand-accent/30"
                  >
                    + Add First Batch
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                        <th className="px-6 py-3">Batch No.</th>
                        <th className="px-6 py-3">Supplier</th>
                        <th className="px-6 py-3">Expiry</th>
                        <th className="px-6 py-3 text-right">Remaining</th>
                        <th className="px-6 py-3 text-right">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drug.batches.map((b) => (
                        <tr
                          key={b.id}
                          className={`border-t border-brand-cyan/50 ${
                            b.isExpired
                              ? "bg-rose-50/40"
                              : b.isExpiringSoon
                              ? "bg-amber-50/40"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-3 font-mono text-xs text-brand-navy">
                            {b.batchNumber}
                          </td>
                          <td className="px-6 py-3 text-brand-navy/70 text-xs">
                            {b.supplierName || "—"}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-brand-navy">
                                {formatDate(b.expiryDate)}
                              </span>
                              {b.isExpired && (
                                <span className="text-[9px] font-bold uppercase text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.5 rounded">
                                  Expired
                                </span>
                              )}
                              {!b.isExpired && b.isExpiringSoon && (
                                <span className="text-[9px] font-bold uppercase text-orange-700 bg-orange-100 border border-orange-200 px-1.5 py-0.5 rounded">
                                  Soon
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span
                              className={`font-bold ${
                                b.quantity === 0
                                  ? "text-brand-navy/40"
                                  : b.isExpired
                                  ? "text-rose-600"
                                  : "text-brand-navy"
                              }`}
                            >
                              {b.quantity}
                            </span>
                            <span className="text-xs text-brand-navy/50 ml-1">
                              / {b.initialQty}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-xs text-brand-navy/60 text-right">
                            {formatDate(b.receivedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-brand-navy/20">
                        <td
                          colSpan={3}
                          className="px-6 py-4 text-right text-xs font-bold text-brand-navy uppercase tracking-wide"
                        >
                          Total in Stock
                        </td>
                        <td className="px-6 py-4 text-right text-lg font-bold text-brand-navy">
                          {drug.totalStock}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Description */}
            {drug.description && (
              <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-amber-400" />
                  Description
                </h3>
                <p className="text-sm text-brand-navy/80 leading-relaxed whitespace-pre-wrap">
                  {drug.description}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Stock summary */}
            <div
              className={`rounded-2xl p-6 shadow-lg relative overflow-hidden text-white ${
                drug.isLowStock ? "bg-amber-600" : "bg-brand-navy"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5" />
              <div className="relative space-y-4">
                <div>
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                    Total Stock
                  </p>
                  <p className="text-4xl font-bold mt-1">{drug.totalStock}</p>
                  {drug.isLowStock && (
                    <p className="text-xs font-bold text-white/90 mt-1">
                      ⚠ Below reorder level ({drug.reorderLevel})
                    </p>
                  )}
                </div>
                <div className="pt-3 border-t border-white/20">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                    Reorder Level
                  </p>
                  <p className="text-xl font-semibold mt-1">
                    {drug.reorderLevel}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/20">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-widest">
                    Batches
                  </p>
                  <p className="text-xl font-semibold mt-1">
                    {drug.batches.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
                Pricing
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-navy/60">Selling Price</dt>
                  <dd className="font-bold text-brand-navy">
                    {formatNaira(drug.sellingPrice)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-navy/60">Cost Price</dt>
                  <dd className="font-semibold text-brand-navy">
                    {formatNaira(drug.costPrice)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-navy/60">Margin</dt>
                  <dd
                    className={`font-semibold ${
                      drug.sellingPrice > drug.costPrice
                        ? "text-brand-success"
                        : "text-brand-navy/60"
                    }`}
                  >
                    {formatNaira(drug.sellingPrice - drug.costPrice)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Metadata */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-3">
                Details
              </h3>
              <dl className="space-y-2 text-xs">
                {drug.manufacturer && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-brand-navy/60">Manufacturer</dt>
                    <dd className="font-semibold text-brand-navy text-right">
                      {drug.manufacturer}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-navy/60">Category</dt>
                  <dd className="font-semibold text-brand-navy">
                    {drug.category || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-navy/60">Added</dt>
                  <dd className="font-semibold text-brand-navy">
                    {formatDate(drug.createdAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-brand-navy/60">Status</dt>
                  <dd
                    className={`font-semibold ${
                      drug.isActive
                        ? "text-brand-success"
                        : "text-rose-600"
                    }`}
                  >
                    {drug.isActive ? "Active" : "Inactive"}
                  </dd>
                </div>
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
      `}</style>
    </>
  );
}