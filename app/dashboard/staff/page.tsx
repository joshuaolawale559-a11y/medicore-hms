"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Staff = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

const ROLE_LABELS: Record<Staff["role"], string> = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  RECEPTIONIST: "Receptionist",
  PHARMACIST: "Pharmacist",
};

const ROLE_STYLES: Record<Staff["role"], string> = {
  ADMIN: "bg-purple-50 text-purple-700 border-purple-200",
  DOCTOR: "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
  NURSE: "bg-rose-50 text-rose-700 border-rose-200",
  RECEPTIONIST: "bg-amber-50 text-amber-700 border-amber-200",
  PHARMACIST: "bg-brand-success/15 text-brand-success border-brand-success/30",
};

export default function StaffListPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");

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
    if (filterRole) params.set("role", filterRole);

    const url = `/api/staff${params.toString() ? `?${params}` : ""}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load staff");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setStaff(data.staff ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load staff.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchTerm, filterRole]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatLastLogin(iso: string | null) {
    if (!iso) return "Never";
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-brand-navy">Staff</h2>
          <p className="text-xs text-brand-navy/60">
            {staff.length} {staff.length === 1 ? "member" : "members"} in your
            hospital
          </p>
        </div>
        <Link
          href="/dashboard/staff/new"
          className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
        >
          <span className="text-base leading-none">+</span>
          <span>Add Staff</span>
        </Link>
      </header>

      <main className="flex-1 p-8 overflow-auto">
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
                placeholder="Search by name, email, or phone…"
                className="input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-navy/70 uppercase tracking-wide mb-1.5">
                Role
              </label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="input"
              >
                <option value="">All roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="DOCTOR">Doctor</option>
                <option value="NURSE">Nurse</option>
                <option value="RECEPTIONIST">Receptionist</option>
                <option value="PHARMACIST">Pharmacist</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-4 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 bg-brand-cyan-light/60 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-14 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-1">
              No staff found
            </h3>
            <p className="text-sm text-brand-navy/70 max-w-sm mx-auto">
              Try a different search or filter, or add a new staff member.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-brand-sky/40 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Contact</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Last Login</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-brand-cyan/50 hover:bg-brand-cyan-light/40 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-cyan flex items-center justify-center text-xs font-bold text-brand-navy flex-shrink-0">
                            {s.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-brand-navy truncate flex items-center gap-2">
                              {s.fullName}
                              {!s.isActive && (
                                <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                  Inactive
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-brand-navy/60 truncate">
                              {s.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-brand-navy/80">
                        {s.phone || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            ROLE_STYLES[s.role]
                          }`}
                        >
                          {ROLE_LABELS[s.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/60">
                        {formatLastLogin(s.lastLoginAt)}
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/60">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/staff/${s.id}`}
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