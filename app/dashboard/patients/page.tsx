"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Patient = {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string | null;
  bloodGroup: string | null;
  createdAt: string;
};

export default function PatientsListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Debounce search — wait 300ms after typing stops
  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch whenever the search term changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const url = searchTerm
      ? `/api/patients?q=${encodeURIComponent(searchTerm)}`
      : "/api/patients";

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load patients");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setPatients(data.data ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load patients.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function ageFrom(dobIso: string) {
    const dob = new Date(dobIso);
    const diff = Date.now() - dob.getTime();
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    return years;
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-brand-cyan px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Patients</h2>
          <p className="text-xs text-brand-navy/60">
            {total} {total === 1 ? "patient" : "patients"} registered in your
            hospital
          </p>
        </div>

        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
        >
          <span className="text-base leading-none">+</span>
          <span>Add Patient</span>
        </Link>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-navy/40 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, patient code, or phone…"
              className="w-full pl-10 pr-4 py-2.5 border border-brand-sky/60 rounded-lg bg-white text-sm text-brand-navy placeholder:text-brand-navy/40 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition"
            />
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
                  className="h-14 bg-brand-cyan-light/60 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-14 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-1">
              {searchTerm ? "No patients found" : "No patients yet"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6 max-w-sm mx-auto">
              {searchTerm
                ? "Try a different search term, or register a new patient."
                : "Register your first patient to start building your hospital's records."}
            </p>
            {!searchTerm && (
              <Link
                href="/dashboard/patients/new"
                className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
              >
                <span className="text-base leading-none">+</span>
                <span>Register First Patient</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-sky/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                    <th className="px-6 py-3">Patient</th>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3">Age / Gender</th>
                    <th className="px-6 py-3">Phone</th>
                    <th className="px-6 py-3">Blood</th>
                    <th className="px-6 py-3">Registered</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-brand-cyan/50 hover:bg-brand-cyan-light/40 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-cyan flex items-center justify-center text-xs font-bold text-brand-navy flex-shrink-0">
                            {p.firstName[0]}
                            {p.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-navy truncate">
                              {p.firstName} {p.lastName}
                            </p>
                            {p.email && (
                              <p className="text-xs text-brand-navy/60 truncate">
                                {p.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-brand-navy/80">
                        {p.patientCode}
                      </td>
                      <td className="px-6 py-4 text-brand-navy/80">
                        {ageFrom(p.dateOfBirth)}y · {p.gender}
                      </td>
                      <td className="px-6 py-4 text-brand-navy/80">
                        {p.phone}
                      </td>
                      <td className="px-6 py-4">
                        {p.bloodGroup ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                            {p.bloodGroup}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-navy/40">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/60">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/patients/${p.id}`}
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
    </>
  );
}