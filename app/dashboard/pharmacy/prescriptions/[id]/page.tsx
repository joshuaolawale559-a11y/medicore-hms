"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type PrescriptionItem = {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispensedQty: number;
  instructions: string | null;
  drug: {
    id: string;
    name: string;
    genericName: string | null;
    strength: string | null;
    form: string;
    sellingPrice: number;
  };
};

type Prescription = {
  id: string;
  prescriptionNo: string;
  status: "PENDING" | "PARTIALLY_DISPENSED" | "DISPENSED" | "CANCELLED";
  diagnosis: string | null;
  notes: string | null;
  createdAt: string;
  dispensedAt: string | null;
  patient: {
    id: string;
    patientCode: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
  doctor: {
    id: string;
    fullName: string;
  };
  dispensedBy: {
    id: string;
    fullName: string;
  } | null;
  items: PrescriptionItem[];
};

const STATUS_STYLES: Record<Prescription["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIALLY_DISPENSED:
    "bg-brand-accent/15 text-brand-accent border-brand-accent/30",
  DISPENSED: "bg-brand-success/15 text-brand-success border-brand-success/30",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_LABELS: Record<Prescription["status"], string> = {
  PENDING: "Pending",
  PARTIALLY_DISPENSED: "Partially Dispensed",
  DISPENSED: "Dispensed",
  CANCELLED: "Cancelled",
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

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [dispensing, setDispensing] = useState(false);
  const [dispenseError, setDispenseError] = useState("");
  const [showConfirmDispense, setShowConfirmDispense] = useState(false);

  const [cancelling, setCancelling] = useState(false);

  async function loadPrescription() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/prescriptions/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setPrescription(data.prescription);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load prescription."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrescription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDispense() {
    setDispenseError("");
    setDispensing(true);

    try {
      const res = await fetch(`/api/prescriptions/${id}/dispense`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setDispenseError(data.message || "Could not dispense.");
        setDispensing(false);
        return;
      }

      setShowConfirmDispense(false);
      setDispensing(false);
      await loadPrescription();
    } catch {
      setDispenseError("Could not reach the server.");
      setDispensing(false);
    }
  }

  async function handleCancel() {
    if (
      !window.confirm(
        "Cancel this prescription? This cannot be undone. Only prescriptions with no dispensed drugs can be cancelled."
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch(`/api/prescriptions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Could not cancel prescription.");
        return;
      }
      await loadPrescription();
    } catch {
      alert("Could not reach the server.");
    } finally {
      setCancelling(false);
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
            <div className="lg:col-span-2 h-96 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
            <div className="h-80 bg-white rounded-2xl border border-brand-sky/40 animate-pulse" />
          </div>
        </main>
      </>
    );
  }

  // ---- Error / not found ----
  if (error || !prescription) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/pharmacy/prescriptions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Prescriptions
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">Prescription</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 p-12 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              {error || "Prescription not found"}
            </h3>
            <Link
              href="/dashboard/pharmacy/prescriptions"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30 mt-4"
            >
              Back to Prescriptions
            </Link>
          </div>
        </main>
      </>
    );
  }

  const canDispense =
    prescription.status === "PENDING" ||
    prescription.status === "PARTIALLY_DISPENSED";

  const canCancel =
    prescription.status === "PENDING" &&
    prescription.items.every((i) => i.dispensedQty === 0);

  const totalItems = prescription.items.length;
  const fullyDispensedItems = prescription.items.filter(
    (i) => i.dispensedQty >= i.quantity
  ).length;

  const estimatedTotal = prescription.items.reduce(
    (sum, i) => sum + i.quantity * Number(i.drug.sellingPrice),
    0
  );

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/pharmacy/prescriptions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-2"
        >
          ← Back to Prescriptions
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">
              Prescription {prescription.prescriptionNo}
            </h2>
            <p className="text-xs text-brand-navy/60 mt-0.5">
              Written {formatDateTime(prescription.createdAt)} ·{" "}
              {prescription.doctor.fullName}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border ${
              STATUS_STYLES[prescription.status]
            }`}
          >
            {STATUS_LABELS[prescription.status]}
          </span>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Patient card */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-brand-accent" />
                Patient
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-full bg-brand-cyan flex items-center justify-center text-sm font-bold text-brand-navy flex-shrink-0">
                  {prescription.patient.firstName[0]}
                  {prescription.patient.lastName[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-brand-navy truncate">
                    {prescription.patient.firstName}{" "}
                    {prescription.patient.lastName}
                  </p>
                  <p className="text-xs font-mono text-brand-navy/60">
                    {prescription.patient.patientCode}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm mt-4">
                <div>
                  <span className="text-brand-navy/60">📞 </span>
                  <span className="text-brand-navy">
                    {prescription.patient.phone}
                  </span>
                </div>
                {prescription.patient.email && (
                  <div>
                    <span className="text-brand-navy/60">✉ </span>
                    <span className="text-brand-navy">
                      {prescription.patient.email}
                    </span>
                  </div>
                )}
              </div>
              <Link
                href={`/dashboard/patients/${prescription.patient.id}`}
                className="inline-block mt-4 text-xs font-semibold text-brand-accent hover:text-brand-navy transition"
              >
                View patient profile →
              </Link>
            </div>

            {/* Diagnosis */}
            {prescription.diagnosis && (
              <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-purple-500" />
                  Diagnosis
                </h3>
                <p className="text-sm text-brand-navy/80">
                  {prescription.diagnosis}
                </p>
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm overflow-hidden">
              <div className="p-6 pb-0">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-brand-success" />
                  Prescribed Drugs ({totalItems})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-cyan-light/60 text-left text-xs font-semibold text-brand-navy/70 uppercase tracking-wide">
                      <th className="px-6 py-3">Drug</th>
                      <th className="px-6 py-3">Dosage</th>
                      <th className="px-6 py-3">Frequency</th>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3 text-right">Prescribed</th>
                      <th className="px-6 py-3 text-right">Dispensed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescription.items.map((item) => {
                      const isFull = item.dispensedQty >= item.quantity;
                      const isPartial =
                        item.dispensedQty > 0 && item.dispensedQty < item.quantity;
                      return (
                        <tr
                          key={item.id}
                          className="border-t border-brand-cyan/50"
                        >
                          <td className="px-6 py-3">
                            <p className="font-semibold text-brand-navy">
                              {item.drug.name}
                              {item.drug.strength && (
                                <span className="text-brand-navy/60 font-normal">
                                  {" "}
                                  {item.drug.strength}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-brand-navy/50">
                              {FORM_LABELS[item.drug.form] || item.drug.form}
                            </p>
                            {item.instructions && (
                              <p className="text-[10px] text-brand-navy/60 italic mt-0.5">
                                {item.instructions}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-3 text-brand-navy/80 text-xs">
                            {item.dosage}
                          </td>
                          <td className="px-6 py-3 text-brand-navy/80 text-xs">
                            {item.frequency}
                          </td>
                          <td className="px-6 py-3 text-brand-navy/80 text-xs">
                            {item.duration}
                          </td>
                          <td className="px-6 py-3 text-right text-brand-navy font-semibold">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <span
                              className={`font-bold ${
                                isFull
                                  ? "text-brand-success"
                                  : isPartial
                                  ? "text-brand-accent"
                                  : "text-brand-navy/40"
                              }`}
                            >
                              {item.dispensedQty}
                            </span>
                            <span className="text-xs text-brand-navy/50">
                              {" "}
                              / {item.quantity}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {prescription.notes && (
              <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-amber-400" />
                  Notes
                </h3>
                <p className="text-sm text-brand-navy/80 leading-relaxed whitespace-pre-wrap">
                  {prescription.notes}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Status summary */}
            <div className="bg-brand-navy text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/10 via-transparent to-brand-cyan/10" />
              <div className="relative space-y-4">
                <div>
                  <p className="text-xs font-bold text-brand-sky uppercase tracking-widest">
                    Progress
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {fullyDispensedItems}/{totalItems}
                  </p>
                  <p className="text-xs text-brand-cyan-light/80 mt-1">
                    drugs fully dispensed
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10">
                  <p className="text-xs font-bold text-brand-sky uppercase tracking-widest">
                    Estimated Value
                  </p>
                  <p className="text-xl font-semibold mt-1">
                    {formatNaira(estimatedTotal)}
                  </p>
                </div>
                {prescription.dispensedBy && prescription.dispensedAt && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs font-bold text-brand-sky uppercase tracking-widest">
                      Dispensed By
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      {prescription.dispensedBy.fullName}
                    </p>
                    <p className="text-xs text-brand-cyan-light/70 mt-0.5">
                      {formatDateTime(prescription.dispensedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-brand-sky/40 shadow-sm p-6">
              <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                {canDispense && !showConfirmDispense && (
                  <button
                    onClick={() => setShowConfirmDispense(true)}
                    className="w-full bg-brand-success hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-success/30"
                  >
                    Dispense Prescription
                  </button>
                )}

                {prescription.status === "DISPENSED" && (
                  <div className="w-full text-center bg-brand-success/10 text-brand-success text-sm font-semibold px-4 py-2.5 rounded-lg">
                    ✓ Fully Dispensed
                  </div>
                )}

                {prescription.status === "CANCELLED" && (
                  <div className="w-full text-center bg-slate-100 text-slate-500 text-sm font-semibold px-4 py-2.5 rounded-lg">
                    Prescription Cancelled
                  </div>
                )}

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full text-sm font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-300 px-4 py-2.5 rounded-lg transition disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling…" : "Cancel Prescription"}
                  </button>
                )}

                {prescription.status === "PARTIALLY_DISPENSED" && (
                  <p className="text-xs text-brand-navy/60 text-center pt-2 leading-relaxed">
                    Some drugs have been dispensed. Cannot cancel.
                  </p>
                )}
              </div>
            </div>

            {/* Dispense confirmation panel */}
            {showConfirmDispense && canDispense && (
              <div className="bg-white rounded-2xl border-2 border-brand-success/40 shadow-md p-6">
                <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-brand-success" />
                  Confirm Dispense
                </h3>

                <div className="bg-brand-cyan-light/60 border border-brand-sky/40 rounded-lg p-3 mb-4 text-xs text-brand-navy/80 leading-relaxed">
                  This will deduct the prescribed quantities from the
                  earliest-expiring batches (FEFO) and mark the prescription
                  as dispensed. Stock will be reduced immediately.
                </div>

                {dispenseError && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 mb-3">
                    {dispenseError}
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleDispense}
                    disabled={dispensing}
                    className="w-full bg-brand-success hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-success/30 disabled:opacity-60"
                  >
                    {dispensing ? "Dispensing…" : "Confirm"}
                  </button>
                  <button
                    onClick={() => {
                      setShowConfirmDispense(false);
                      setDispenseError("");
                    }}
                    disabled={dispensing}
                    className="w-full text-xs font-semibold text-brand-navy/60 hover:text-brand-navy transition py-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}