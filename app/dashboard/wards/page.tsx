"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Bed = {
  id: string;
  bedNumber: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
};

type Ward = {
  id: string;
  name: string;
  floor: string | null;
  capacity: number;
  createdAt: string;
  beds: Bed[];
  stats: {
    total: number;
    available: number;
    occupied: number;
    maintenance: number;
  };
};

export default function WardsListPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/wards")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load wards");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setWards(data.wards ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load wards.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalBeds = wards.reduce((s, w) => s + w.stats.total, 0);
  const totalOccupied = wards.reduce((s, w) => s + w.stats.occupied, 0);
  const totalAvailable = wards.reduce((s, w) => s + w.stats.available, 0);
  const occupancyPct =
    totalBeds > 0 ? Math.round((totalOccupied / totalBeds) * 100) : 0;

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Wards & Beds</h2>
          <p className="text-xs text-brand-navy/60">
            {wards.length} {wards.length === 1 ? "ward" : "wards"} ·{" "}
            {totalBeds} {totalBeds === 1 ? "bed" : "beds"} total
          </p>
        </div>
        <Link
          href="/dashboard/wards/new"
          className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
        >
          <span className="text-base leading-none">+</span>
          <span>New Ward</span>
        </Link>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {/* Summary cards */}
        {!loading && wards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
            <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5">
              <div className="h-1.5 w-12 rounded-full bg-brand-accent mb-3" />
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                Total Beds
              </p>
              <p className="text-3xl font-bold text-brand-navy mt-1">
                {totalBeds}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5">
              <div className="h-1.5 w-12 rounded-full bg-brand-success mb-3" />
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                Available
              </p>
              <p className="text-3xl font-bold text-brand-success mt-1">
                {totalAvailable}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5">
              <div className="h-1.5 w-12 rounded-full bg-amber-400 mb-3" />
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                Occupied
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {totalOccupied}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5">
              <div className="h-1.5 w-12 rounded-full bg-purple-500 mb-3" />
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                Occupancy
              </p>
              <p className="text-3xl font-bold text-brand-navy mt-1">
                {occupancyPct}%
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 bg-white rounded-xl border border-brand-sky/40 animate-pulse"
              />
            ))}
          </div>
        ) : wards.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-14 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🛏️</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-1">
              No wards yet
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6 max-w-md mx-auto">
              Create your first ward to start managing beds and admissions.
            </p>
            <Link
              href="/dashboard/wards/new"
              className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
            >
              <span className="text-base leading-none">+</span>
              <span>Create First Ward</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {wards.map((ward) => {
              const pct =
                ward.stats.total > 0
                  ? Math.round(
                      (ward.stats.occupied / ward.stats.total) * 100
                    )
                  : 0;

              return (
                <Link
                  key={ward.id}
                  href={`/dashboard/wards/${ward.id}`}
                  className="bg-white rounded-xl border border-brand-sky/40 shadow-sm hover:shadow-lg hover:border-brand-accent transition p-6"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="text-lg font-bold text-brand-navy truncate">
                      {ward.name}
                    </h3>
                    <span className="text-xs font-semibold text-brand-navy/60 whitespace-nowrap ml-2">
                      {pct}%
                    </span>
                  </div>
                  {ward.floor && (
                    <p className="text-xs text-brand-navy/60 mb-4">
                      {ward.floor}
                    </p>
                  )}

                  {/* Occupancy bar */}
                  <div className="h-2 bg-brand-cyan rounded-full overflow-hidden mb-5">
                    <div
                      className="h-full bg-brand-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-wide">
                        Total
                      </p>
                      <p className="text-lg font-bold text-brand-navy">
                        {ward.stats.total}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-wide">
                        Free
                      </p>
                      <p className="text-lg font-bold text-brand-success">
                        {ward.stats.available}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-wide">
                        Used
                      </p>
                      <p className="text-lg font-bold text-amber-600">
                        {ward.stats.occupied}
                      </p>
                    </div>
                  </div>

                  {ward.stats.maintenance > 0 && (
                    <p className="text-[10px] text-brand-navy/50 mt-3 text-center">
                      {ward.stats.maintenance} bed
                      {ward.stats.maintenance === 1 ? "" : "s"} under
                      maintenance
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
} 