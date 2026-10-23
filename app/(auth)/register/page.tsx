"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const steps = [
  { id: 1, title: "Hospital Info", description: "Basic details about your hospital" },
  { id: 2, title: "Contact Info", description: "Where to reach you" },
  { id: 3, title: "Admin Account", description: "Set up the administrator" },
];

const hospitalTypes = [
  "General Hospital",
  "Specialist Hospital",
  "Teaching Hospital",
  "Private Clinic",
  "Diagnostic Center",
];

export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 — Hospital
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalType, setHospitalType] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [beds, setBeds] = useState("");
  const [departments, setDepartments] = useState("");

  // Step 2 — Contact
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [hospitalPhone, setHospitalPhone] = useState("");
  const [hospitalEmail, setHospitalEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Step 3 — Admin
  const [adminName, setAdminName] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleNext() {
    setError("");

    if (currentStep === 1) {
      if (!hospitalName || !hospitalType) {
        setError("Please fill in the hospital name and type.");
        return;
      }
    }
    if (currentStep === 2) {
      if (!address || !city || !country || !hospitalPhone || !hospitalEmail) {
        setError("Please fill in all required contact fields.");
        return;
      }
    }

    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  }

  function handleBack() {
    setError("");
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!adminName || !adminEmail || !password || !confirmPassword) {
      setError("Please fill in all required admin fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName,
          hospitalType,
          yearEstablished,
          licenseNumber,
          beds,
          departments,
          address,
          city,
          state,
          country,
          hospitalPhone,
          hospitalEmail,
          website,
          adminName,
          adminRole,
          adminEmail,
          adminPhone,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Please try again.");
        setSubmitting(false);
        return;
      }

      // Success — send the user to login with a success hint
      router.push("/login?registered=1");
    } catch {
      setError("Could not reach the server. Please check your connection.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cyan-light flex flex-col">
      {/* Top bar */}
                  <header className="bg-white border-b border-brand-cyan">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-brand-accent text-white flex items-center justify-center font-bold text-lg shadow-md shadow-brand-accent/30">
              M
            </div>
            <span className="text-lg font-bold tracking-tight text-brand-navy">
              MediCore
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-navy/70 hover:text-brand-accent transition"
          >
            <span>←</span>
            <span>Back to home</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-6 md:p-10">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-brand-navy">
              Register Your Hospital
            </h1>
            <p className="text-brand-navy/70 mt-2">
              A few quick details and you'll be up and running in minutes.
            </p>
          </div>

          {/* Step indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isComplete = step.id < currentStep;
                return (
                  <div key={step.id} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-11 w-11 rounded-full flex items-center justify-center font-bold transition shadow-md ${
                          isComplete
                            ? "bg-brand-success text-white shadow-brand-success/30"
                            : isActive
                            ? "bg-brand-accent text-white shadow-brand-accent/30"
                            : "bg-white text-brand-navy/50 border-2 border-brand-cyan"
                        }`}
                      >
                        {isComplete ? "✓" : step.id}
                      </div>
                      <p
                        className={`text-xs mt-2 font-bold ${
                          isActive ? "text-brand-navy" : "text-brand-navy/60"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-3 rounded-full ${
                          isComplete ? "bg-brand-success" : "bg-brand-sky/40"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl shadow-brand-navy/5 border border-brand-sky/40 p-8"
          >
            <h2 className="text-xl font-bold text-brand-navy">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-brand-navy/65 mt-1 mb-6">
              {steps[currentStep - 1].description}
            </p>

            {error && (
              <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-5">
                {error}
              </div>
            )}

            {/* Step 1 — Hospital Info */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Hospital Name" required>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="input"
                    placeholder="e.g. St. Mary's General Hospital"
                  />
                </Field>

                <Field label="Hospital Type" required>
                  <select
                    value={hospitalType}
                    onChange={(e) => setHospitalType(e.target.value)}
                    className="input"
                  >
                    <option value="">Select type…</option>
                    {hospitalTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Year Established">
                  <input
                    type="number"
                    value={yearEstablished}
                    onChange={(e) => setYearEstablished(e.target.value)}
                    className="input"
                    placeholder="e.g. 2005"
                  />
                </Field>

                <Field label="License / Registration Number">
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="input"
                    placeholder="e.g. RC-1234567"
                  />
                </Field>

                <Field label="Number of Beds">
                  <input
                    type="number"
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    className="input"
                    placeholder="e.g. 120"
                  />
                </Field>

                <Field label="Number of Departments">
                  <input
                    type="number"
                    value={departments}
                    onChange={(e) => setDepartments(e.target.value)}
                    className="input"
                    placeholder="e.g. 8"
                  />
                </Field>
              </div>
            )}

            {/* Step 2 — Contact Info */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <Field label="Hospital Address" required>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input"
                      placeholder="Street address"
                    />
                  </Field>
                </div>

                <Field label="City" required>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input"
                    placeholder="e.g. Lagos"
                  />
                </Field>

                <Field label="State / Region">
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input"
                    placeholder="e.g. Lagos State"
                  />
                </Field>

                <Field label="Country" required>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="input"
                    placeholder="e.g. Nigeria"
                  />
                </Field>

                <Field label="Hospital Phone" required>
                  <input
                    type="tel"
                    value={hospitalPhone}
                    onChange={(e) => setHospitalPhone(e.target.value)}
                    className="input"
                    placeholder="e.g. +234 801 234 5678"
                  />
                </Field>

                <Field label="Hospital Email" required>
                  <input
                    type="email"
                    value={hospitalEmail}
                    onChange={(e) => setHospitalEmail(e.target.value)}
                    className="input"
                    placeholder="e.g. info@hospital.com"
                  />
                </Field>

                <Field label="Website (optional)">
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="input"
                    placeholder="https://…"
                  />
                </Field>
              </div>
            )}

            {/* Step 3 — Admin Account */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Admin Full Name" required>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="input"
                    placeholder="e.g. Dr. Amara Okafor"
                  />
                </Field>

                <Field label="Role / Title">
                  <input
                    type="text"
                    value={adminRole}
                    onChange={(e) => setAdminRole(e.target.value)}
                    className="input"
                    placeholder="e.g. Chief Medical Director"
                  />
                </Field>

                <Field label="Admin Email" required>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="input"
                    placeholder="admin@hospital.com"
                  />
                </Field>

                <Field label="Admin Phone">
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="input"
                    placeholder="+234 …"
                  />
                </Field>

                <Field label="Password" required>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="At least 8 characters"
                  />
                </Field>

                <Field label="Confirm Password" required>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    placeholder="Repeat password"
                  />
                </Field>

                <div className="md:col-span-2 flex items-start gap-3 mt-2">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#4AA9E8] rounded"
                  />
                  <label
                    htmlFor="agree"
                    className="text-sm text-brand-navy/75"
                  >
                    I agree to MediCore's terms of service and privacy policy.
                  </label>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-brand-cyan">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1 || submitting}
                className="px-5 py-2.5 text-sm font-semibold text-brand-navy bg-brand-cyan-light rounded-lg hover:bg-brand-cyan transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-accent rounded-lg hover:bg-brand-navy transition shadow-md shadow-brand-accent/30"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-brand-success rounded-lg hover:bg-emerald-700 transition shadow-md shadow-brand-success/30 disabled:opacity-60"
                >
                  {submitting ? "Creating account…" : "Create Hospital Account"}
                </button>
              )}
            </div>
          </form>

                   <p className="text-center text-sm text-brand-navy/70 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-accent hover:text-brand-navy transition"
            >
              Sign In
            </Link>
          </p>

          <p className="text-center text-xs text-brand-navy/60 mt-3">
            By registering, you agree to MediCore's terms of service and privacy policy.
          </p>
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
        .input::placeholder {
          color: rgba(1, 35, 63, 0.4);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-brand-navy mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}