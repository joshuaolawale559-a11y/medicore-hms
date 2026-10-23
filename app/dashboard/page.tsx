"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Role = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST";

type SessionUser = {
  id: string;
  fullName: string;
  role: Role;
  hospitalName?: string;
};

type AppointmentRow = {
  id: string;
  patientName: string;
  doctorName: string;
  department: string;
  time: string;
  date: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
};

type AdminSummary = {
  role: "ADMIN";
  totalPatients: number;
  totalDoctors: number;
  activeStaff: number;
  totalUsers: number;
  todayAppointments: number;
  totalRevenue: number;
  revenueToday: number;
  patientsThisWeek: number;
  patientDelta: number;
  pendingInvoices: number;
  recentAppointments: AppointmentRow[];
  dailyRevenue: { label: string; value: number }[];
};

type DoctorSummary = {
  role: "DOCTOR";
  myPatients: number;
  myAppointmentsToday: number;
  myUpcoming: AppointmentRow[];
  myRecent: AppointmentRow[];
};

type PharmacistSummary = {
  role: "PHARMACIST";
  pendingPrescriptions: number;
  dispensedToday: number;
  lowStockItems: number;
  totalDrugs: number;
  lowStockList: {
    id: string;
    name: string;
    strength: string | null;
    totalStock: number;
    reorderLevel: number;
  }[];
  recentPrescriptions: {
    id: string;
    prescriptionNo: string;
    patientName: string;
    doctorName: string;
    status: "PENDING" | "PARTIALLY_DISPENSED" | "DISPENSED" | "CANCELLED";
    itemCount: number;
    createdAt: string;
  }[];
};
type NurseSummary = {
  role: "NURSE";
  totalPatients: number;
  todayAppointments: number;
  wardOccupancy: number;
};

type ReceptionistSummary = {
  role: "RECEPTIONIST";
  totalPatients: number;
  todayAppointments: number;
  upcomingAppointments: number;
};

type Summary =
  | AdminSummary
  | DoctorSummary
  | PharmacistSummary
  | NurseSummary
  | ReceptionistSummary;

const ACCENTS = [
  "bg-brand-accent",
  "bg-brand-success",
  "bg-amber-400",
  "bg-purple-500",
];

const STATUS_STYLES: Record<AppointmentRow["status"], string> = {
  SCHEDULED: "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
  COMPLETED: "bg-brand-success/15 text-brand-success border-brand-success/30",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  NO_SHOW: "bg-amber-50 text-amber-700 border-amber-200",
};

const STATUS_LABELS: Record<AppointmentRow["status"], string> = {
  SCHEDULED: "Scheduled",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No-show",
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  RECEPTIONIST: "Receptionist",
  PHARMACIST: "Pharmacist",
};

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/auth/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/dashboard/summary").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([meData, summaryData]) => {
        if (cancelled) return;
        if (meData?.user) setUser(meData.user);
        if (summaryData) setSummary(summaryData);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const subtitle = (() => {
    switch (user?.role) {
      case "DOCTOR":
        return "Your schedule and patients";
      case "PHARMACIST":
        return "Your pharmacy overview";
      case "NURSE":
        return "Your shift and patient overview";
      case "RECEPTIONIST":
        return "Front desk overview";
      default:
        return "Overview of your hospital's activity";
    }
  })();

  return (
    <>
           <header className="bg-white border-b border-brand-cyan px-4 md:px-8 py-4 flex justify-between items-center gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-brand-navy">Dashboard</h2>
          <p className="text-xs text-brand-navy/60 truncate">
            {user?.role === "DOCTOR"
              ? "Your schedule and patients"
              : "Overview of your hospital's activity"}
          </p>
        </div>

        {/* User info — hidden on mobile, shown on md+ */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-brand-navy">
              {user?.fullName ?? "Loading…"}
            </p>
            <p className="text-xs text-brand-navy/60 font-medium">
              {user ? ROLE_LABELS[user.role].toUpperCase() : ""}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold shadow-md shadow-brand-accent/30">
            {user?.fullName
              ?.split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("") ?? "?"}
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : !summary ? (
          <p className="text-brand-navy/60">Could not load summary.</p>
        ) : summary.role === "DOCTOR" ? (
          <DoctorView summary={summary} />
        ) : summary.role === "PHARMACIST" ? (
          <PharmacistView summary={summary} />
        ) : summary.role === "NURSE" ? (
          <NurseView summary={summary} />
        ) : summary.role === "RECEPTIONIST" ? (
          <ReceptionistView summary={summary} />
        ) : summary.role === "ADMIN" ? (
          <AdminView summary={summary} user={user} />
        ) : null}
      </main>
    </>
  );
}

// ============ ADMIN ============
function AdminView({
  summary,
  user,
}: {
  summary: AdminSummary;
  user: SessionUser | null;
}) {
  // Weekly trend for the mini sparkline
  const revenueTrend = summary.dailyRevenue.map((d) => d.value);
  const maxRevenue = Math.max(...revenueTrend, 1);

  const statCards = [
    {
      label: "Total Patients",
      value: summary.totalPatients.toLocaleString(),
      sub: `${summary.patientsThisWeek} new this week`,
      delta:
        summary.patientDelta === 0
          ? null
          : summary.patientDelta > 0
          ? `+${summary.patientDelta}`
          : `${summary.patientDelta}`,
      deltaPositive: summary.patientDelta >= 0,
      icon: UsersIcon,
      gradient: "from-brand-accent to-brand-sky",
      accent: "text-brand-accent",
      bg: "bg-brand-accent/10",
    },
    {
      label: "Doctors",
      value: summary.totalDoctors.toString(),
      sub: `${summary.activeStaff} active staff`,
      delta: null,
      icon: StethoscopeIcon,
      gradient: "from-brand-success to-emerald-400",
      accent: "text-brand-success",
      bg: "bg-brand-success/10",
    },
    {
      label: "Today's Appointments",
      value: summary.todayAppointments.toString(),
      sub: "Scheduled for today",
      delta: null,
      icon: CalendarIcon,
      gradient: "from-amber-400 to-amber-500",
      accent: "text-amber-600",
      bg: "bg-amber-400/10",
    },
    {
      label: "Revenue Today",
      value: `₦${summary.revenueToday.toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`,
      sub: `₦${summary.totalRevenue.toLocaleString("en-NG", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} all time`,
      delta: null,
      icon: WalletIcon,
      gradient: "from-purple-500 to-purple-600",
      accent: "text-purple-600",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <>
           {/* Greeting */}
      <div className="mb-8">
        <h3 className="text-3xl font-bold text-brand-navy tracking-tight">
          {getGreeting()}
          {user?.fullName ? `, ${getFirstName(user.fullName)}` : ""}
        </h3>
        <p className="text-brand-navy/60 mt-1">
          Here's what's happening at your hospital today.
        </p>
      </div>
      {/* Alert banner for pending invoices */}
      {summary.pendingInvoices > 0 && (
        <Link
          href="/dashboard/billing?status=UNPAID"
          className="block mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 hover:bg-amber-100/70 transition"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">💰</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900">
                {summary.pendingInvoices}{" "}
                {summary.pendingInvoices === 1 ? "invoice needs" : "invoices need"}{" "}
                payment
              </p>
              <p className="text-xs text-amber-700">
                Tap to view outstanding invoices
              </p>
            </div>
            <span className="text-amber-600 text-lg">→</span>
          </div>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group bg-white rounded-2xl border border-brand-sky/30 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-sky/60 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`h-11 w-11 rounded-xl ${card.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${card.accent}`} />
                </div>
                {card.delta && (
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      card.deltaPositive
                        ? "bg-brand-success/15 text-brand-success"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {card.delta}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-brand-navy mt-1.5 tracking-tight">
                {card.value}
              </p>
              <p className="text-xs text-brand-navy/50 mt-2 font-medium">
                {card.sub}
              </p>
            </div>
          );
        })}
      </div>

      {/* Revenue card */}
      <div className="bg-white rounded-2xl border border-brand-sky/30 shadow-sm p-6 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h4 className="text-lg font-bold text-brand-navy">Revenue</h4>
            <p className="text-xs text-brand-navy/60 mt-1">
              Last 7 days
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
          >
            View billing →
          </Link>
        </div>

        {/* Total revenue large */}
        <p className="text-4xl font-bold text-brand-navy tracking-tight mb-6">
          ₦
          {summary.totalRevenue.toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>

        {/* Chart */}
        <div className="flex items-end gap-2 h-28">
          {summary.dailyRevenue.map((d, i) => {
            const pct = (d.value / maxRevenue) * 100;
            const isToday = i === summary.dailyRevenue.length - 1;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-2 group"
                title={`₦${d.value.toLocaleString()}`}
              >
                <div className="w-full flex items-end h-24">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isToday
                        ? "bg-brand-accent"
                        : "bg-brand-cyan hover:bg-brand-sky"
                    }`}
                    style={{
                      height: `${Math.max(pct, 4)}%`,
                    }}
                  />
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    isToday ? "text-brand-accent" : "text-brand-navy/50"
                  }`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent appointments + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-brand-sky/30 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-bold text-brand-navy">
              Recent appointments
            </h4>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
            >
              View all →
            </Link>
          </div>

          {summary.recentAppointments.length > 0 ? (
            <AppointmentList rows={summary.recentAppointments} />
          ) : (
            <EmptyAppointments />
          )}
        </div>

        <QuickActions />
      </div>
    </>
  );
}

// ---------- Icons (inline SVGs) ----------
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StethoscopeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
function getFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const titles = [
    "dr",
    "dr.",
    "mr",
    "mr.",
    "mrs",
    "mrs.",
    "ms",
    "ms.",
    "prof",
    "prof.",
  ];
  const firstReal = parts.find((p) => !titles.includes(p.toLowerCase()));
  return firstReal || parts[0] || "";
}

// ---------- Helpers ----------
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ============ DOCTOR ============
function DoctorView({ summary }: { summary: DoctorSummary }) {
  const statCards = [
    { label: "My Patients", value: summary.myPatients, trend: "Patients you've seen" },
    { label: "Today's Appointments", value: summary.myAppointmentsToday, trend: "Scheduled for today" },
  ];

  return (
    <>
      <h3 className="text-2xl font-bold mb-6 text-brand-navy">Welcome back, Doctor</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {statCards.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} trend={s.trend} accent={ACCENTS[i]} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-brand-sky/40 p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-bold text-brand-navy">Your upcoming appointments</h4>
            <Link href="/dashboard/appointments" className="text-xs font-semibold text-brand-accent hover:text-brand-navy transition">
              View all →
            </Link>
          </div>
          {summary.myUpcoming.length > 0 ? (
            <AppointmentList rows={summary.myUpcoming} />
          ) : (
            <EmptyAppointments message="No upcoming appointments." />
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-brand-sky/40 p-6">
          <h4 className="text-lg font-bold text-brand-navy mb-5">Quick actions</h4>
          <div className="space-y-3">
            <QuickActionLink label="View my patients" href="/dashboard/patients" accent="bg-brand-accent" />
            <QuickActionLink label="My appointments" href="/dashboard/appointments" accent="bg-brand-success" />
            <QuickActionLink label="Add new patient" href="/dashboard/patients/new" accent="bg-amber-400" />
          </div>
        </div>
      </div>

      {summary.myRecent.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-brand-sky/40 p-6">
          <h4 className="text-lg font-bold text-brand-navy mb-5">Recently booked with you</h4>
          <AppointmentList rows={summary.myRecent} />
        </div>
      )}
    </>
  );
}

// ============ PHARMACIST ============
function PharmacistView({ summary }: { summary: PharmacistSummary }) {
  const statCards = [
    {
      label: "Pending Prescriptions",
      value: summary.pendingPrescriptions,
      trend: "Awaiting fulfilment",
      accent: "bg-brand-accent",
    },
    {
      label: "Dispensed Today",
      value: summary.dispensedToday,
      trend: "Completed today",
      accent: "bg-brand-success",
    },
    {
      label: "Low Stock Items",
      value: summary.lowStockItems,
      trend: "Need restocking",
      accent: "bg-amber-400",
    },
    {
      label: "Total Drugs",
      value: summary.totalDrugs,
      trend: "In your inventory",
      accent: "bg-purple-500",
    },
  ];

  const STATUS_STYLES: Record<
    PharmacistSummary["recentPrescriptions"][number]["status"],
    string
  > = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    PARTIALLY_DISPENSED:
      "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
    DISPENSED:
      "bg-brand-success/15 text-brand-success border-brand-success/30",
    CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  };

  const STATUS_LABELS: Record<
    PharmacistSummary["recentPrescriptions"][number]["status"],
    string
  > = {
    PENDING: "Pending",
    PARTIALLY_DISPENSED: "Partial",
    DISPENSED: "Dispensed",
    CANCELLED: "Cancelled",
  };

  return (
    <>
      <h3 className="text-2xl font-bold mb-6 text-brand-navy">
        Pharmacy Overview
      </h3>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5"
          >
            <div className={`h-1.5 w-12 rounded-full ${s.accent} mb-3`} />
            <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
              {s.label}
            </p>
            <p className="text-3xl font-bold text-brand-navy mt-1">
              {s.value}
            </p>
            <p className="text-xs text-brand-navy/50 mt-2 font-medium">
              {s.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent prescriptions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-brand-sky/40 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-bold text-brand-navy">
              Recent prescriptions
            </h4>
            <Link
              href="/dashboard/pharmacy/prescriptions"
              className="text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
            >
              View all →
            </Link>
          </div>

          {summary.recentPrescriptions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-sm text-brand-navy/60">
                No prescriptions yet.
              </p>
              <Link
                href="/dashboard/pharmacy/prescriptions/new"
                className="inline-block mt-3 text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
              >
                Write the first prescription →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {summary.recentPrescriptions.map((rx) => (
                <Link
                  key={rx.id}
                  href={`/dashboard/pharmacy/prescriptions/${rx.id}`}
                  className="flex items-center justify-between py-3 border-b border-brand-cyan/60 last:border-0 hover:bg-brand-cyan-light/40 rounded-md px-2 -mx-2 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-brand-cyan flex items-center justify-center text-xs font-bold text-brand-navy flex-shrink-0">
                      {rx.patientName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-navy truncate">
                        {rx.patientName}
                      </p>
                      <p className="text-xs text-brand-navy/60 truncate">
                        {rx.prescriptionNo} · {rx.itemCount}{" "}
                        {rx.itemCount === 1 ? "drug" : "drugs"} ·{" "}
                        {rx.doctorName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                      STATUS_STYLES[rx.status]
                    }`}
                  >
                    {STATUS_LABELS[rx.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Low stock alert list */}
        <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h4 className="text-lg font-bold text-brand-navy">
              Low stock alerts
            </h4>
            <Link
              href="/dashboard/pharmacy"
              className="text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
            >
              View all →
            </Link>
          </div>

          {summary.lowStockList.length === 0 ? (
            <div className="text-center py-10">
              <div className="h-10 w-10 rounded-full bg-brand-success/15 mx-auto mb-3 flex items-center justify-center">
                <span className="text-lg text-brand-success">✓</span>
              </div>
              <p className="text-sm text-brand-navy/60">
                All drugs are well stocked.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary.lowStockList.map((d) => (
                <Link
                  key={d.id}
                  href={`/dashboard/pharmacy/${d.id}`}
                  className="block p-3 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-50 transition"
                >
                  <p className="text-sm font-semibold text-brand-navy">
                    {d.name}
                    {d.strength && (
                      <span className="text-brand-navy/60 font-normal">
                        {" "}
                        {d.strength}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {d.totalStock} left · reorder at {d.reorderLevel}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
// ============ NURSE ============
function NurseView({ summary }: { summary: NurseSummary }) {
  const statCards = [
    { label: "Total Patients", value: summary.totalPatients, trend: "In your hospital" },
    { label: "Today's Appointments", value: summary.todayAppointments, trend: "Scheduled for today" },
    { label: "Ward Occupancy", value: summary.wardOccupancy, trend: "Coming soon" },
  ];

  return (
    <>
      <h3 className="text-2xl font-bold mb-6 text-brand-navy">Nurse Dashboard</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statCards.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} trend={s.trend} accent={ACCENTS[i]} />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-brand-sky/40 p-10 text-center">
        <p className="text-sm text-brand-navy/70">
          Ward management and shift scheduling will appear here once those modules are built.
        </p>
      </div>
    </>
  );
}

// ============ RECEPTIONIST ============
function ReceptionistView({ summary }: { summary: ReceptionistSummary }) {
  const statCards = [
    { label: "Total Patients", value: summary.totalPatients, trend: "In your hospital" },
    { label: "Today's Appointments", value: summary.todayAppointments, trend: "Scheduled for today" },
    { label: "Upcoming Appointments", value: summary.upcomingAppointments, trend: "On the books" },
  ];

  return (
    <>
      <h3 className="text-2xl font-bold mb-6 text-brand-navy">Front Desk Overview</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statCards.map((s, i) => (
          <StatCard key={s.label} label={s.label} value={s.value} trend={s.trend} accent={ACCENTS[i]} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-brand-sky/40 p-6">
          <h4 className="text-lg font-bold text-brand-navy mb-5">Quick actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <QuickActionLink label="Register new patient" href="/dashboard/patients/new" accent="bg-brand-accent" />
            <QuickActionLink label="Book appointment" href="/dashboard/appointments/new" accent="bg-brand-success" />
            <QuickActionLink label="View all patients" href="/dashboard/patients" accent="bg-amber-400" />
            <QuickActionLink label="View appointments" href="/dashboard/appointments" accent="bg-purple-500" />
          </div>
        </div>

        <div className="bg-brand-navy text-white rounded-xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10" />
          <div className="relative">
            <p className="text-xs font-bold text-brand-sky uppercase tracking-widest mb-4">
              Coming soon
            </p>
            <p className="text-sm text-brand-cyan-light/85 leading-relaxed">
              Billing, invoicing, and payment tracking will appear here once the Billing module is built.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// ============ SHARED ============
function StatCard({
  label,
  value,
  trend,
  accent,
}: {
  label: string;
  value: number;
  trend: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition border border-brand-sky/40 p-5">
      <div className={`h-1.5 w-12 rounded-full ${accent} mb-3`} />
      <p className="text-xs text-brand-navy/60 uppercase tracking-wide font-semibold">
        {label}
      </p>
      <p className="text-3xl font-bold text-brand-navy mt-1">
        {value.toLocaleString()}
      </p>
      <p className="text-xs text-brand-navy/50 mt-2 font-medium">{trend}</p>
    </div>
  );
}

function AppointmentList({ rows }: { rows: AppointmentRow[] }) {
  return (
    <div className="space-y-1">
      {rows.map((row) => (
        <Link
          key={row.id}
          href={`/dashboard/appointments/${row.id}`}
          className="flex items-center justify-between py-3 border-b border-brand-cyan/60 last:border-0 hover:bg-brand-cyan-light/40 rounded-md px-2 -mx-2 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-brand-cyan flex items-center justify-center text-xs font-bold text-brand-navy flex-shrink-0">
              {row.patientName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-navy truncate">
                {row.patientName}
              </p>
              <p className="text-xs text-brand-navy/60 truncate">
                {row.department} · {row.doctorName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_STYLES[row.status]}`}
            >
              {STATUS_LABELS[row.status]}
            </span>
            <div className="text-right">
              <p className="text-xs font-semibold text-brand-navy">{row.time}</p>
              <p className="text-[10px] text-brand-navy/60">{row.date}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function EmptyAppointments({ message = "No appointments yet." }: { message?: string }) {
  return (
    <div className="text-center py-10">
      <p className="text-sm text-brand-navy/60">{message}</p>
      <Link
        href="/dashboard/appointments/new"
        className="inline-block mt-3 text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
      >
        Book an appointment →
      </Link>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-brand-sky/40 p-6">
      <h4 className="text-lg font-bold text-brand-navy mb-5">Quick actions</h4>
      <div className="space-y-3">
        <QuickActionLink label="Register new patient" href="/dashboard/patients/new" accent="bg-brand-accent" />
        <QuickActionLink label="Book appointment" href="/dashboard/appointments/new" accent="bg-brand-success" />
        <QuickActionLink label="Generate invoice" href="/dashboard/billing" accent="bg-amber-400" />
        <QuickActionLink label="Add new staff" href="/dashboard/staff/new" accent="bg-purple-500" />
      </div>
    </div>
  );
}

function QuickActionLink({ label, href, accent }: { label: string; href: string; accent: string }) {
  return (
    <Link
      href={href}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-brand-cyan hover:border-brand-accent hover:bg-brand-cyan-light/50 transition text-left"
    >
      <span className={`h-8 w-8 rounded-lg ${accent} flex items-center justify-center shadow-sm`}>
        <span className="h-2.5 w-2.5 rounded-sm bg-white/90"></span>
      </span>
      <span className="text-sm font-semibold text-brand-navy">{label}</span>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <div className="h-8 w-56 bg-brand-cyan rounded animate-pulse mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-xl border border-brand-sky/40 animate-pulse" />
        ))}
      </div>
      <div className="h-48 bg-white rounded-xl border border-brand-sky/40 animate-pulse" />
    </>
  );
}