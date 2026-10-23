"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Staff = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST";
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
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

export default function StaffDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetch(`/api/staff/${id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");
        return data;
      })
      .then((data) => {
        if (!cancelled) setStaff(data.user);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not load staff.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatDateTime(iso: string | null) {
    if (!iso) return "Never";
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <div className="h-4 w-32 bg-brand-cyan rounded animate-pulse mb-2" />
          <div className="h-6 w-56 bg-brand-cyan rounded animate-pulse" />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
            <div className="h-72 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  if (error || !staff) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/staff"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Staff
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">Staff Member</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 p-12 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              {error || "Staff member not found"}
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6">
              The staff member you're looking for doesn't exist or you don't
              have access to it.
            </p>
            <Link
              href="/dashboard/staff"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
            >
              Back to Staff
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
          href="/dashboard/staff"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-2"
        >
          ← Back to Staff
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-brand-cyan flex items-center justify-center text-lg font-bold text-brand-navy flex-shrink-0">
              {staff.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-navy">
                {staff.fullName}
              </h2>
              <p className="text-xs text-brand-navy/60">{staff.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                ROLE_STYLES[staff.role]
              }`}
            >
              {ROLE_LABELS[staff.role]}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                staff.isActive
                  ? "text-brand-success bg-brand-success/10"
                  : "text-rose-600 bg-rose-50"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  staff.isActive ? "bg-brand-success" : "bg-rose-500"
                }`}
              />
              {staff.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-brand-accent" />
                Contact Information
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Row label="Full Name" value={staff.fullName} />
                <Row label="Email" value={staff.email} />
                <Row label="Phone" value={staff.phone || "—"} />
                <Row label="Role" value={ROLE_LABELS[staff.role]} />
              </dl>
            </div>

            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-brand-success" />
                Account Activity
              </h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Row label="Joined" value={formatDate(staff.createdAt)} />
                <Row
                  label="Last Login"
                  value={formatDateTime(staff.lastLoginAt)}
                />
                <Row
                  label="Last Updated"
                  value={formatDate(staff.updatedAt)}
                />
                <Row label="Status" value={staff.isActive ? "Active" : "Inactive"} />
              </dl>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            <div className="bg-brand-navy text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10" />
              <div className="relative">
                <p className="text-xs font-bold text-brand-sky uppercase tracking-widest mb-4">
                  At a Glance
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-brand-cyan-light/70">Role</span>
                    <span className="font-semibold">
                      {ROLE_LABELS[staff.role]}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-brand-cyan-light/70">Status</span>
                    <span className="font-semibold">
                      {staff.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-brand-cyan-light/70">Joined</span>
                    <span className="font-semibold text-right">
                      {formatDate(staff.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Edit details", disabled: true },
                  { label: "Reset password", disabled: true },
                  { label: "Deactivate account", disabled: true },
                ].map((action) => (
                  <button
                    key={action.label}
                    disabled={action.disabled}
                    className="w-full text-left text-sm font-medium px-4 py-2.5 rounded-lg border border-brand-cyan text-brand-navy/40 cursor-not-allowed bg-brand-cyan-light/30"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-brand-navy/50 mt-3 text-center uppercase tracking-wide">
                Coming soon
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide mb-1">
        {label}
      </dt>
      <dd className="text-sm text-brand-navy">{value}</dd>
    </div>
  );
}