import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { getSession, unauthorized } from "@/app/lib/auth";

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  doctorId: z.string().min(1, "Doctor is required"),
  department: z.string().min(1, "Department is required"),
  scheduledAt: z.string().min(1, "Date and time are required"),
  duration: z.coerce.number().int().positive().max(480).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

function generateAppointmentCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "AP-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ---- GET /api/appointments ----
export async function GET(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date"); // YYYY-MM-DD
  const doctorId = searchParams.get("doctorId");
  const status = searchParams.get("status");
  const patientId = searchParams.get("patientId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
  );

  const where: any = { hospitalId: session.hospitalId };

  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (status) where.status = status;

  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    where.scheduledAt = { gte: start, lte: end };
  }

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
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
          select: { id: true, fullName: true, role: true },
        },
      },
    }),
    prisma.appointment.count({ where }),
  ]);

  return NextResponse.json({
    data: appointments,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  });
}

// ---- POST /api/appointments ----
export async function POST(req: NextRequest) {
  const session = getSession(req);
  if (!session) return unauthorized();

  try {
    const body = await req.json();
    const parsed = createAppointmentSchema.safeParse(body);

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

    // Confirm the patient belongs to this hospital
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

    // Confirm the doctor belongs to this hospital and has DOCTOR role
    const doctor = await prisma.user.findFirst({
      where: {
        id: data.doctorId,
        hospitalId: session.hospitalId,
        role: "DOCTOR",
        isActive: true,
      },
      select: { id: true },
    });
    if (!doctor) {
      return NextResponse.json(
        { message: "Doctor not found in your hospital" },
        { status: 404 }
      );
    }

    // Generate a unique appointment code
    let appointmentCode = generateAppointmentCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.appointment.findUnique({
        where: { appointmentCode },
      });
      if (!existing) break;
      appointmentCode = generateAppointmentCode();
      attempts++;
    }

    const appointment = await prisma.appointment.create({
      data: {
        appointmentCode,
        patientId: data.patientId,
        doctorId: data.doctorId,
        hospitalId: session.hospitalId,
        createdById: session.userId,
        department: data.department,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration ?? 30,
        reason: data.reason || null,
        notes: data.notes || null,
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
        doctor: {
          select: { id: true, fullName: true },
        },
      },
    });

    return NextResponse.json(
      { message: "Appointment booked successfully", appointment },
      { status: 201 }
    );
  } catch (err) {
    console.error("[appointments:create] error:", err);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}