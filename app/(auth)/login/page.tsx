"use client";

import { useState } from "react";
import Link from "next/link";

type Portal = "staff" | "admin";

export default function LoginPage() {
  const [portal, setPortal] = useState<Portal>("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, asRole: portal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password");
        setSubmitting(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  function switchPortal(next: Portal) {
    if (next === portal) return;
    setPortal(next);
    setError("");
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-brand-cyan p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-sky/30 via-transparent to-brand-accent/10"></div>

        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-lg bg-brand-accent text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-brand-accent/30">
            M
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-navy">
            MediCore
          </span>
        </Link>

        <div className="relative">
          <h2 className="text-4xl font-bold tracking-tight text-brand-navy leading-tight">
            Welcome back to the future of hospital management.
          </h2>
          <p className="mt-5 text-brand-navy/75 text-lg leading-relaxed max-w-md">
            Patient records, appointments, billing, pharmacy and staff
            operations — all in one secure platform.
          </p>

          <div className="mt-10 space-y-3">
            {[
              "HIPAA-aligned architecture",
              "Role-based access control",
              "Full audit trail on every action",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-brand-success/20 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-brand-success"></span>
                </span>
                <span className="text-sm font-medium text-brand-navy/80">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-navy/60">
          © 2026 MediCore. All rights reserved.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center bg-white p-6 md:p-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-navy/70 hover:text-brand-accent transition mb-6"
          >
            <span>←</span>
            <span>Back to home</span>
          </Link>

          <Link href="/" className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-9 w-9 rounded-lg bg-brand-accent text-white flex items-center justify-center font-bold shadow-md shadow-brand-accent/30">
              M
            </div>
            <span className="text-lg font-bold tracking-tight text-brand-navy">
              MediCore
            </span>
          </Link>

          <h1 className="text-3xl font-bold tracking-tight text-brand-navy">
            {portal === "admin" ? "Administrator sign in" : "Staff sign in"}
          </h1>
          <p className="mt-2 text-brand-navy/70">
            {portal === "admin"
              ? "Manage your hospital"
              : "Sign in to your workspace"}
          </p>

          {/* Portal tabs */}
          <div className="mt-6 bg-brand-cyan-light p-1 rounded-lg inline-flex w-full">
            <PortalTab
              label="Staff"
              active={portal === "staff"}
              onClick={() => switchPortal("staff")}
            />
            <PortalTab
              label="Admin"
              active={portal === "admin"}
              onClick={() => switchPortal("admin")}
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder={
                  portal === "admin"
                    ? "admin@hospital.com"
                    : "you@hospital.com"
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy/50 hover:text-brand-accent transition p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand-accent hover:bg-brand-navy text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 shadow-lg shadow-brand-accent/30"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-brand-navy/70 text-center pt-4">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-accent hover:text-brand-navy transition"
            >
              Register your hospital
            </Link>
          </p>
        </div>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #9dd1ff;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
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
    </div>
  );
}

function PortalTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 text-center text-sm font-semibold py-2 rounded-md transition ${
        active
          ? "bg-white text-brand-navy shadow-sm"
          : "text-brand-navy/60 hover:text-brand-navy"
      }`}
    >
      {label}
    </button>
  );
}

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}