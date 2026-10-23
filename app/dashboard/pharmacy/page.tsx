"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Drug = {
  id: string;
  name: string;
  genericName: string | null;
  form: string;
  strength: string | null;
  category: string | null;
  sellingPrice: number;
  costPrice: number;
  reorderLevel: number;
  totalStock: number;
  isLowStock: boolean;
  expiringSoon: number;
  expired: number;
  batchCount: number;
  createdAt: string;
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

export default function PharmacyPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (searchTerm) params.set("q", searchTerm);
    if (filterCategory) params.set("category", filterCategory);
    if (filterLowStock) params.set("lowStock", "true");

    const url = `/api/drugs${params.toString() ? `?${params}` : ""}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setDrugs(data.drugs ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load drug catalog.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchTerm, filterCategory, filterLowStock]);

  // Collect unique categories for the dropdown
  const categories = Array.from(
    new Set(drugs.map((d) => d.category).filter(Boolean) as string[])
  ).sort();

  const lowStockCount = drugs.filter((d) => d.isLowStock).length;
  const expiringCount = drugs.filter((d) => d.expiringSoon > 0).length;
  const expiredCount = drugs.filter((d) => d.expired > 0).length;

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Pharmacy</h2>
          <p className="text-xs text-brand-navy/60">
            {drugs.length} {drugs.length === 1 ? "drug" : "drugs"} in catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/pharmacy/prescriptions"
            className="hidden sm:inline-flex items-center gap-2 bg-white hover:bg-brand-cyan-light text-brand-navy text-sm font-semibold px-4 py-2.5 rounded-lg border border-brand-sky transition"
          >
            Prescriptions
          </Link>
          <Link
            href="/dashboard/pharmacy/new"
            className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Drug</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {/* Alert cards */}
        {(lowStockCount > 0 || expiringCount > 0 || expiredCount > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {lowStockCount > 0 && (
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                  ⚠ Low Stock
                </p>
                <p className="text-2xl font-bold text-amber-800 mt-1">
                  {lowStockCount}
                </p>
                <p className="text-xs text-amber-700/80 mt-1">
                  {lowStockCount === 1 ? "drug needs" : "drugs need"}{" "}
                  restocking
                </p>
              </div>
            )}
            {expiringCount > 0 && (
              <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">
                  ⏰ Expiring Soon
                </p>
                <p className="text-2xl font-bold text-orange-800 mt-1">
                  {expiringCount}
                </p>
                <p className="text-xs text-orange-700/80 mt-1">
                  {expiringCount === 1 ? "drug has" : "drugs have"} batches
                  expiring within 30 days
                </p>
              </div>
            )}
            {expiredCount > 0 && (
              <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">
                  ✕ Expired
                </p>
                <p className="text-2xl font-bold text-rose-800 mt-1">
                  {expiredCount}
                </p>
                <p className="text-xs text-rose-700/80 mt-1">
                  {expiredCount === 1 ? "drug has" : "drugs have"} expired
                  batches
                </p>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-1.5">
                Search
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, generic name, or category…"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-1.5">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 mt-3 text-sm text-brand-navy/80 cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              className="h-4 w-4 accent-[#4AA9E8] rounded"
            />
            Show only low-stock drugs
          </label>
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
        ) : drugs.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-14 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">💊</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-1">
              {searchTerm || filterCategory || filterLowStock
                ? "No drugs match"
                : "No drugs in catalog yet"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6 max-w-md mx-auto">
              {searchTerm || filterCategory || filterLowStock
                ? "Try adjusting your filters or search."
                : "Add your first drug to start tracking pharmacy inventory."}
            </p>
            {!searchTerm && !filterCategory && !filterLowStock && (
              <Link
                href="/dashboard/pharmacy/new"
                className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
              >
                <span className="text-base leading-none">+</span>
                <span>Add First Drug</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-sky/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                    <th className="px-6 py-3">Drug</th>
                    <th className="px-6 py-3">Form</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">Price</th>
                    <th className="px-6 py-3 text-right">Stock</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {drugs.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-brand-cyan/50 hover:bg-brand-cyan-light/40 transition"
                    >
                      <td className="px-6 py-4">
                        <p className="font-semibold text-brand-navy">
                          {d.name}
                          {d.strength && (
                            <span className="text-brand-navy/60 font-normal">
                              {" "}
                              {d.strength}
                            </span>
                          )}
                        </p>
                        {d.genericName && (
                          <p className="text-xs text-brand-navy/60">
                            {d.genericName}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-brand-navy/80 text-xs">
                        {FORM_LABELS[d.form] || d.form}
                      </td>
                      <td className="px-6 py-4 text-brand-navy/80 text-xs">
                        {d.category || "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-brand-navy font-semibold">
                        {formatNaira(d.sellingPrice)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p
                          className={`font-semibold ${
                            d.isLowStock
                              ? "text-amber-600"
                              : "text-brand-navy"
                          }`}
                        >
                          {d.totalStock}
                        </p>
                        <p className="text-[10px] text-brand-navy/50">
                          {d.batchCount}{" "}
                          {d.batchCount === 1 ? "batch" : "batches"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {d.isLowStock && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              LOW
                            </span>
                          )}
                          {d.expiringSoon > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                              EXPIRING
                            </span>
                          )}
                          {d.expired > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              EXPIRED
                            </span>
                          )}
                          {!d.isLowStock &&
                            d.expiringSoon === 0 &&
                            d.expired === 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-success/10 text-brand-success border border-brand-success/30">
                                OK
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/pharmacy/${d.id}`}
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