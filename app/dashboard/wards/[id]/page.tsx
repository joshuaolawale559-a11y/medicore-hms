"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type BedStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";

type PatientInfo = {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  phone: string;
};

type Bed = {
  id: string;
  bedNumber: string;
  status: BedStatus;
  currentPatient: {
    admissionId: string;
    admissionNo: string;
    admittedAt: string;
    patient: PatientInfo;
  } | null;
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

type Patient = {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  phone: string;
};

const STATUS_STYLES: Record<BedStatus, string> = {
  AVAILABLE:
    "bg-brand-success/10 border-brand-success/40 text-brand-navy hover:bg-brand-success/20 hover:border-brand-success",
  OCCUPIED:
    "bg-amber-50 border-amber-300 text-brand-navy hover:bg-amber-100 hover:border-amber-400",
  MAINTENANCE:
    "bg-slate-100 border-slate-300 text-slate-500 cursor-not-allowed",
};

const STATUS_BADGE: Record<BedStatus, string> = {
  AVAILABLE: "bg-brand-success/15 text-brand-success border-brand-success/30",
  OCCUPIED: "bg-amber-100 text-amber-700 border-amber-300",
  MAINTENANCE: "bg-slate-200 text-slate-600 border-slate-300",
};

const STATUS_LABELS: Record<BedStatus, string> = {
  AVAILABLE: "Available",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Maintenance",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function WardDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [ward, setWard] = useState<Ward | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddBed, setShowAddBed] = useState(false);
  const [newBedNumber, setNewBedNumber] = useState("");
  const [addBedError, setAddBedError] = useState("");
  const [addingBed, setAddingBed] = useState(false);

  const [admitBed, setAdmitBed] = useState<Bed | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [admitPatientId, setAdmitPatientId] = useState("");
  const [admitReason, setAdmitReason] = useState("");
  const [admitError, setAdmitError] = useState("");
  const [admitting, setAdmitting] = useState(false);

  const [dischargeBed, setDischargeBed] = useState<Bed | null>(null);
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [dischargeError, setDischargeError] = useState("");
  const [discharging, setDischarging] = useState(false);

  async function loadWard() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/wards/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load");
      setWard(data.ward);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load ward.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddBed(e: React.FormEvent) {
    e.preventDefault();
    setAddBedError("");
    if (!newBedNumber.trim()) {
      setAddBedError("Bed number is required.");
      return;
    }
    setAddingBed(true);
    try {
      const res = await fetch(`/api/wards/${id}/beds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bedNumber: newBedNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddBedError(data.message || "Could not add bed.");
        setAddingBed(false);
        return;
      }
      setNewBedNumber("");
      setShowAddBed(false);
      setAddingBed(false);
      await loadWard();
    } catch {
      setAddBedError("Could not reach the server.");
      setAddingBed(false);
    }
  }

  function openAdmitModal(bed: Bed) {
    setAdmitBed(bed);
    setAdmitPatientId("");
    setAdmitReason("");
    setAdmitError("");
    fetch("/api/patients")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setPatients(d.data ?? []))
      .catch(() => setPatients([]));
  }

  async function handleAdmit(e: React.FormEvent) {
    e.preventDefault();
    if (!admitBed) return;
    setAdmitError("");
    if (!admitPatientId) {
      setAdmitError("Please select a patient.");
      return;
    }
    setAdmitting(true);
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: admitPatientId,
          bedId: admitBed.id,
          reason: admitReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAdmitError(data.message || "Could not admit patient.");
        setAdmitting(false);
        return;
      }
      setAdmitBed(null);
      setAdmitting(false);
      await loadWard();
    } catch {
      setAdmitError("Could not reach the server.");
      setAdmitting(false);
    }
  }

  function openDischargeModal(bed: Bed) {
    setDischargeBed(bed);
    setDischargeNotes("");
    setDischargeError("");
  }

  async function handleDischarge(e: React.FormEvent) {
    e.preventDefault();
    if (!dischargeBed || !dischargeBed.currentPatient) return;
    setDischargeError("");
    setDischarging(true);
    try {
      const res = await fetch(
        `/api/admissions/${dischargeBed.currentPatient.admissionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "discharge",
            notes: dischargeNotes.trim() || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setDischargeError(data.message || "Could not discharge patient.");
        setDischarging(false);
        return;
      }
      setDischargeBed(null);
      setDischarging(false);
      await loadWard();
    } catch {
      setDischargeError("Could not reach the server.");
      setDischarging(false);
    }
  }

  if (loading) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <div className="h-4 w-40 bg-brand-cyan rounded animate-pulse mb-2" />
          <div className="h-6 w-64 bg-brand-cyan rounded animate-pulse" />
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-white rounded-xl border border-brand-sky/40 animate-pulse"
              />
            ))}
          </div>
        </main>
      </>
    );
  }

  if (error || !ward) {
    return (
      <>
        <header className="bg-white border-b border-brand-cyan px-8 py-4">
          <Link
            href="/dashboard/wards"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-1"
          >
            ← Back to Wards
          </Link>
          <h2 className="text-lg font-bold text-brand-navy">Ward</h2>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-2xl border border-brand-sky/40 p-12 text-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-full bg-red-50 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-2">
              {error || "Ward not found"}
            </h3>
            <Link
              href="/dashboard/wards"
              className="inline-flex items-center justify-center bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30 mt-4"
            >
              Back to Wards
            </Link>
          </div>
        </main>
      </>
    );
  }

  const pct =
    ward.stats.total > 0
      ? Math.round((ward.stats.occupied / ward.stats.total) * 100)
      : 0;

  return (
    <>
      <header className="bg-white border-b border-brand-cyan px-8 py-4">
        <Link
          href="/dashboard/wards"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-navy/60 hover:text-brand-accent transition mb-2"
        >
          ← Back to Wards
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">{ward.name}</h2>
            <p className="text-xs text-brand-navy/60 mt-0.5">
              {ward.floor ? `${ward.floor} · ` : ""}
              Created {formatDate(ward.createdAt)}
            </p>
          </div>
          <button
            onClick={() => setShowAddBed((s) => !s)}
            className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
          >
            <span className="text-base leading-none">+</span>
            <span>Add Bed</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <StatCard label="Total Beds" value={ward.stats.total} accent="bg-brand-accent" />
          <StatCard
            label="Available"
            value={ward.stats.available}
            accent="bg-brand-success"
            valueColor="text-brand-success"
          />
          <StatCard
            label="Occupied"
            value={ward.stats.occupied}
            accent="bg-amber-400"
            valueColor="text-amber-600"
          />
          <StatCard
            label="Occupancy"
            value={`${pct}%`}
            accent="bg-purple-500"
          />
        </div>

        {showAddBed && (
          <form
            onSubmit={handleAddBed}
            className="bg-white rounded-xl border-2 border-brand-accent/40 shadow-md p-5 mb-6"
          >
            <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wide mb-4">
              Add a Bed
            </h3>
            {addBedError && (
              <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 mb-3">
                {addBedError}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newBedNumber}
                onChange={(e) => setNewBedNumber(e.target.value)}
                placeholder="Bed number, e.g. A-01"
                className="input flex-1"
                autoFocus
              />
              <button
                type="submit"
                disabled={addingBed}
                className="bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30 disabled:opacity-60"
              >
                {addingBed ? "Adding…" : "Add Bed"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddBed(false);
                  setNewBedNumber("");
                  setAddBedError("");
                }}
                className="bg-brand-cyan-light hover:bg-brand-cyan text-brand-navy text-sm font-semibold px-5 py-2.5 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {ward.beds.length === 0 ? (
          <div className="bg-white rounded-xl border border-brand-sky/40 p-14 text-center">
            <div className="h-14 w-14 rounded-full bg-brand-cyan-light mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🛏️</span>
            </div>
            <h3 className="text-lg font-bold text-brand-navy mb-1">
              No beds yet
            </h3>
            <p className="text-sm text-brand-navy/70 mb-6 max-w-md mx-auto">
              Add your first bed to this ward to start admitting patients.
            </p>
            <button
              onClick={() => setShowAddBed(true)}
              className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition shadow-md shadow-brand-accent/30"
            >
              <span className="text-base leading-none">+</span>
              <span>Add First Bed</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {ward.beds.map((bed) => (
              <button
                key={bed.id}
                disabled={bed.status === "MAINTENANCE"}
                onClick={() => {
                  if (bed.status === "AVAILABLE") openAdmitModal(bed);
                  else if (bed.status === "OCCUPIED") openDischargeModal(bed);
                }}
                className={`text-left rounded-xl border-2 p-4 transition ${
                  STATUS_STYLES[bed.status]
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-sm font-bold">
                    {bed.bedNumber}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                      STATUS_BADGE[bed.status]
                    }`}
                  >
                    {STATUS_LABELS[bed.status]}
                  </span>
                </div>

                {bed.currentPatient ? (
                  <div className="mt-3 pt-3 border-t border-brand-navy/10">
                    <p className="text-xs font-semibold truncate">
                      {bed.currentPatient.patient.firstName}{" "}
                      {bed.currentPatient.patient.lastName}
                    </p>
                    <p className="text-[10px] font-mono text-brand-navy/60 truncate">
                      {bed.currentPatient.patient.patientCode}
                    </p>
                    <p className="text-[10px] text-brand-navy/60 mt-1">
                      Since{" "}
                      {new Date(
                        bed.currentPatient.admittedAt
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] mt-3 text-brand-navy/50">
                    {bed.status === "AVAILABLE"
                      ? "Click to admit"
                      : "Out of service"}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </main>

      {admitBed && (
        <Modal onClose={() => setAdmitBed(null)}>
          <h3 className="text-lg font-bold text-brand-navy mb-1">
            Admit Patient
          </h3>
          <p className="text-xs text-brand-navy/60 mb-5">
            Bed {admitBed.bedNumber} · {ward.name}
          </p>

          {admitError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-4">
              {admitError}
            </div>
          )}

          <form onSubmit={handleAdmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                Patient <span className="text-red-500">*</span>
              </label>
              <select
                value={admitPatientId}
                onChange={(e) => setAdmitPatientId(e.target.value)}
                className="input"
              >
                <option value="">Select patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.firstName} {p.lastName} — {p.patientCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                Reason for Admission
              </label>
              <input
                type="text"
                value={admitReason}
                onChange={(e) => setAdmitReason(e.target.value)}
                className="input"
                placeholder="e.g. Post-surgery recovery"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-brand-cyan">
              <button
                type="submit"
                disabled={admitting}
                className="flex-1 bg-brand-success hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-3 rounded-lg transition shadow-md shadow-brand-success/30 disabled:opacity-60"
              >
                {admitting ? "Admitting…" : "Confirm Admission"}
              </button>
              <button
                type="button"
                onClick={() => setAdmitBed(null)}
                disabled={admitting}
                className="bg-brand-cyan-light hover:bg-brand-cyan text-brand-navy text-sm font-semibold px-5 py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {dischargeBed && dischargeBed.currentPatient && (
        <Modal onClose={() => setDischargeBed(null)}>
          <h3 className="text-lg font-bold text-brand-navy mb-1">
            Discharge Patient
          </h3>
          <p className="text-xs text-brand-navy/60 mb-5">
            {dischargeBed.currentPatient.patient.firstName}{" "}
            {dischargeBed.currentPatient.patient.lastName} · Bed{" "}
            {dischargeBed.currentPatient.patient.patientCode}
          </p>

          <div className="bg-brand-cyan-light/60 border border-brand-sky/40 rounded-lg p-3 mb-4 text-xs text-brand-navy/80">
            Admission{" "}
            <span className="font-mono font-semibold">
              {dischargeBed.currentPatient.admissionNo}
            </span>{" "}
            · Admitted{" "}
            {new Date(
              dischargeBed.currentPatient.admittedAt
            ).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>

          {dischargeError && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200 mb-4">
              {dischargeError}
            </div>
          )}

          <form onSubmit={handleDischarge} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brand-navy mb-1.5">
                Discharge Notes (optional)
              </label>
              <textarea
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
                rows={3}
                className="input resize-none"
                placeholder="e.g. Recovered well, follow-up in 2 weeks"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-brand-cyan">
              <button
                type="submit"
                disabled={discharging}
                className="flex-1 bg-brand-accent hover:bg-brand-navy text-white text-sm font-semibold px-5 py-3 rounded-lg transition shadow-md shadow-brand-accent/30 disabled:opacity-60"
              >
                {discharging ? "Discharging…" : "Confirm Discharge"}
              </button>
              <button
                type="button"
                onClick={() => setDischargeBed(null)}
                disabled={discharging}
                className="bg-brand-cyan-light hover:bg-brand-cyan text-brand-navy text-sm font-semibold px-5 py-3 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

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
      `}</style>
    </>
  );
}

function StatCard({
  label,
  value,
  accent,
  valueColor,
}: {
  label: string;
  value: number | string;
  accent: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-sky/40 shadow-sm p-5">
      <div className={`h-1.5 w-12 rounded-full ${accent} mb-3`} />
      <p className="text-xs font-semibold text-brand-navy/60 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-3xl font-bold mt-1 ${valueColor ?? "text-brand-navy"}`}>
        {value}
      </p>
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-brand-sky/40 shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}