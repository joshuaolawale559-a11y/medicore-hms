"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Role = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST" | "PHARMACIST";

type NavItem = {
  label: string;
  href: string;
  roles: Role[];
};

const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "PHARMACIST"],
  },
  {
    label: "Patients",
    href: "/dashboard/patients",
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    label: "Appointments",
    href: "/dashboard/appointments",
    roles: ["ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    label: "Staff",
    href: "/dashboard/staff",
    roles: ["ADMIN"],
  },
  {
    label: "Billing",
    href: "/dashboard/billing",
    roles: ["ADMIN", "RECEPTIONIST"],
  },
  {
    label: "Pharmacy",
    href: "/dashboard/pharmacy",
    roles: ["ADMIN", "PHARMACIST"],
  },
  {
    label: "Wards",
    href: "/dashboard/wards",
    roles: ["ADMIN", "NURSE"],
  },
];

type SessionUser = {
  id: string;
  fullName: string;
  role: Role;
  hospitalName?: string;
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  RECEPTIONIST: "Receptionist",
  PHARMACIST: "Pharmacist",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Mobile sidebar open/closed
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me")
      .then((res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (cancelled || !data) return;
        setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) router.push("/login");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Close sidebar whenever the route changes (mobile UX)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const visibleItems = user
    ? ALL_NAV_ITEMS.filter((item) => item.roles.includes(user.role))
    : [];

  const sidebar = (
    <aside className="w-64 bg-brand-navy text-white flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-brand-accent text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-accent/30">
            M
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold tracking-tight">MediCore</p>
            <p className="text-[10px] text-brand-cyan-light/60 uppercase tracking-wider truncate">
              {user?.hospitalName || "Hospital Management"}
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 mx-2 bg-white/5 rounded-lg animate-pulse"
              />
            ))
          : visibleItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-3 md:py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-brand-accent text-white font-semibold shadow-md shadow-brand-accent/30"
                      : "text-brand-cyan-light/80 hover:bg-white/5 hover:text-white font-medium"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-3">
        {user && (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-accent text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {user.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {user.fullName}
              </p>
              <p className="text-[10px] text-brand-cyan-light/60 uppercase tracking-wide">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="block w-full text-left text-sm font-medium text-brand-cyan-light/70 hover:text-white transition"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-brand-cyan-light">
      {/* Desktop sidebar — always visible on md and up */}
      <div className="hidden md:flex md:flex-shrink-0">{sidebar}</div>

      {/* Mobile sidebar — slides in from left when open */}
      {sidebarOpen && (
        <>
          {/* Dark overlay */}
          <div
            className="fixed inset-0 bg-brand-navy/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full z-50 md:hidden shadow-2xl">
            {sidebar}
          </div>
        </>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar with hamburger */}
        <div className="md:hidden bg-white border-b border-brand-cyan px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-10 w-10 rounded-lg hover:bg-brand-cyan-light transition flex items-center justify-center"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-brand-navy"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-accent text-white flex items-center justify-center font-bold shadow-sm">
              M
            </div>
            <span className="text-base font-bold text-brand-navy">
              MediCore
            </span>
          </Link>

          {/* Spacer to balance the hamburger */}
          <div className="w-10" />
        </div>

        {children}
      </div>
    </div>
  );
}