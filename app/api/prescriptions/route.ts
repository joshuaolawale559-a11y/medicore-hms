import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        drugId: z.string().min(1, "Drug is required"),
        dosage: z.string().min(1, "Dosage is required"),
        frequency: z.string().min(1, "Frequency is required"),
        duration: z.string().min(1, "Duration is required"),
        quantity: z.coerce.number().int().positive("Quantity must be positive"),
        instructions: z.string().optional(),
      })
    )
    .min(1, "At least one drug is required"),
});

function generatePrescriptionNo() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "RX-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---- GET /api/prescriptions ----
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const patientId = searchParams.get("patientId");
  const doctorId = searchParams.get("doctorId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
  );

  const where: any = { hospitalId: session.hospitalId };
  if (status) where.status = status;
  if (patientId) where.patientId = patientId;
  if (doctorId) where.doctorId = doctorId;

  const [prescriptions, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
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
        doctor: {
          select: { id: true, fullName: true },
        },
        _count: { select: { items: true } },
      },
    }),
    prisma.prescription.count({ where }),
  ]);

  return NextResponse.json({
    data: prescriptions,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

// ---- POST /api/prescriptions ----
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  if (!["ADMIN", "DOCTOR"].includes(session.role)) {
    return NextResponse.json(
      { message: "Only doctors and admins can write prescriptions." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = createPrescriptionSchema.safeParse(body);

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

    // Verify all drug IDs exist in this hospital
    const drugIds = data.items.map((i) => i.drugId);
    const drugs = await prisma.drug.findMany({
      where: {
        id: { in: drugIds },
        hospitalId: session.hospitalId,
        isActive: true,
      },
      select: { id: true },
    });
    const foundIds = new Set(drugs.map((d) => d.id));
    const missing = drugIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      return NextResponse.json(
        {
          message: `One or more drugs are not available in your hospital's catalog.`,
        },
        { status: 404 }
      );
    }

    // Generate unique prescription number
    let prescriptionNo = generatePrescriptionNo();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.prescription.findUnique({
        where: { prescriptionNo },
      });
      if (!existing) break;
      prescriptionNo = generatePrescriptionNo();
      attempts++;
    }

    const prescription = await prisma.$transaction(async (tx) => {
      const rx = await tx.prescription.create({
        data: {
          prescriptionNo,
          patientId: data.patientId,
          doctorId: session.userId,
          hospitalId: session.hospitalId,
          diagnosis: data.diagnosis?.trim() || null,
          notes: data.notes?.trim() || null,
          status: "PENDING",
        },
      });

      await tx.prescriptionItem.createMany({
        data: data.items.map((i) => ({
          prescriptionId: rx.id,
          drugId: i.drugId,
          dosage: i.dosage.trim(),
          frequency: i.frequency.trim(),
          duration: i.duration.trim(),
          quantity: i.quantity,
          instructions: i.instructions?.trim() || null,
        })),
      });

      return tx.prescription.findUnique({
        where: { id: rx.id },
        include: {
          patient: {
            select: {
              id: true,
              patientCode: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: { select: { id: true, fullName: true } },
          items: {
            include: {
              drug: {
                select: {
                  id: true,
                  name: true,
                  strength: true,
                  form: true,
                },
              },
            },
          },
        },
      });
    });

    return NextResponse.json(
      { message: "Prescription created", prescription },
      { status: 201 }
    );
  } catch (err) {
    console.error("[prescriptions:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}