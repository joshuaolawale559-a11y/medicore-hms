import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const admitSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  bedId: z.string().min(1, "Bed is required"),
  reason: z.string().optional(),
  notes: z.string().optional(),
  expectedDischargeAt: z.string().optional(),
});

function generateAdmissionNo() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "ADM-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---- GET /api/admissions ----
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // ACTIVE | DISCHARGED | TRANSFERRED
  const patientId = searchParams.get("patientId");
  const wardId = searchParams.get("wardId");

  const where: any = { hospitalId: session.hospitalId };
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;
  if (wardId) where.bed = { wardId };

  const admissions = await prisma.admission.findMany({
    where,
    orderBy: { admittedAt: "desc" },
    take: 200,
    include: {
      patient: {
        select: {
          id: true,
          patientCode: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      bed: {
        select: {
          id: true,
          bedNumber: true,
          ward: { select: { id: true, name: true } },
        },
      },
    },
  });

  return NextResponse.json({ admissions, total: admissions.length });
}

// ---- POST /api/admissions ----
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "NURSE", "DOCTOR"].includes(session.role)) {
    return NextResponse.json(
      { message: "You do not have permission to admit patients." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = admitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Patient must belong to this hospital
    const patient = await prisma.patient.findFirst({
      where: { id: data.patientId, hospitalId: session.hospitalId },
      select: { id: true },
    });
    if (!patient) {
      return NextResponse.json(
        { message: "Patient not found in your hospital" },
        { status: 404 }
      );
    }

    // Bed must exist in a ward of this hospital and be available
    const bed = await prisma.bed.findFirst({
      where: {
        id: data.bedId,
        ward: { hospitalId: session.hospitalId },
      },
      include: {
        ward: { select: { id: true, name: true } },
      },
    });
    if (!bed) {
      return NextResponse.json(
        { message: "Bed not found in your hospital" },
        { status: 404 }
      );
    }
    if (bed.status !== "AVAILABLE") {
      return NextResponse.json(
        { message: `Bed ${bed.bedNumber} is not available (currently ${bed.status.toLowerCase()}).` },
        { status: 400 }
      );
    }

    // Patient must not already be currently admitted
    const activeAdmission = await prisma.admission.findFirst({
      where: {
        patientId: data.patientId,
        status: "ACTIVE",
      },
      select: { id: true, admissionNo: true },
    });
    if (activeAdmission) {
      return NextResponse.json(
        {
          message: `This patient is already admitted (${activeAdmission.admissionNo}). Discharge them first.`,
        },
        { status: 400 }
      );
    }

    // Generate unique admission number
    let admissionNo = generateAdmissionNo();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.admission.findUnique({
        where: { admissionNo },
      });
      if (!existing) break;
      admissionNo = generateAdmissionNo();
      attempts++;
    }

    // Create admission + flip bed to OCCUPIED in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const admission = await tx.admission.create({
        data: {
          admissionNo,
          patientId: data.patientId,
          bedId: data.bedId,
          hospitalId: session.hospitalId,
          admittedById: session.userId,
          reason: data.reason?.trim() || null,
          notes: data.notes?.trim() || null,
          expectedDischargeAt: data.expectedDischargeAt
            ? new Date(data.expectedDischargeAt)
            : null,
          status: "ACTIVE",
        },
        include: {
          patient: {
            select: {
              id: true,
              patientCode: true,
              firstName: true,
              lastName: true,
            },
          },
          bed: {
            select: {
              id: true,
              bedNumber: true,
              ward: { select: { id: true, name: true } },
            },
          },
        },
      });

      await tx.bed.update({
        where: { id: data.bedId },
        data: { status: "OCCUPIED" },
      });

      return admission;
    });

    return NextResponse.json(
      { message: "Patient admitted successfully", admission: result },
      { status: 201 }
    );
  } catch (err) {
    console.error("[admissions:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}